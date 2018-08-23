// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";
import * as path from "path";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import {
    initGlobalConverters_OPDS,
} from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC,
    initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";
import * as debug_ from "debug";
import * as filehound from "filehound";

import { Server } from "./server";

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

setLcpNativePluginPath(path.join(process.cwd(), "LCP", "lcp.node"));

const debug = debug_("r2:streamer#http/server-cli");

debug(`process.cwd(): ${process.cwd()}`);
debug(`__dirname: ${__dirname}`);

const args = process.argv.slice(2);
debug("process.argv.slice(2): %o", args);

if (!args[0]) {
    debug("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}

const argPath = args[0].trim();
let filePath = argPath;
debug(`path: ${filePath}`);

if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, argPath);
    debug(`path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), argPath);
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

// /\.epub[3]?$/.test(ext)
const isEPUB = fs.existsSync(path.join(filePath, "META-INF", "container.xml"));

if (stats.isDirectory() && !isEPUB) {
    debug("Analysing directory...");

    // tslint:disable-next-line:no-floating-promises
    (async () => {
        const files: string[] = await filehound.create()
            .discard("node_modules")
            .depth(5)
            .paths(filePath)
            .ext([".epub", ".epub3", ".cbz"])
            .find();
        const server = new Server();
        server.preventRobots();
        server.addPublications(files);
        const url = await server.start(0, false);
        debug(url);
    })();

    // filePaths = fs.readdirSync(filePath);

    // filePaths = filePaths.filter((filep) => {
    //     const fileName = path.basename(filep);
    //     const ext = path.extname(fileName).toLowerCase();
    //     return (/\.epub[3]?$/.test(ext) || ext === ".cbz") &&
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
    // tslint:disable-next-line:no-floating-promises
    (async () => {
        const server = new Server();
        server.preventRobots();
        server.addPublications([filePath]);
        const url = await server.start(0, false);
        debug(url);
    })();
}
