import * as fs from "fs";
import * as path from "path";

import { IZip } from "./parser/zip";
import { Zip1 } from "./parser/zip1";
import { Zip2 } from "./parser/zip2";

console.log("process.cwd():");
console.log(process.cwd());

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

let filePath = args[0];
if (!filePath) {
    console.log("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}

filePath = filePath.trim();
console.log(filePath);
if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, filePath);
    console.log(filePath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), filePath);
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            console.log("FILEPATH DOES NOT EXIST.");
            process.exit(1);
        }
    }
}

const fileName = path.basename(filePath);
const ext = path.extname(fileName).toLowerCase();

if (ext === ".epub" || ext === ".cbz") {
    (async () => {
        const time1 = process.hrtime();
        const zip1: IZip = await Zip1.loadPromise(filePath);
        const diff1 = process.hrtime(time1);
        // const nanos = diff1[0] * 1e9 + diff1[1];
        console.log(`Zip 1 (${zip1.entriesCount()}): ${diff1[0]} seconds + ${diff1[1]} nanoseconds`);

        const time2 = process.hrtime();
        const zip2: IZip = await Zip2.loadPromise(filePath);
        const diff2 = process.hrtime(time2);
        console.log(`Zip 2 (${zip2.entriesCount()}): ${diff2[0]} seconds + ${diff2[1]} nanoseconds`);
    })();
}
