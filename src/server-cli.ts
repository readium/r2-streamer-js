import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";

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

let filePaths = [filePath];

if (stats.isDirectory()) {
    debug("Analysing directory...");

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

    debug("Publications:");
    filePaths.forEach((filep) => {
        debug(filep);
    });
}

// SmokeTestFXL.epub
// EPUB:
// https://rawgit.com/readium/readium-test-files/master/functional/smoke-tests/SmokeTestFXL/SmokeTestFXL.epub
// SOURCE:
// https://github.com/readium/readium-test-files/tree/master/functional/smoke-tests/SmokeTestFXL

// SmokeTest-EPUB2.epub
// EPUB:
// https://rawgit.com/readium/readium-test-files/master/functional/smoke-tests/SmokeTest-EPUB2/SmokeTest-EPUB2.epub
// SOURCE:
// https://github.com/readium/readium-test-files/tree/master/functional/smoke-tests/SmokeTest-EPUB2

filePaths.push("https://readium.firebaseapp.com/epub_content/epubReadingSystem.epub");
filePaths.push("https://readium.firebaseapp.com/epub_content/internal_link.epub");

const server = new Server();
server.addPublications(filePaths);
