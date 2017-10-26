// in RENDERER: ipcRenderer.send()
// in MAIN: ipcMain.on()
export const R2_EVENT_TRY_LCP_PASS = "R2_EVENT_TRY_LCP_PASS";

// in RENDERER: ipcRenderer.send()
// in MAIN: ipcMain.on()
export const R2_EVENT_LCP_LSD_RETURN = "R2_EVENT_LCP_LSD_RETURN";

// in MAIN: event.sender.send(), where event is from the above ipcMain.on()
// in RENDERER: ipcRenderer.on()
export const R2_EVENT_LCP_LSD_RETURN_RES = "R2_EVENT_LCP_LSD_RETURN_RES";

// in RENDERER: ipcRenderer.send()
// in MAIN: ipcMain.on()
export const R2_EVENT_LCP_LSD_RENEW = "R2_EVENT_LCP_LSD_RENEW";

// in MAIN: event.sender.send(), where event is from the above ipcMain.on()
// in RENDERER: ipcRenderer.on()
export const R2_EVENT_LCP_LSD_RENEW_RES = "R2_EVENT_LCP_LSD_RENEW_RES";

// in MAIN: event.sender.send(), where event is from the above ipcMain.on()
// in RENDERER: ipcRenderer.on()
export const R2_EVENT_TRY_LCP_PASS_RES = "R2_EVENT_TRY_LCP_PASS_RES";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_READIUMCSS = "R2_EVENT_READIUMCSS";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_SCROLLTO = "R2_EVENT_SCROLLTO";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_PAGE_TURN = "R2_EVENT_PAGE_TURN";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_PAGE_TURN_RES = "R2_EVENT_PAGE_TURN_RES";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_READING_LOCATION = "R2_EVENT_READING_LOCATION";

// in MAIN: browserWindow.webContents.send(()
// in RENDERER: ipcRenderer.on()
// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_LINK = "R2_EVENT_LINK";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_WEBVIEW_READY = "R2_EVENT_WEBVIEW_READY";

// in RENDERER: ipcRenderer.send()
// in MAIN: ipcMain.on()
export const R2_EVENT_DEVTOOLS = "R2_EVENT_DEVTOOLS";
