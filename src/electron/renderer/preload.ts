import { ipcRenderer } from "electron";

import { R2_EVENT_LINK, R2_EVENT_READIUMCSS } from "../common/events";

console.log("PRELOAD");

const win = (global as any).window as Window;

console.log(win.location.pathname);
console.log(win.location.origin);

const urlRootReadiumCSS = win.location.origin + "/readium-css/iOS/";

ipcRenderer.on(R2_EVENT_READIUMCSS, (_event: any, messageString: any) => {
    // console.log("ipcRenderer");
    // console.log(event);
    // console.log(messageString);
    // ipcRenderer.sendToHost(R2_EVENT_READIUMCSS, "pong");

    const messageJson = JSON.parse(messageString);

    if (messageJson.injectCSS) {
        if (!win.document.head) {
            const headElement = win.document.createElement("head");
            if (win.document.body) {
                win.document.documentElement.insertBefore(headElement, win.document.body);
            } else {
                win.document.documentElement.appendChild(headElement);
            }
        }

        removeAllCSS();
        if (messageJson.injectCSS.indexOf("rollback") < 0) {
            // appendCSS("base");
            // appendCSS("html5patch");
            // appendCSS("safeguards");
            // appendCSS("default");
            // appendCSS("highlights");
            // if (messageJson.injectCSS.indexOf("scroll") >= 0) {
            //     appendCSS("scroll");
            // } else {
            //     appendCSS("pagination");
            // }
            // if (messageJson.injectCSS.indexOf("night_mode") >= 0) {
            //     appendCSS("night_mode");
            // } else if (messageJson.injectCSS.indexOf("sepia_mode") >= 0) {
            //     appendCSS("pagination");
            // }
            // appendCSS("os_a11y");
            // appendCSS("user_settings");
            // if (messageJson.injectCSS.indexOf("fs_normalize") >= 0) {
            //     appendCSS("fs_normalize");
            // }

            appendCSS("before");
            appendCSS("default");
            appendCSS("after");
        }
    }

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/readium-css/tree/develop/prototype/iOS-implem#manage-user-settings
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/readium-css/blob/develop/prototype/iOS-implem/Specific-docs/CSS12-api.md#user-settings
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/readium-css/blob/develop/prototype/iOS-implem/Specific-docs/CSS09-user_prefs.md#switches
    if (messageJson.setCSS) {

        const docElement = win.document.documentElement;

        if (typeof messageJson.setCSS === "string" && messageJson.setCSS.indexOf("rollback") >= 0) {

            docElement.style.overflow = "auto";

            const toRemove: string[] = [];
            for (let i = 0; i < docElement.style.length; i++) {
                const item = docElement.style.item(i);
                if (item.indexOf("--USER__") === 0) {
                    toRemove.push(item);
                }
            }
            toRemove.forEach((item) => {
                docElement.style.removeProperty(item);
            });
        } else {
            docElement.style.overflow = "hidden";
            // win.document.body.offsetWidth === single column width (takes into account column gap?)
            // win.document.body.clientWidth === same
            // win.document.body.scrollWidth === full document width (all columns)
            //
            // win.document.body.offsetHeight === full document height (sum of all columns minus trailing blank space?)
            // win.document.body.clientHeight === same
            // win.document.body.scrollHeight === visible viewport height
            //
            // win.document.body.scrollLeft === positive number for left shift

            // readium-darken-on | readium-darken-off
            docElement.style.setProperty("--USER__darkenFilter", "readium-darken-off");

            // readium-invert-on | readium-invert-off
            docElement.style.setProperty("--USER__invertFilter", "readium-invert-off");

            // readium-advanced-on | readium-advanced-off
            docElement.style.setProperty("--USER__advancedSettings", "readium-advanced-on");

            // readium-font-on | readium-font-off
            docElement.style.setProperty("--USER__fontOverride", "readium-font-on");

            // readium-paged-on | readium-scroll-on
            docElement.style.setProperty("--USER__view", "readium-paged-on");

            // readium-default-on | readium-sepia-on | readium-night-on
            docElement.style.setProperty("--USER__appearance", "readium-sepia-on");

            // left (LTR) or right (RTL) | justify
            docElement.style.setProperty("--USER__textAlign", "justify");

            // auto | none
            docElement.style.setProperty("--USER__bodyHyphens", "auto");

            // var(--RS__oldStyleTf) | var(--RS__modernTf) | var(--RS__sansTf) | var(--RS__humanistTf) | AccessibleDfa
            docElement.style.setProperty("--USER__fontFamily", "AccessibleDfa");

            // 1 | 2 | auto
            docElement.style.setProperty("--USER__colCount", "2");

            // 75% | 87.5% | 100% | 112.5% | 137.5% | 150% | 162.5% | 175% | 200% | 225% | 250%
            docElement.style.setProperty("--USER__fontSize", "112.5%");

            // 1 | 1.067 | 1.125 | 1.2 (suggested default) | 1.25 | 1.333 | 1.414 | 1.5 | 1.618
            docElement.style.setProperty("--USER__typeScale", "1.2");

            // 1 | 1.125 | 1.25 | 1.35 | 1.5 | 1.65 | 1.75 | 2
            docElement.style.setProperty("--USER__lineHeight", "2");

            // 0 | 0.375rem | 0.75rem | 1rem | 1.125rem | 1.25rem | 1.35rem | 1.5rem | 1.65rem | 1.75rem | 2rem
            docElement.style.setProperty("--USER__paraSpacing", "1rem");

            // 0 | 0.5rem | 1rem | 1.25rem | 1.5rem | 2rem | 2.5rem | 3rem
            docElement.style.setProperty("--USER__paraIndent", "1rem");

            // 0.125rem | 0.25rem | 0.375rem | 0.5rem
            docElement.style.setProperty("--USER__wordSpacing", "0.5rem");

            // 0.0675rem | 0.125rem | 0.1875rem | 0.25rem
            docElement.style.setProperty("--USER__letterSpacing", "0.1875rem");

            // 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2
            docElement.style.setProperty("--USER__pageMargins", "1.25");

            docElement.style.setProperty("--USER__backgroundColor", "#FFFFFF");
            docElement.style.setProperty("--USER__textColor", "#000000");
        }
    }
});

