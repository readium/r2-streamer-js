import * as fs from "fs";
import * as path from "path";

import * as debug_ from "debug";
import * as filehound from "filehound";

import { Server } from "./server";

const debug = debug_("r2:server:cli");

debug(`process.cwd(): ${process.cwd()}`);
debug(`__dirname: ${__dirname}`);

const args = process.argv.slice(2);
debug("process.argv.slice(2): %o", args);

let filePath = args[0];
if (!filePath) {
    debug("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}

filePath = filePath.trim();
debug(`path: ${filePath}`);

if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, filePath);
    debug(`path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), filePath);
        debug(`path: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            debug("FILEPATH DOES NOT EXIST.");
            process.exit(1);
        }
    }
}

filePath = fs.realpathSync(filePath);
debug(`path (normalized): ${filePath}`);

const stats = fs.lstatSync(filePath);

if (!stats.isFile() && !stats.isDirectory()) {
    debug("FILEPATH MUST BE FILE OR DIRECTORY.");
    process.exit(1);
}

if (stats.isDirectory()) {
    debug("Analysing directory...");

    // tslint:disable-next-line:no-floating-promises
    (async () => {
        const files: string[] = await filehound.create()
            .discard("node_modules")
            .depth(5)
            .paths(filePath)
            .ext([".epub", ".cbz"])
            .find();
        const server = new Server();
        server.addPublications(files);
        server.start();
    })();

    // filePaths = fs.readdirSync(filePath);

    // filePaths = filePaths.filter((filep) => {
    //     const fileName = path.basename(filep);
    //     const ext = path.extname(fileName).toLowerCase();
    //     return (ext === ".epub" || ext === ".cbz") &&
    //         fs.lstatSync(path.join(filePath, filep)).isFile();
    // });

    // filePaths = filePaths.map((filep) => {
    //     return path.join(filePath, filep);
    // });

    // debug("Publications:");
    // filePaths.forEach((filep) => {
    //     debug(filep);
    // });
} else {
    const server = new Server();
    server.addPublications([filePath]);
    server.start();
}
