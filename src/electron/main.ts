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
// https://github.com/electron/electron/blob/master/docs/api/ipc-renderer.md

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import { Publication } from "@models/publication";
import { LCP } from "@parser/epub/lcp";
import { encodeURIComponent_RFC3986 } from "@utils/http/UrlUtils";
import { injectInZip } from "@utils/zip/zipInjector";
import * as debug_ from "debug";
import { BrowserWindow, Menu, app, dialog, ipcMain, session, webContents } from "electron";
import * as express from "express";
import * as filehound from "filehound";
import * as portfinder from "portfinder";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { JSON as TAJSON } from "ta-json";

import { Server } from "../http/server";
import { initGlobals } from "../init-globals";
import { R2_EVENT_DEVTOOLS, R2_EVENT_LINK, R2_EVENT_TRY_LCP_PASS, R2_EVENT_TRY_LCP_PASS_RES } from "./common/events";
import { R2_SESSION_WEBVIEW } from "./common/sessions";

// import * as mime from "mime-types";

initGlobals();

const debug = debug_("r2:electron:main");

let _publicationsServer: Server;
let _publicationsServerPort: number;
let _publicationsRootUrl: string;
let _publicationsFilePaths: string[];
let _publicationsUrls: string[];

let _electronBrowserWindows: Electron.BrowserWindow[];

const DEFAULT_BOOK_PATH = fs.realpathSync(path.resolve("./misc/epubs/"));
let _lastBookPath: string | undefined;

// protocol.registerStandardSchemes(["epub", "file"], { secure: true });

app.on("web-contents-created", (_evt, wc) => {
    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (wc.hostWebContents &&
            wc.hostWebContents.id === win.webContents.id) {
            debug("WEBVIEW web-contents-created");

            wc.on("will-navigate", (event, url) => {
                debug("webview.getWebContents().on('will-navigate'");

                // debug(event.sender);
                debug(url);
                const wcUrl = event.sender.getURL();
                debug(wcUrl);
                event.preventDefault();

                // ipcMain.emit
                win.webContents.send(R2_EVENT_LINK, url);
            });
        }
    });
});

function openAllDevTools() {
    for (const wc of webContents.getAllWebContents()) {
        // if (wc.hostWebContents &&
        //     wc.hostWebContents.id === electronBrowserWindow.webContents.id) {
        // }
        wc.openDevTools();
    }
}

// function openTopLevelDevTools() {
//     const bw = BrowserWindow.getFocusedWindow();
//     if (bw) {
//         bw.webContents.openDevTools();
//     } else {
//         const arr = BrowserWindow.getAllWindows();
//         arr.forEach((bww) => {
//             bww.webContents.openDevTools();
//         });
//     }
// }

ipcMain.on(R2_EVENT_DEVTOOLS, (_event: any, _arg: any) => {
    openAllDevTools();
});

ipcMain.on(R2_EVENT_TRY_LCP_PASS, async (event: any, publicationFilePath: string, lcpPass: string) => {
    debug(publicationFilePath);
    debug(lcpPass);
    let okay = false;
    try {
        okay = await tryLcpPass(publicationFilePath, lcpPass);
    } catch (err) {
        debug(err);
        okay = false;
    }
    event.sender.send(R2_EVENT_TRY_LCP_PASS_RES,
        okay,
        (okay ? "LCP okay. (" + lcpPass + ")" : "LCP problem!? (" + lcpPass + ")"));
});

async function tryLcpPass(publicationFilePath: string, lcpPass: string): Promise<boolean> {
    const publication = _publicationsServer.cachedPublication(publicationFilePath);
    if (!publication) {
        return false;
    }
    // TODO: ask user for plain text passphrase, convert to SHA256 hex format,
    // or fetch from persistent storage
    // const lcpPass64 =
    //     "ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg";
    // (this is "dan")
    const checkSum = crypto.createHash("sha256");
    checkSum.update(lcpPass);
    const lcpPassHex = checkSum.digest("hex");
    // const lcpPass64 = new Buffer(hash).toString("base64");
    // const lcpPassHex = new Buffer(lcpPass64, "base64").toString("utf8");
    const okay = await publication.LCP.setUserPassphrase(lcpPassHex); // hex
    if (!okay) {
        debug("FAIL publication.LCP.setUserPassphrase()");
    }
    return okay;
}

