import { Loro, VersionVector } from "loro-crdt"
import { draw } from "radash"
import { newNetSwitch } from './switch'
import { Libp2pServices } from "./type"
import { Libp2p } from "@libp2p/interface"

// (todo 批量防抖 批量广播/批量接收)
// 同步 Loro 对象
const syncLoro = async (loro: Loro, syncID: string, libp2p?: Libp2p<Libp2pServices>) => {
    const swt = await newNetSwitch<{ version: Uint8Array, updates?: Uint8Array }>(syncID, libp2p)

    // 随机选择一个 peer 比对版本信息
    const setTO = () => setTimeout(async () => {
        const peers = swt.peers()
        const id = draw(peers)
        if (id) {
            const version = loro.version().encode()
            await swt.unicast(id, { version })
        }
        randomSyncer = setTO()
    },
        // 随着集群规模自动调整频率
        swt.peers().length * 1000 + 1000)

    let randomSyncer: NodeJS.Timeout = setTO()

    // 监听变动
    const subscriber = loro.subscribe(async (e) => {
        if (e.by === "local") {
            const updates = loro.exportFrom()
            await swt.broadcast({ version: loro.version().encode(), updates })
        }
    })

    // 异步接受更新
    Promise.resolve().then(async () => {
        for await (const data of swt.messagebox) {
            const { version, updates } = data.data
            if (updates) {
                loro.import(updates)
            }
            const v = VersionVector.decode(version)
            const mv = loro.version()
            const c = mv.compare(v) ?? 0
            // 如果有不一致，则进行同步
            if (c > 0) {
                // 本地更先进, 则送去更新
                const updates = loro.exportFrom(v)
                await swt.unicast(data.id, { version: mv.encode(), updates })
            } else if (c < 0) {
                // 本地还是落后, 则要求更新
                await swt.unicast(data.id, { version })
            }
        }
    })

    // 停止函数
    return async () => {
        clearInterval(randomSyncer)
        loro.unsubscribe(subscriber)
        await swt.close()
    }
}

export { syncLoro };
