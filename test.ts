import { Loro, LoroList } from "loro-crdt"
import { syncLoro } from "./src"

const a = new Loro()
console.log(a.peerIdStr)
syncLoro(a, "testloro111")

const map = a.getMap("map");
const list = map.setContainer("list221", new LoroList());

let i = 0

setInterval(() => {
    list.push(i);
    a.commit()
    i++
    console.log(a.toJSON())
}, 3000)