import { createHelia, libp2pDefaults } from "helia"
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { Libp2p } from "@libp2p/interface"
import { Libp2pServices } from "./type"

// 默认为带 PUBSUB 的 IPFS 节点
export const defaultLibp2p = async () => {
    const defaultConfig = libp2pDefaults()
    defaultConfig.services = { pubsub: gossipsub(), ...defaultConfig.services }
    const helia = await createHelia<Libp2p<Libp2pServices>>({
        libp2p: defaultConfig
    })
    return helia.libp2p
}