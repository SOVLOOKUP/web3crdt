import { GossipSub } from "@chainsafe/libp2p-gossipsub"
import { DefaultLibp2pServices } from "helia"

export interface NetSwitch<T = any> {
    peers(): string[]
    messagebox: AsyncIterable<{ id: string, data: T }>
    unicast(id: string, data: T): Promise<void>
    broadcast(data: T): Promise<void>
    close(): Promise<void>
}

export interface Libp2pServices extends DefaultLibp2pServices {
    pubsub: GossipSub
}