import { Loro, LoroList } from "loro-crdt"
import { sync } from "./src"

const a = new Loro()
const stop = await sync(a, "testloro111")

const map = a.getMap("map");
const list = map.setContainer("list221", new LoroList());

let i = 0

setInterval(async () => {
    list.push(i);
    a.commit()
    i++
    console.log(a.toJSON())

    if (i > 10) {
        await stop()
    }
}, 3000)