async function createElectronBrowserWindow(publicationFilePath: string, publicationUrl: string) {

    debug("createElectronBrowserWindow() " + publicationFilePath + " : " + publicationUrl);

    // const fileName = path.basename(publicationFilePath);
    // const ext = path.extname(fileName).toLowerCase();

    let publication: Publication | undefined;
    try {
        publication = await _publicationsServer.loadOrGetCachedPublication(publicationFilePath);
    } catch (err) {
        debug(err);
    }

    let lcpHint: string | undefined;
    if (publication && publication.LCP) {
        if (publication.LCP.Encryption &&
            publication.LCP.Encryption.UserKey &&
            publication.LCP.Encryption.UserKey.TextHint) {
            lcpHint = publication.LCP.Encryption.UserKey.TextHint;
        }
        if (!lcpHint) {
            lcpHint = "LCP passphrase";
        }
        // TODO: passphrase from cache (persistent storage, user settings)
        // const testLcpPass = "danzzz";
        // const okay = await tryLcpPass(publicationFilePath, testLcpPass);
        // if (okay) {
        //     lcpHint = undefined;
        // }
    }

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

    // electronBrowserWindow.on("resize", () => {
    //     const [width, height] = electronBrowserWindow.getContentSize();

    //     for (const wc of webContents.getAllWebContents()) {
    //         if (wc.hostWebContents &&
    //             wc.hostWebContents.id === electronBrowserWindow.webContents.id) {
    //             wc.setSize({
    //                 normal: {
    //                     height: 400,
    //                     width,
    //                 },
    //             });
    //         }
    //     }
    // });

    electronBrowserWindow.webContents.on("dom-ready", () => {
        debug("electronBrowserWindow dom-ready " + publicationFilePath + " : " + publicationUrl);
        // electronBrowserWindow.webContents.openDevTools();
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
    let fullUrl = `file://${__dirname}/renderer/index.html?pub=${urlEncoded}`;
    if (lcpHint) {
        fullUrl = fullUrl + "&lcpHint=" + lcpHint;
    }
    // `file://${process.cwd()}/src/electron/renderer/index.html`;
    // `file://${__dirname}/../../../../src/electron/renderer/index.html`
    debug(fullUrl);
    electronBrowserWindow.webContents.loadURL(fullUrl, { extraHeaders: "pragma: no-cache\n" });
}

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

    clearSessions(undefined, undefined);

    const sess = getWebViewSession();
    if (sess) {
        sess.setPermissionRequestHandler((wc, permission, callback) => {
            console.log("setPermissionRequestHandler");
            console.log(wc.getURL());
            console.log(permission);
            callback(true);
        });
    }

    // tslint:disable-next-line:no-floating-promises
    (async () => {
        _publicationsFilePaths = await filehound.create()
            .paths(DEFAULT_BOOK_PATH)
            .ext([".epub", ".epub3", ".cbz", ".lcpl"])
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

        // _publicationsServer.expressGet(["/sw.js"],
        //     (req: express.Request, res: express.Response) => {

        //         const swPth = "./renderer/sw/service-worker.js";
        //         const swFullPath = path.resolve(path.join(__dirname, swPth));
        //         if (!fs.existsSync(swFullPath)) {

        //             const err = "Missing Service Worker JS! ";
        //             debug(err + swFullPath);
        //             res.status(500).send("<html><body><p>Internal Server Error</p><p>"
        //                 + err + "</p></body></html>");
        //             return;
        //         }

        //         const swJS = fs.readFileSync(swFullPath, { encoding: "utf8" });
        //         // debug(swJS);

        //         // this.setResponseCORS(res);
        //         res.set("Content-Type", "text/javascript; charset=utf-8");

        //         const checkSum = crypto.createHash("sha256");
        //         checkSum.update(swJS);
        //         const hash = checkSum.digest("hex");

        //         const match = req.header("If-None-Match");
        //         if (match === hash) {
        //             debug("service-worker.js cache");
        //             res.status(304); // StatusNotModified
        //             res.end();
        //             return;
        //         }

        //         res.setHeader("ETag", hash);

        //         // res.setHeader("Cache-Control", "public,max-age=86400");

        //         res.status(200).send(swJS);
        //     });

        const pubPaths = _publicationsServer.addPublications(_publicationsFilePaths);

        _publicationsServerPort = await portfinder.getPortPromise();
        _publicationsRootUrl = _publicationsServer.start(_publicationsServerPort);

        _publicationsUrls = pubPaths.map((pubPath) => {
            return `${_publicationsRootUrl}${pubPath}`;
        });
        debug(_publicationsUrls);

        resetMenu();

        process.nextTick(() => {
            const detail = "Note that this is only a developer application (" +
                "test framework) for the Readium2 NodeJS 'streamer' and Electron-based 'navigator'.";
            const message = "Use the 'Electron' menu to load publications.";

            if (process.platform === "darwin") {
                const choice = dialog.showMessageBox({
                    buttons: ["&OK"],
                    cancelId: 0,
                    defaultId: 0,
                    detail,
                    message,
                    noLink: true,
                    normalizeAccessKeys: true,
                    title: "Readium2 Electron streamer / navigator",
                    type: "info",
                });
                if (choice === 0) {
                    debug("ok");
                }
            } else {
                const html = `<html><h2>${message}<hr>${detail}</h2></html>`;
                const electronBrowserWindow = new BrowserWindow({
                    height: 300,
                    webPreferences: {
                        allowRunningInsecureContent: false,
                        contextIsolation: false,
                        devTools: false,
                        nodeIntegration: false,
                        nodeIntegrationInWorker: false,
                        sandbox: false,
                        webSecurity: true,
                        webviewTag: false,
                        // preload: __dirname + "/" + "preload.js",
                    },
                    width: 400,
                });

                electronBrowserWindow.webContents.loadURL("data:text/html," + html);
            }
        });
    })();
});