win.addEventListener("DOMContentLoaded", () => {
    console.log("PRELOAD DOM READY");

    win.document.addEventListener("click", (e) => {
        const href = (e.target as any).href;
        if (!href) {
            return;
        }
        console.log("HREF CLICK: " + href);
        e.preventDefault();
        e.stopPropagation();
        ipcRenderer.sendToHost(R2_EVENT_LINK, href);
        return false;
    }, true);

    // const borderDiv1 = win.document.createElement("div");
    // borderDiv1.setAttribute("id", "ReadiumBorderDIV1");
    // borderDiv1.setAttribute("style",
    // tslint:disable-next-line:max-line-length
    // "display:block;position:absolute;margin:0;padding:0;box-sizing:border-box;left:3px;right:3px;top:3px;bottom:3px;z-index:1000;background-color:transparent;border:2px solid blue;");
    // win.document.body.appendChild(borderDiv1);

    // const borderDiv2 = win.document.createElement("div");
    // borderDiv2.setAttribute("id", "ReadiumBorderDIV2");
    // borderDiv2.setAttribute("style",
    // tslint:disable-next-line:max-line-length
    // "display:block;position:fixed;margin:0;padding:0;box-sizing:border-box;left:0;top:0;width:100%;height:100%;z-index:900;background-color:transparent;border:2px solid black;");
    // // borderDiv2.appendChild(win.document.createTextNode("TEST"));
    // win.document.body.appendChild(borderDiv2);

    // win.addEventListener("scroll", (e) => {
    //     console.log(e);

    //     console.log(win.innerWidth);
    //     console.log(win.innerHeight);

    //     const element = win.document.body; // win.document.documentElement
    //     if (!element) {
    //         return;
    //     }

    //     console.log(element.scrollWidth);
    //     console.log(element.scrollLeft);

    //     console.log(element.scrollHeight);
    //     console.log(element.scrollTop);
    // });
});

win.addEventListener("resize", () => {
    console.log("webview resize");
    win.document.body.scrollLeft = 0;
    win.document.body.scrollTop = 0;
});

function appendCSS(mod: string) {
    const linkElement = win.document.createElement("link");
    linkElement.setAttribute("id", "ReadiumCSS-" + mod);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRootReadiumCSS + "ReadiumCSS-" + mod + ".css");
    win.document.head.appendChild(linkElement);
}

function removeCSS(mod: string) {
    const linkElement = win.document.getElementById("ReadiumCSS-" + mod);
    if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
    }
}

function removeAllCSS() {
    removeCSS("before");
    removeCSS("after");
    removeCSS("base");
    removeCSS("html5patch");
    removeCSS("safeguards");
    removeCSS("default");
    removeCSS("highlights");
    removeCSS("scroll");
    removeCSS("pagination");
    removeCSS("night_mode");
    removeCSS("pagination");
    removeCSS("os_a11y");
    removeCSS("user_settings");
    removeCSS("fs_normalize");
}
