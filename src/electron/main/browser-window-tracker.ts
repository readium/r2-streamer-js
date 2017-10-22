import { app } from "electron";

import { R2_EVENT_LINK } from "../common/events";

let _electronBrowserWindows: Electron.BrowserWindow[];

export function trackBrowserWindow(win: Electron.BrowserWindow) {

    if (!_electronBrowserWindows) {
        _electronBrowserWindows = [];
    }
    _electronBrowserWindows.push(win);

    win.on("closed", () => {
        const i = _electronBrowserWindows.indexOf(win);
        if (i < 0) {
            return;
        }
        _electronBrowserWindows.splice(i, 1);
    });
}

app.on("web-contents-created", (_evt, wc) => {
    if (!wc.hostWebContents) {
        return;
    }

    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (wc.hostWebContents.id === win.webContents.id) {
            console.log("WEBVIEW web-contents-created");

            wc.on("will-navigate", (event, url) => {
                console.log("webview.getWebContents().on('will-navigate'");

                // console.log(event.sender);
                console.log(url);

                const wcUrl = event.sender.getURL();
                console.log(wcUrl);

                event.preventDefault();

                // ipcMain.emit
                win.webContents.send(R2_EVENT_LINK, url);
            });
        }
    });
});
