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
import { BrowserWindow, Menu, app, session } from "electron";
import * as filehound from "filehound";
import * as portfinder from "portfinder";

import { Server } from "../http/server";
import { initGlobals } from "../init-globals";

// import * as mime from "mime-types";

initGlobals();

const debug = debug_("r2:electron:main");

let _publicationsServer: Server;
let _publicationsServerPort: number;
let _publicationsRootUrl: string;
let _publicationsFilePaths: string[];
let _publicationsUrls: string[];

let _electronBrowserWindows: Electron.BrowserWindow[];

// protocol.registerStandardSchemes(["epub", "file"], { secure: true });

function createElectronBrowserWindow(publicationFilePath: string, publicationUrl: string) {

    debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);

    const electronBrowserWindow = new BrowserWindow({
        height: 600,
        webPreferences: {
            allowRunningInsecureContent: false,
            contextIsolation: false,
            devTools: true,
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            sandbox: false,
            webSecurity: true,
            // preload: __dirname + "/" + "preload.js",
        },
        width: 800,
    });
    if (!_electronBrowserWindows) {
        _electronBrowserWindows = [];
    }
    _electronBrowserWindows.push(electronBrowserWindow);

    electronBrowserWindow.webContents.on("dom-ready", () => {
        debug("electronBrowserWindow dom-ready " + publicationFilePath + " : " + publicationUrl);
        electronBrowserWindow.webContents.openDevTools();
    });

    electronBrowserWindow.on("closed", () => {
        debug("electronBrowserWindow closed " + publicationFilePath + " : " + publicationUrl);
        const i = _electronBrowserWindows.indexOf(electronBrowserWindow);
        if (i < 0) {
            console.log("electronBrowserWindow NOT FOUND?!");
            return;
        }
        _electronBrowserWindows.splice(i, 1);
    });

    const urlEncoded = encodeURIComponent_RFC3986(publicationUrl);
    const fullUrl = `file://${__dirname}/renderer/index.html?pub=${urlEncoded}`;
    // `file://${process.cwd()}/src/electron/renderer/index.html`;
    // `file://${__dirname}/../../../../src/electron/renderer/index.html`
    debug(fullUrl);
    electronBrowserWindow.webContents.loadURL(fullUrl);
}

app.on("window-all-closed", () => {
    debug("app window-all-closed");
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    debug("app ready");

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

        // const proto = session.defaultSession.protocol;

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
        _publicationsFilePaths = await filehound.create()
            .paths(dirPath)
            .ext([".epub", ".epub3", ".cbz"])
            .find();
        debug(_publicationsFilePaths);

        _publicationsServer = new Server();
        const pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);

        _publicationsServerPort = await portfinder.getPortPromise();
        _publicationsRootUrl = _publicationsServer.start(_publicationsServerPort);

        _publicationsUrls = pubPaths.map((pubPath) => {
            return `${_publicationsRootUrl}${pubPath}`;
        });
        debug(_publicationsUrls);

        const menuTemplate = [
            {
                label: "Electron R2",
                submenu: [
                    {
                        accelerator: "Command+Q",
                        click: () => { app.quit(); },
                        label: "Quit",
                    },
                ],
            },
        ];

        _publicationsUrls.forEach((pubManifestUrl, n) => {
            const file = _publicationsFilePaths[n];
            console.log("MENU ITEM: " + file + " : " + pubManifestUrl);

            menuTemplate[0].submenu.push({
                click: () => {
                    createElectronBrowserWindow(file, pubManifestUrl);
                },
                label: file, // + " : " + pubManifestUrl,
            } as any);
        });
        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);

    })();
});

app.on("activate", () => {
    debug("app activate");
});

app.on("quit", () => {
    debug("app quit");

    _publicationsServer.stop();
});
