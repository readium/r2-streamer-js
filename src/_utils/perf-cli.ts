import * as fs from "fs";
import * as path from "path";

import { IZip } from "@utils/zip/zip";
import { Zip1 } from "@utils/zip/zip1";
import { Zip2 } from "@utils/zip/zip2";
import { Zip3 } from "@utils/zip/zip3";

import { setLcpNativePluginPath } from "@parser/epub/lcp";
import { initGlobals } from "../init-globals";

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP", "lcp.node"));

console.log("process.cwd():");
console.log(process.cwd());

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

if (!args[0]) {
    console.log("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}
const argPath = args[0].trim();
let filePath = argPath;
console.log(filePath);
if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, argPath);
    console.log(filePath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), argPath);
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            console.log("FILEPATH DOES NOT EXIST.");
            process.exit(1);
        }
    }
}

const fileName = path.basename(filePath);
const ext = path.extname(fileName).toLowerCase();

if (/\.epub[3]?$/.test(ext) || ext === ".cbz" || ext === ".zip") {
    // tslint:disable-next-line:no-floating-promises
    (async () => {
        const time3 = process.hrtime();
        const zip3: IZip = await Zip3.loadPromise(filePath);
        const diff3 = process.hrtime(time3);
        console.log(`Zip 3 (${zip3.entriesCount()}): ${diff3[0]} seconds + ${diff3[1]} nanoseconds`);

        const time2 = process.hrtime();
        const zip2: IZip = await Zip2.loadPromise(filePath);
        const diff2 = process.hrtime(time2);
        console.log(`Zip 2 (${zip2.entriesCount()}): ${diff2[0]} seconds + ${diff2[1]} nanoseconds`);

        const time1 = process.hrtime();
        const zip1: IZip = await Zip1.loadPromise(filePath);
        const diff1 = process.hrtime(time1);
        // const nanos = diff1[0] * 1e9 + diff1[1];
        console.log(`Zip 1 (${zip1.entriesCount()}): ${diff1[0]} seconds + ${diff1[1]} nanoseconds`);
    })();
}
