import axios from "axios";
import {
    Writable
} from "stream";

import {
    pipeline
} from "stream/promises";

const API_01 = "http://localhost:3000"
const API_02 = "http://localhost:4000"


const requests = await Promise.all([
    axios({
        method: "get",
        url: API_01,
        responseType: "stream"
    }),

    axios({
        method: "get",
        url: API_02,
        responseType: "stream"
    })
])

const results = requests.map(({
    data
}) => data);

const output = Writable({
    write(chunk, enc, callback) {
        const data = chunk.toString().replace(/\n/, "")
        const name = data.match(/:"(?<name>.*)(?=-)/).groups.name
        console.log(`[${name.toLocaleLowerCase()}] ${data}`)
        callback()
    }
})

//writable stream
async function output(streams) {
    for await (const data of streams) {
        const name = data.match(/:"(?<name>.*)(?=-)/).groups.name
        console.log(`[${name.toLocaleLowerCase()}] ${data}`)
    }
}

///passThrough stream
async function merge(streams) {
    for (const readable of streams) {
        readable.setEncoding("utf8");
        for await (const chunk of readable) {
            for (const line of chunk.trim().split(/\n/)) {
                yield line
            }
        }
    }
}

await pipeline(
    merge(results),
    output
)