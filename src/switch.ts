import type { Libp2p, Message } from '@libp2p/interface'
import { Libp2pServices, NetSwitch } from "./type"
import { Channel } from "queueable"
import { decode, encode } from "cborg"
import { peerIdFromString } from "@libp2p/peer-id"
import { defaultLibp2p } from "./libp2p"

// 用于同步的通用网络交换机
export const newNetSwitch = async <T>(syncID: string, node?: Libp2p<Libp2pServices>): Promise<NetSwitch<T>> => {
    const libp2p = node ?? await defaultLibp2p()
    const chan = new Channel<{ id: string, data: T }>()
    const protocol = `/loro/v0/${syncID}`
    const msgListener = async (msg: CustomEvent<Message>) => {
        if (msg.detail.type === "signed" && msg.detail.topic === syncID) {
            await chan.push({ id: msg.detail.from.toString(), data: decode(msg.detail.data) })
        }
    }

    libp2p.services.pubsub.subscribe(syncID)

    await libp2p.handle(protocol, async (stream) => {
        for await (const data of stream.stream.source) {
            await chan.push({ id: stream.connection.remotePeer.toString(), data: decode(data.subarray()) })
        }
    })

    libp2p.services.pubsub.addEventListener('message', msgListener)

    return {
        // 接收消息队列
        messagebox: chan.wrap(),
        // 获取频道内的所有对等端
        peers() {
            return libp2p.services.pubsub.getSubscribers(syncID).map(peer => peer.toString())
        },
        // 对频道内的对等端进行单播
        async unicast(id, data) {
            const stream = await libp2p.dialProtocol(peerIdFromString(id), protocol)
            await stream.sink([encode(data)])
        },
        // 频道广播
        async broadcast(data) {
            await libp2p.services.pubsub.publish(syncID, encode(data), { allowPublishToZeroTopicPeers: true })
        },
        // 停止网络
        async close() {
            libp2p.services.pubsub.removeEventListener("message", msgListener)
            await libp2p.unhandle(protocol)
            libp2p.services.pubsub.unsubscribe(syncID)
            chan.return()
        },
    }
}