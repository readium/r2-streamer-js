import * as debug_ from "debug";
import { app, session } from "electron";

import { R2_SESSION_WEBVIEW } from "../common/sessions";

const debug = debug_("r2:electron:main");

export function initSessions() {

    app.on("ready", () => {
        debug("app ready");

        clearSessions(undefined, undefined);
        const webViewSession = getWebViewSession();
        if (webViewSession) {
            webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
                debug("setPermissionRequestHandler");
                debug(wc.getURL());
                debug(permission);
                callback(true);
            });
        }
    });

    function willQuitCallback(evt: Electron.Event) {
        debug("app will quit");

        app.removeListener("will-quit", willQuitCallback);

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
}

export function clearSession(
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

export function getWebViewSession() {
    return session.fromPartition(R2_SESSION_WEBVIEW, { cache: true });
}

export function clearWebviewSession(
    callbackCache: (() => void) | undefined,
    callbackStorageData: (() => void) | undefined) {

    const sess = getWebViewSession();
    if (sess) {
        clearSession(sess, "[" + R2_SESSION_WEBVIEW + "]", callbackCache, callbackStorageData);
    } else {
        if (callbackCache) {
            callbackCache();
        }
        if (callbackStorageData) {
            callbackStorageData();
        }
    }
}

export function clearDefaultSession(
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

export function clearSessions(
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
