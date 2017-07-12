// https://github.com/electron/electron/blob/master/docs/api/sandbox-option.md
// https://github.com/electron/electron/blob/master/docs/api/process.md
// https://github.com/electron/electron/blob/master/docs/api/browser-window.md
// https://github.com/electron/electron/blob/master/docs/api/protocol.md
// https://github.com/electron/electron/blob/master/docs/api/web-frame.md
// https://github.com/electron/electron/blob/master/docs/api/web-contents.md
// https://github.com/electron/electron/blob/master/docs/api/web-request.md
// https://github.com/electron/electron/blob/master/docs/api/session.md
// https://github.com/electron/electron/blob/master/docs/api/webview-tag.md
// https://github.com/electron/electron/blob/master/docs/api/browser-view.md
// https://github.com/electron/electron/blob/master/docs/api/client-request.md
// https://github.com/electron/electron/blob/master/docs/api/sandbox-option.md

import * as fs from "fs";
import * as path from "path";

import { encodeURIComponent_RFC3986 } from "@utils/http/UrlUtils";
import * as debug_ from "debug";
import { BrowserWindow, app, session } from "electron";
import * as filehound from "filehound";
import * as portfinder from "portfinder";

import { Server } from "../http/server";
import { initGlobals } from "../init-globals";

// import * as mime from "mime-types";

initGlobals();

const debug = debug_("r2:electron:main");

let electronBrowserWindow: Electron.BrowserWindow | undefined;

// protocol.registerStandardSchemes(["epub", "file"], { secure: true });

function createElectronBrowserWindow() {

    debug("createElectronBrowserWindow()");

    // const proto = session.defaultSession.protocol;

    // protocol.registerServiceWorkerSchemes(["epub"]);

    // registerFileProtocol
    // protocol.registerBufferProtocol("epub",
    //     (request, callback) => {
    //         debug(request.url);
    //         const data = fs.readFileSync(request.url);
    //         const mimeType = mime.lookup(request.url);
    //         callback({ data, mimeType });
    //     }, (error) => {
    //         debug(error);
    //     });

    if (session.defaultSession) {
        session.defaultSession.clearStorageData({
            origin: "*",
            quotas: [
                "temporary",
                "persistent",
                "syncable"],
            storages: [
                "appcache",
                "cookies",
                "filesystem",
                "indexdb",
                "localstorage",
                "shadercache",
                "websql",
                "serviceworkers"],
        });
    }

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

        electronBrowserWindow = new BrowserWindow({
            height: 600,
            webPreferences: {
                allowRunningInsecureContent: false,
                contextIsolation: false,
                devTools: true,
                nodeIntegration: true,
                nodeIntegrationInWorker: true,
                sandbox: false,
                webSecurity: true,
                // preload: __dirname + "/" + "preload.js",
            },
            width: 800,
        });

        // electronBrowserWindow.loadURL(url);
        const urlEncoded = encodeURIComponent_RFC3986(url);
        electronBrowserWindow.loadURL(`file://${__dirname}/index.html?pub=${urlEncoded}`);

        electronBrowserWindow.webContents.on("dom-ready", () => {
            debug("electronBrowserWindow dom-ready");
            if (electronBrowserWindow) {
                electronBrowserWindow.webContents.openDevTools();
            }
        });

        electronBrowserWindow.on("closed", () => {
            debug("electronBrowserWindow closed");
            electronBrowserWindow = undefined;
            server.stop();
        });
    })();
}

app.on("window-all-closed", () => {
    debug("app window-all-closed");
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    debug("app ready");
    createElectronBrowserWindow();
});

app.on("activate", () => {
    debug("app activate");
    if (!electronBrowserWindow) {
        createElectronBrowserWindow();
    }
});
