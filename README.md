# Web3CRDT

Automatically synchronize data between devices using the CRDT algorithm based on IPFS

```ts
import { sync } from "web3crdt"
import { Loro } from "loro-crdt"

const doc = new Loro()
// Device are automatically connected to the IPFS network 
// All docs with the same sync ID will be automatically synchronized
await sync(doc, "your-sync-id")
```
