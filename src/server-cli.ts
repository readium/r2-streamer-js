import * as fs from "fs";
import * as path from "path";

import { launchServer } from "./server";

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

filePath = fs.realpathSync(filePath);
console.log(filePath);

const stats = fs.lstatSync(filePath);

if (!stats.isFile() && !stats.isDirectory()) {
    console.log("FILEPATH MUST BE FILE OR DIRECTORY.");
    process.exit(1);
}

let filePaths = [filePath];

if (stats.isDirectory()) {
    filePaths = fs.readdirSync(filePath);

    filePaths = filePaths.filter((filep) => {
        const fileName = path.basename(filep);
        const ext = path.extname(fileName).toLowerCase();
        return (ext === ".epub" || ext === ".cbz") &&
            fs.lstatSync(path.join(filePath, filep)).isFile();
    });

    filePaths = filePaths.map((filep) => {
        return path.join(filePath, filep);
    });

    filePaths.forEach((filep) => {
        console.log(filep);
    });
}

launchServer(filePaths);
