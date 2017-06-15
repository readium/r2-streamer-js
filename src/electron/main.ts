import * as fs from "fs";
import * as path from "path";

import * as debug_ from "debug";
import { BrowserWindow, app } from "electron";
import * as filehound from "filehound";

import { Server } from "../http/Server";

const debug = debug_("r2:electron:main");

let electronBrowserWindow: Electron.BrowserWindow | undefined;

function createElectronBrowserWindow() {

    debug("Server start, Electron main window ...");
    (async () => {
        const dirPath = fs.realpathSync(path.resolve("./misc/epubs/"));
        const files: string[] = await filehound.create()
            .paths(dirPath)
            .ext([".epub", ".cbz"])
            .find();

        const server = new Server();
        server.addPublications(files);
        const url = server.start();

        electronBrowserWindow = new BrowserWindow({ width: 800, height: 600 });

        electronBrowserWindow.loadURL(url);
        electronBrowserWindow.webContents.openDevTools();

        electronBrowserWindow.on("closed", () => {
            electronBrowserWindow = undefined;
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
