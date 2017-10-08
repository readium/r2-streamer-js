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
// https://github.com/electron/electron/blob/master/docs/api/dialog.md

import * as crypto from "crypto";
import * as express from "express";
import * as fs from "fs";
import * as path from "path";

import { encodeURIComponent_RFC3986 } from "@utils/http/UrlUtils";
import * as debug_ from "debug";
import { BrowserWindow, Menu, app, dialog, session } from "electron";
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

const defaultBookPath = fs.realpathSync(path.resolve("./misc/epubs/"));
let lastBookPath: string | undefined;

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
            webviewTag: true,
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
            debug("electronBrowserWindow NOT FOUND?!");
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
        _publicationsFilePaths = await filehound.create()
            .paths(defaultBookPath)
            .ext([".epub", ".epub3", ".cbz"])
            .find();
        debug(_publicationsFilePaths);

        _publicationsServer = new Server({
            disableDecryption: false,
            disableReaders: false,
        });

        // https://expressjs.com/en/4x/api.html#express.static
        const staticOptions = {
            etag: false,
        };
        _publicationsServer.expressUse("/readium-css", express.static("misc/ReadiumCSS", staticOptions));

        _publicationsServer.expressGet(["/sw.js"],
            (req: express.Request, res: express.Response) => {

                const swPth = "./renderer/sw/service-worker.js";
                const swFullPath = path.resolve(path.join(__dirname, swPth));
                if (!fs.existsSync(swFullPath)) {

                    const err = "Missing Service Worker JS! ";
                    debug(err + swFullPath);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }

                const swJS = fs.readFileSync(swFullPath, { encoding: "utf8" });
                // debug(swJS);

                // this.setResponseCORS(res);
                res.set("Content-Type", "text/javascript; charset=utf-8");

                const checkSum = crypto.createHash("sha256");
                checkSum.update(swJS);
                const hash = checkSum.digest("hex");

                const match = req.header("If-None-Match");
                if (match === hash) {
                    debug("service-worker.js cache");
                    res.status(304); // StatusNotModified
                    res.end();
                    return;
                }

                res.setHeader("ETag", hash);

                // res.setHeader("Cache-Control", "public,max-age=86400");

                res.status(200).send(swJS);
            });

        const pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);

        _publicationsServerPort = await portfinder.getPortPromise();
        _publicationsRootUrl = _publicationsServer.start(_publicationsServerPort);

        _publicationsUrls = pubPaths.map((pubPath) => {
            return `${_publicationsRootUrl}${pubPath}`;
        });
        debug(_publicationsUrls);

        resetMenu();
    })();
});

function resetMenu() {

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

    menuTemplate[0].submenu.push({
        click: () => {
            const choice = dialog.showOpenDialog({
                defaultPath: lastBookPath || defaultBookPath,
                filters: [
                    { name: "EPUB publication", extensions: ["epub", "epub3"] },
                    { name: "Comic book", extensions: ["cbz"] },
                    // {name: "Zip archive", extensions: ["zip"]},
                    // {name: "Any file", extensions: ["*"]},
                ],
                message: "Choose a file",
                properties: ["openFile"],
                title: "Load a publication",
            });
            if (!choice || !choice.length) {
                return;
            }
            debug(choice[0]);

            lastBookPath = path.dirname(choice[0]);
            debug(lastBookPath);

            let n = _publicationsFilePaths.indexOf(choice[0]);
            if (n < 0) {
                const publicationPaths = _publicationsServer.addPublications(choice);
                debug(publicationPaths);

                _publicationsFilePaths.push(choice[0]);
                debug(_publicationsFilePaths);

                _publicationsUrls.push(`${_publicationsRootUrl}${publicationPaths[0]}`);
                debug(_publicationsUrls);

                n = _publicationsFilePaths.length - 1; // === _publicationsUrls.length - 1

                process.nextTick(() => {
                    resetMenu();
                });
            }

            const file = _publicationsFilePaths[n];
            const pubManifestUrl = _publicationsUrls[n];
            createElectronBrowserWindow(file, pubManifestUrl);
        },
        label: "Open file...",
    } as any);

    _publicationsUrls.forEach((pubManifestUrl, n) => {
        const file = _publicationsFilePaths[n];
        debug("MENU ITEM: " + file + " : " + pubManifestUrl);

        menuTemplate[0].submenu.push({
            click: () => {
                createElectronBrowserWindow(file, pubManifestUrl);
            },
            label: file, // + " : " + pubManifestUrl,
        } as any);
    });
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

app.on("activate", () => {
    debug("app activate");
});

app.on("quit", () => {
    debug("app quit");

    _publicationsServer.stop();
});