function resetMenu() {

    const menuTemplate = [
        {
            label: "Readium2 Electron",
            submenu: [
                {
                    accelerator: "Command+Q",
                    click: () => { app.quit(); },
                    label: "Quit",
                },
            ],
        },
        {
            label: "Open",
            submenu: [
            ],
        },
        {
            label: "Tools",
            submenu: [
                {
                    accelerator: "Command+B",
                    click: () => {
                        // openTopLevelDevTools();
                        openAllDevTools();
                    },
                    label: "Open Dev Tools",
                },
            ],
        },
    ];

    menuTemplate[1].submenu.push({
        click: async () => {
            const choice = dialog.showOpenDialog({
                defaultPath: _lastBookPath || DEFAULT_BOOK_PATH,
                filters: [
                    { name: "EPUB publication", extensions: ["epub", "epub3"] },
                    { name: "LCP license", extensions: ["lcpl"] },
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
            const filePath = choice[0];
            debug(filePath);
            await openFileDownload(filePath);
        },
        label: "Load file...",
    } as any);

    _publicationsUrls.forEach((pubManifestUrl, n) => {
        const filePath = _publicationsFilePaths[n];
        debug("MENU ITEM: " + filePath + " : " + pubManifestUrl);

        menuTemplate[1].submenu.push({
            click: async () => {
                debug(filePath);
                await openFileDownload(filePath);
            },
            label: filePath, // + " : " + pubManifestUrl,
        } as any);
    });
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

async function openFileDownload(filePath: string) {
    const dir = path.dirname(filePath);
    _lastBookPath = dir;
    debug(_lastBookPath);

    const ext = path.extname(filePath);
    const filename = path.basename(filePath);
    const destFileName = filename + ".epub";
    if (ext === ".lcpl") {
        const lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
        // debug(lcplStr);
        const lcplJson = global.JSON.parse(lcplStr);
        const lcpl = TAJSON.deserialize<LCP>(lcplJson, LCP);
        if (lcpl.Links) {
            const pubLink = lcpl.Links.find((link) => {
                return link.Rel === "publication";
            });
            if (pubLink) {

                const destPathTMP = path.join(dir, destFileName + ".tmp");
                const destPathFINAL = path.join(dir, destFileName);

                const failure = (err: any) => {
                    debug(err);

                    process.nextTick(() => {
                        const detail = (typeof err === "string") ?
                            err :
                            (err.toString ? err.toString() : "ERROR!?");
                        const message = "LCP EPUB download fail! [" + pubLink.Href + "]";
                        const res = dialog.showMessageBox({
                            buttons: ["&OK"],
                            cancelId: 0,
                            defaultId: 0,
                            detail,
                            message,
                            noLink: true,
                            normalizeAccessKeys: true,
                            title: "Readium2 Electron streamer / navigator",
                            type: "info",
                        });
                        if (res === 0) {
                            debug("ok");
                        }
                    });
                };

                const success = async (response: request.RequestResponse) => {

                    const destStreamTMP = fs.createWriteStream(destPathTMP);
                    response.pipe(destStreamTMP);
                    // response.on("end", () => {
                    // });
                    destStreamTMP.on("finish", () => {

                        const zipError = (err: any) => {
                            debug(err);
                            process.nextTick(() => {
                                const detail = (typeof err === "string") ?
                                    err :
                                    (err.toString ? err.toString() : "ERROR!?");
                                const message = "LCP EPUB zip error! [" + destPathTMP + "]";
                                const res = dialog.showMessageBox({
                                    buttons: ["&OK"],
                                    cancelId: 0,
                                    defaultId: 0,
                                    detail,
                                    message,
                                    noLink: true,
                                    normalizeAccessKeys: true,
                                    title: "Readium2 Electron streamer / navigator",
                                    type: "info",
                                });
                                if (res === 0) {
                                    debug("ok");
                                }
                            });
                        };

                        const doneCallback = () => {
                            setTimeout(() => {
                                fs.unlinkSync(destPathTMP);
                            }, 1000);

                            process.nextTick(async () => {
                                const detail = destPathFINAL + " ---- [" + pubLink.Href + "]";
                                const message = "LCP EPUB file download success [" + destFileName + "]";
                                const res = dialog.showMessageBox({
                                    buttons: ["&OK"],
                                    cancelId: 0,
                                    defaultId: 0,
                                    detail,
                                    message,
                                    noLink: true,
                                    normalizeAccessKeys: true,
                                    title: "Readium2 Electron streamer / navigator",
                                    type: "info",
                                });
                                if (res === 0) {
                                    debug("ok");
                                }

                                await openFile(destPathFINAL);
                            });
                        };
                        const zipEntryPath = "META-INF/license.lcpl";

                        injectInZip(destPathTMP, destPathFINAL, filePath, zipEntryPath, zipError, doneCallback);
                    });

                    // let responseData: Buffer | undefined;
                    // try {
                    //     responseData = await streamToBufferPromise(response);
                    // } catch (err) {
                    //     debug(err);
                    //     return;
                    // }
                    // const responseStr = responseData.toString("utf8");
                };

                // No response streaming! :(
                // https://github.com/request/request-promise/issues/90
                const needsStreamingResponse = true;
                if (needsStreamingResponse) {
                    request.get({
                        headers: {},
                        method: "GET",
                        uri: pubLink.Href,
                    })
                        .on("response", success)
                        .on("error", failure);
                } else {
                    let response: requestPromise.FullResponse | undefined;
                    try {
                        // tslint:disable-next-line:await-promise no-floating-promises
                        response = await requestPromise({
                            headers: {},
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: pubLink.Href,
                        });
                    } catch (err) {
                        failure(err);
                        return;
                    }

                    // To please the TypeScript compiler :(
                    response = response as requestPromise.FullResponse;
                    await success(response);
                }
            }
        }
    } else {
        await openFile(filePath);
    }
}

async function openFile(filePath: string) {
    let n = _publicationsFilePaths.indexOf(filePath);
    if (n < 0) {
        const publicationPaths = _publicationsServer.addPublications([filePath]);
        debug(publicationPaths);

        _publicationsFilePaths.push(filePath);
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

    await createElectronBrowserWindow(file, pubManifestUrl);
}

app.on("activate", () => {
    debug("app activate");
});

app.on("before-quit", () => {
    debug("app before quit");
});

app.on("window-all-closed", () => {
    debug("app window-all-closed");
    if (process.platform !== "darwin") {
        app.quit();
    }
});

function willQuitCallback(evt: Electron.Event) {
    debug("app will quit");

    app.removeListener("will-quit", willQuitCallback);

    _publicationsServer.stop();

    let done = false;

    setTimeout(() => {
        if (done) {
            return;
        }
        done = true;
        debug("Cache and StorageData clearance waited enough => force quitting...");
        app.quit();
    }, 6000);

    let sessionCleared = 0;
    const callback = () => {
        sessionCleared++;
        if (sessionCleared >= 2) {
            if (done) {
                return;
            }
            done = true;
            debug("Cache and StorageData cleared, now quitting...");
            app.quit();
        }
    };
    clearSessions(callback, callback);

    evt.preventDefault();
}

app.on("will-quit", willQuitCallback);

app.on("quit", () => {
    debug("app quit");
});

function clearSession(
    sess: Electron.Session,
    str: string,
    callbackCache: (() => void) | undefined,
    callbackStorageData: (() => void) | undefined) {

    sess.clearCache(() => {
        debug("SESSION CACHE CLEARED - " + str);
        if (callbackCache) {
            callbackCache();
        }
    });
    sess.clearStorageData({
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
    }, () => {
        debug("SESSION STORAGE DATA CLEARED - " + str);
        if (callbackStorageData) {
            callbackStorageData();
        }
    });
}

function getWebViewSession() {
    return session.fromPartition(R2_SESSION_WEBVIEW, { cache: false });
}

function clearWebviewSession(
    callbackCache: (() => void) | undefined,
    callbackStorageData: (() => void) | undefined) {

    const sess = getWebViewSession();
    if (sess) {
        clearSession(sess, "[persist:publicationwebview]", callbackCache, callbackStorageData);
    } else {
        if (callbackCache) {
            callbackCache();
        }
        if (callbackStorageData) {
            callbackStorageData();
        }
    }
}

function clearDefaultSession(
    callbackCache: (() => void) | undefined,
    callbackStorageData: (() => void) | undefined) {

    if (session.defaultSession) {
        // const proto = session.defaultSession.protocol;
        clearSession(session.defaultSession, "[default]", callbackCache, callbackStorageData);
    } else {
        if (callbackCache) {
            callbackCache();
        }
        if (callbackStorageData) {
            callbackStorageData();
        }
    }
}

function clearSessions(
    callbackCache: (() => void) | undefined,
    callbackStorageData: (() => void) | undefined) {

    let done = false;

    setTimeout(() => {
        if (done) {
            return;
        }
        done = true;
        debug("Cache and StorageData clearance waited enough (default session) => force webview session...");
        clearWebviewSession(callbackCache, callbackStorageData);
    }, 6000);

    let sessionCleared = 0;
    const callback = () => {
        sessionCleared++;
        if (sessionCleared >= 2) {
            if (done) {
                return;
            }
            done = true;
            debug("Cache and StorageData cleared (default session), now webview session...");
            clearWebviewSession(callbackCache, callbackStorageData);
        }
    };
    clearDefaultSession(callback, callback);
}
