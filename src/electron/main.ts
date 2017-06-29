import * as fs from "fs";
import * as path from "path";

import * as debug_ from "debug";
import { BrowserWindow, app } from "electron";
import * as filehound from "filehound";
import * as portfinder from "portfinder";

import { Server } from "../http/server";

const debug = debug_("r2:electron:main");

let electronBrowserWindow: Electron.BrowserWindow | undefined;

function createElectronBrowserWindow() {

    debug("Server start, Electron main window ...");

    // tslint:disable-next-line:no-floating-promises
    (async () => {
        const dirPath = fs.realpathSync(path.resolve("./misc/epubs/"));
        const files: string[] = await filehound.create()
            .paths(dirPath)
            .ext([".epub", ".epub3", ".cbz"])
            .find();

        const server = new Server();
        const pubPaths = server.addPublications(files);

        const port = await portfinder.getPortPromise();
        const url = server.start(port);

        const pubManifestUrls = pubPaths.map((pubPath) => {
            return `${url}${pubPath}`;
        });
        debug(pubManifestUrls);

        electronBrowserWindow = new BrowserWindow({ width: 800, height: 600 });

        electronBrowserWindow.loadURL(url);
        electronBrowserWindow.webContents.openDevTools();

        electronBrowserWindow.on("closed", () => {
            debug("Server stop ...");
            electronBrowserWindow = undefined;
            server.stop();
        });
    })();
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    createElectronBrowserWindow();
});

app.on("activate", () => {
    if (!electronBrowserWindow) {
        createElectronBrowserWindow();
    }
});
