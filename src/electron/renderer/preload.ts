import debounce = require("debounce");
import ResizeSensor = require("resize-sensor/ResizeSensor");

import { ipcRenderer } from "electron";
import { animateProperty } from "./animateProperty";
import { easings } from "./easings";
import { getURLQueryParams } from "./querystring";

import {
    R2_EVENT_LINK,
    R2_EVENT_PAGE_TURN,
    R2_EVENT_PAGE_TURN_RES,
    R2_EVENT_READIUMCSS,
    R2_EVENT_WEBVIEW_READY,
} from "../common/events";

// import { fullQualifiedSelector } from "./cssselector";

const win = (global as any).window as Window;

const urlRootReadiumCSS = win.location.origin + "/readium-css/iOS/";
// const urlResizeSensor = win.location.origin + "/resize-sensor.js";

const DEBUG_VISUALS = true;

const queryParams = win.location.search ? getURLQueryParams(win.location.search) : undefined;

const ensureHead = () => {
    const docElement = win.document.documentElement;

    if (!win.document.head) {
        const headElement = win.document.createElement("head");
        if (win.document.body) {
            docElement.insertBefore(headElement, win.document.body);
        } else {
            docElement.appendChild(headElement);
        }
    }
};

ipcRenderer.on(R2_EVENT_READIUMCSS, (_event: any, messageString: any) => {
    const messageJson = JSON.parse(messageString);
    readiumCSS(messageJson);
});

ipcRenderer.on(R2_EVENT_PAGE_TURN, (_event: any, messageString: any) => {
    const element = win.document.body;
    if (!element) {
        return;
    }
    // console.log("---");
    // console.log("webview.innerWidth: " + win.innerWidth);
    // console.log("document.offsetWidth: " + win.document.documentElement.offsetWidth);
    // console.log("document.clientWidth: " + win.document.documentElement.clientWidth);
    // console.log("document.scrollWidth: " + win.document.documentElement.scrollWidth);
    // console.log("document.scrollLeft: " + win.document.documentElement.scrollLeft);
    // console.log("body.offsetWidth: " + element.offsetWidth);
    // console.log("body.clientWidth: " + element.clientWidth);
    // console.log("body.scrollWidth: " + element.scrollWidth);
    // console.log("body.scrollLeft: " + element.scrollLeft);
    // console.log("---");
    // console.log("webview.innerHeight: " + win.innerHeight);
    // console.log("document.offsetHeight: " + win.document.documentElement.offsetHeight);
    // console.log("document.clientHeight: " + win.document.documentElement.clientHeight);
    // console.log("document.scrollHeight: " + win.document.documentElement.scrollHeight);
    // console.log("document.scrollTop: " + win.document.documentElement.scrollTop);
    // console.log("body.offsetHeight: " + element.offsetHeight);
    // console.log("body.clientHeight: " + element.clientHeight);
    // console.log("body.scrollHeight: " + element.scrollHeight);
    // console.log("body.scrollTop: " + element.scrollTop);
    // console.log("---");

    // win.document.body.offsetWidth === single column width (takes into account column gap?)
    // win.document.body.clientWidth === same
    // win.document.body.scrollWidth === full document width (all columns)
    //
    // win.document.body.offsetHeight === full document height (sum of all columns minus trailing blank space?)
    // win.document.body.clientHeight === same
    // win.document.body.scrollHeight === visible viewport height
    //
    // win.document.body.scrollLeft === positive number for horizontal shift
    // win.document.body.scrollTop === positive number for vertical shift

    const maxHeightShift = element.scrollHeight - win.document.documentElement.clientHeight;

    const messageJson = JSON.parse(messageString);
    // const isRTL = messageJson.direction === "RTL"; //  any other value is LTR
    const goPREVIOUS = messageJson.go === "PREVIOUS"; // any other value is NEXT

    // console.log(JSON.stringify(messageJson, null, "  "));

    if (!goPREVIOUS) { // goPREVIOUS && isRTL || !goPREVIOUS && !isRTL) { // right
        if (element.scrollTop < maxHeightShift) { // not at bottom
            animateProperty(win.cancelAnimationFrame,
                (cancelled: boolean) => {
                    console.log(cancelled);
                },
                "scrollTop",
                300,
                element,
                element.scrollTop + win.document.documentElement.clientHeight,
                win.requestAnimationFrame,
                easings.easeInOutQuad,
            );
            // element.scrollTop += win.document.documentElement.clientHeight;
            return;
        }
    } else if (goPREVIOUS) { //  && !isRTL || !goPREVIOUS && isRTL) { // left
        if (element.scrollTop > 0) { // not at top
            animateProperty(win.cancelAnimationFrame,
                (cancelled: boolean) => {
                    console.log(cancelled);
                },
                "scrollTop",
                300,
                element,
                element.scrollTop - win.document.documentElement.clientHeight,
                win.requestAnimationFrame,
                easings.easeInOutQuad,
            );
            // element.scrollTop -= win.document.documentElement.clientHeight;
            return;
        }
    }

    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, messageString);
});

const readiumCSS = (messageJson: any) => {

    const docElement = win.document.documentElement;

    if (typeof messageJson.injectCSS !== "undefined") {
        ensureHead();

        const remove = (typeof messageJson.injectCSS === "string" && messageJson.injectCSS.indexOf("rollback") >= 0)
            || !messageJson.injectCSS;
        if (remove) {
            docElement.removeAttribute("data-readiumcss");
            removeAllCSS();
            removeAllCSSInline();
        } else if (!docElement.hasAttribute("data-readiumcss")) {
            docElement.setAttribute("data-readiumcss", "yes");

            let needsDefaultCSS = true;
            if (win.document.head && win.document.head.childElementCount) {
                let elem = win.document.head.firstElementChild;
                while (elem) {
                    if ((elem.localName && elem.localName.toLowerCase() === "style") ||
                        (elem.getAttribute &&
                            (elem.getAttribute("rel") === "stylesheet" ||
                                elem.getAttribute("type") === "text/css" ||
                                (elem.getAttribute("src") &&
                                    (elem.getAttribute("src") as string).endsWith(".css"))))) {
                        needsDefaultCSS = false;
                        break;
                    }
                    elem = elem.nextElementSibling;
                }
            }
            if (needsDefaultCSS && win.document.body) {
                const styleAttr = win.document.body.querySelector("*[style]");
                if (styleAttr) {
                    needsDefaultCSS = false;
                }
            }

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
            if (needsDefaultCSS) {
                appendCSS("default");
            }
            appendCSS("after");

            appendCSSInline("scrollbarsAndSelection", `
::-webkit-scrollbar-button {
height: 0px !important;
width: 0px !important;
}

::-webkit-scrollbar-corner {
background: transparent !important;
}

/*::-webkit-scrollbar-track-piece {
background-color: red;
} */

::-webkit-scrollbar {
width:  14px;
height: 14px;
}

::-webkit-scrollbar-thumb {
background: #727272;
background-clip: padding-box !important;
border: 3px solid transparent !important;
border-radius: 30px;
}

::-webkit-scrollbar-thumb:hover {
background: #4d4d4d;
}

::-webkit-scrollbar-track {
box-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);
background: #dddddd;
box-sizing: content-box;
}

::-webkit-scrollbar-track:horizontal {
border-top: 1px solid silver;
}
::-webkit-scrollbar-track:vertical {
border-left: 1px solid silver;
}

.mdc-theme--dark ::-webkit-scrollbar-thumb {
background: #a4a4a4;
border: 3px solid #545454;
}

.mdc-theme--dark ::-webkit-scrollbar-thumb:hover {
background: #dedede;
}

.mdc-theme--dark ::-webkit-scrollbar-track {
background: #545454;
}

.mdc-theme--dark ::-webkit-scrollbar-track:horizontal {
border-top: 1px solid black;
}
.mdc-theme--dark ::-webkit-scrollbar-track:vertical {
border-left: 1px solid black;
}

::selection {
background-color: rgb(155, 179, 240) !important;
color: black !important;
}

.mdc-theme--dark ::selection {
background-color: rgb(100, 122, 177) !important;
color: white !important;
}
*:focus {
outline-style: solid !important;
outline-width: 2px !important;
outline-color: blue !important;
outline-offset: 0px !important;
}
*.no-focus-outline:focus {
outline-style: none !important;
}
    `);
        }
    }

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/readium-css/tree/develop/prototype/iOS-implem#manage-user-settings
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/readium-css/blob/develop/prototype/iOS-implem/Specific-docs/CSS12-api.md#user-settings
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/readium-css/blob/develop/prototype/iOS-implem/Specific-docs/CSS09-user_prefs.md#switches
    if (typeof messageJson.setCSS !== "undefined") {

        const remove = (typeof messageJson.setCSS === "string" && messageJson.setCSS.indexOf("rollback") >= 0)
            || !messageJson.setCSS;
        if (remove) {

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
            let dark = false;
            let night = false;
            let sepia = false;
            let invert = false;
            let paged = false;
            let font: string | undefined;
            let align: string | undefined;
            if (typeof messageJson.setCSS === "object") {
                if (messageJson.setCSS.dark) {
                    dark = true;
                }
                if (messageJson.setCSS.night) {
                    night = true;
                }
                if (messageJson.setCSS.sepia) {
                    sepia = true;
                }
                if (messageJson.setCSS.invert) {
                    invert = true;
                }
                if (messageJson.setCSS.paged) {
                    paged = true;
                }
                if (typeof messageJson.setCSS.font === "string") {
                    font = messageJson.setCSS.font;
                }
                if (typeof messageJson.setCSS.align === "string") {
                    align = messageJson.setCSS.align;
                }
            }

            if (night) {
                // win.document.body
                docElement.classList.add("mdc-theme--dark");
            } else {
                // win.document.body
                docElement.classList.remove("mdc-theme--dark");
            }

            const needsAdvanced = true; // dark || invert;

            // readium-advanced-on | readium-advanced-off
            docElement.style.setProperty("--USER__advancedSettings",
                needsAdvanced ? "readium-advanced-on" : "readium-advanced-off");

            // readium-darken-on | readium-darken-off
            docElement.style.setProperty("--USER__darkenFilter",
                dark ? "readium-darken-on" : "readium-darken-off");

            // readium-invert-on | readium-invert-off
            docElement.style.setProperty("--USER__invertFilter",
                invert ? "readium-invert-on" : "readium-invert-off");

            // readium-default-on | readium-sepia-on | readium-night-on
            docElement.style.setProperty("--USER__appearance",
                sepia ? "readium-sepia-on" : (night ? "readium-night-on" : "readium-default-on"));

            // readium-paged-on | readium-scroll-on
            docElement.style.setProperty("--USER__view",
                paged ? "readium-paged-on" : "readium-scroll-on");
            if (paged) {
                docElement.style.overflow = "hidden";
            }

            const needsFontOverride = typeof font !== "undefined" && font !== "DEFAULT";
            // readium-font-on | readium-font-off
            docElement.style.setProperty("--USER__fontOverride",
                needsFontOverride ? "readium-font-on" : "readium-font-off");

            // var(--RS__oldStyleTf) | var(--RS__modernTf) | var(--RS__sansTf) | var(--RS__humanistTf) | AccessibleDfa
            docElement.style.setProperty("--USER__fontFamily",
                !needsFontOverride ? "" :
                    (font === "DYS" ? "AccessibleDfa" :
                        (font === "OLD" ? "var(--RS__oldStyleTf)" :
                            (font === "MODERN" ? "var(--RS__modernTf)" :
                                (font === "SANS" ? "var(--RS__sansTf)" :
                                    (font === "HUMAN" ? "var(--RS__humanistTf)" : "var(--RS__oldStyleTf)")
                                )
                            )
                        )
                    ));

            // left (LTR) or right (RTL) | justify
            docElement.style.setProperty("--USER__textAlign",
                align === "justify" ? "justify" :
                    (align === "right" ? "right" :
                        (align === "left" ? "left" : "left")
                    ));

            // // auto | none
            // docElement.style.setProperty("--USER__bodyHyphens", "auto");

            // // 1 | 2 | auto
            // docElement.style.setProperty("--USER__colCount", "2");

            // // 75% | 87.5% | 100% | 112.5% | 137.5% | 150% | 162.5% | 175% | 200% | 225% | 250%
            // docElement.style.setProperty("--USER__fontSize", "112.5%");

            // // 1 | 1.067 | 1.125 | 1.2 (suggested default) | 1.25 | 1.333 | 1.414 | 1.5 | 1.618
            // docElement.style.setProperty("--USER__typeScale", "1.2");

            // // 1 | 1.125 | 1.25 | 1.35 | 1.5 | 1.65 | 1.75 | 2
            // docElement.style.setProperty("--USER__lineHeight", "2");

            // // 0 | 0.375rem | 0.75rem | 1rem | 1.125rem | 1.25rem | 1.35rem | 1.5rem | 1.65rem | 1.75rem | 2rem
            // docElement.style.setProperty("--USER__paraSpacing", "1rem");

            // // 0 | 0.5rem | 1rem | 1.25rem | 1.5rem | 2rem | 2.5rem | 3rem
            // docElement.style.setProperty("--USER__paraIndent", "1rem");

            // // 0.125rem | 0.25rem | 0.375rem | 0.5rem
            // docElement.style.setProperty("--USER__wordSpacing", "0.5rem");

            // // 0.0675rem | 0.125rem | 0.1875rem | 0.25rem
            // docElement.style.setProperty("--USER__letterSpacing", "0.1875rem");

            // // 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2
            // docElement.style.setProperty("--USER__pageMargins", "1.25");

            // docElement.style.setProperty("--USER__backgroundColor", "#FFFFFF");
            // docElement.style.setProperty("--USER__textColor", "#000000");
        }
    }

    checkReadyPass();
};

const checkReadyPass = () => {
    if (_readyPassDone) {
        return;
    }
    _readyPassDone = true;

    if (DEBUG_VISUALS) {
        if (win.location.hash && win.location.hash.length > 1) {
            const elem = win.document.getElementById(win.location.hash.substr(1));
            if (elem) {
                elem.classList.add("readium2-read-pos");
            }
        }
    }

    win.addEventListener("resize", () => {
        scrollToHash();
    });

    activateResizeSensor();

    if (win.document.body) {

        win.document.body.addEventListener("click", (ev: MouseEvent) => {

            const x = ev.clientX; // win.document.body.scrollLeft;
            const y = ev.clientY; // win.document.body.scrollTop;

            processXY(x, y);
        });
    }
};

const notifyReady = debounce(() => {
    if (_readyEventSent) {
        return;
    }
    _readyEventSent = true;

    ipcRenderer.sendToHost(R2_EVENT_WEBVIEW_READY, win.location.href);
}, 500);

const scrollToHash = debounce(() => {

    notifyReady();

    if (_locationHashOverride) {
        _locationHashOverride.scrollIntoView({
            behavior: "instant",
            block: "start",
            inline: "nearest",
        });
    } else if (win.location.hash && win.location.hash.length > 1) {

        const elem = win.document.getElementById(win.location.hash.substr(1));
        if (elem) {
            elem.scrollIntoView({
                behavior: "instant",
                block: "start",
                inline: "nearest",
            });
        }
    } else {
        if (win.document.body) {

            if (queryParams) {
                // tslint:disable-next-line:no-string-literal
                const previous = queryParams["readiumprevious"];
                const isPreviousNavDirection = previous === "true";
                if (isPreviousNavDirection) {
                    const maxHeightShift = win.document.body.scrollHeight - win.document.documentElement.clientHeight;

                    win.document.body.scrollLeft = 0;
                    win.document.body.scrollTop = maxHeightShift;
                    return;
                }
            }
            win.document.body.scrollLeft = 0;
            win.document.body.scrollTop = 0;
        }
    }
}, 500);

const injectReadPosCSS = () => {

    if (!DEBUG_VISUALS) {
        return;
    }

    ensureHead();

    const styleElement = win.document.createElement("style");
    styleElement.setAttribute("id", "Readium2-ReadPos");
    styleElement.setAttribute("type", "text/css");
    const css = `
:root[style*="readium-sepia-on"] .readium2-read-pos,
:root[style*="readium-night-on"] .readium2-read-pos,
.readium2-read-pos {
    color: red !important;
    background-color: silver !important;
}
:root[style*="readium-sepia-on"] .readium2-read-pos2,
:root[style*="readium-night-on"] .readium2-read-pos2,
.readium2-read-pos2 {
    color: blue !important;
    background-color: yellow !important;
}
`;
    styleElement.appendChild(win.document.createTextNode(css));
    win.document.head.appendChild(styleElement);
};

const activateResizeSensor = () => {

    // const docElement = win.document.documentElement;
    // let skipFirstResize = docElement.getAttribute("data-readiumcss") || false;
    // let skipFirstScroll = skipFirstResize;

    const useResizeSensor = true;
    if (useResizeSensor && win.document.body) {

        scrollToHash();

        setTimeout(() => {
            window.requestAnimationFrame((_timestamp) => {
                // new (win as any).
                // tslint:disable-next-line:no-unused-expression
                new ResizeSensor(win.document.body, () => {

                    scrollToHash();

                    // if (skipFirstResize) {
                    //     console.log("ResizeSensor SKIP FIRST");

                    //     skipFirstResize = false;
                    //     return;
                    // } else {
                    //     console.log("ResizeSensor");
                    // }

                    // notifyReady();
                });
            });
        }, 2000);
    } else {
        scrollToHash();
    }

    win.addEventListener("scroll", debounce((_ev: Event) => {

        // if (skipFirstScroll) {
        //     skipFirstScroll = false;
        //     return;
        // }

        processXY(0, 0);
    }, 800));
};

// const injectResizeSensor = () => {
//     ensureHead();
//     const scriptElement = win.document.createElement("script");
//     scriptElement.setAttribute("id", "Readium2-ResizeSensor");
//     scriptElement.setAttribute("type", "application/javascript");
//     scriptElement.setAttribute("src", urlResizeSensor);
//     scriptElement.appendChild(win.document.createTextNode(" "));
//     win.document.head.appendChild(scriptElement);
//     scriptElement.addEventListener("load", () => {
//         console.log("ResizeSensor LOADED");
//     });
// };

let _locationHashOverride: Element | undefined;
let _readyPassDone = false;
let _readyEventSent = false;

const resetInitialState = () => {
    _locationHashOverride = undefined;
    _readyPassDone = false;
    _readyEventSent = false;
};

// // after DOMContentLoaded
// win.addEventListener("load", () => {
//     console.log("PRELOAD WIN LOAD");
//     resetInitialState();
// });

// // does not occur when re-using same webview (src="href")
// win.addEventListener("unload", () => {
//     console.log("PRELOAD WIN UNLOAD");
//     resetInitialState();
// });

win.addEventListener("DOMContentLoaded", () => {

    resetInitialState();

    appendCSSInline("selectionAndFocus", `
::selection {
background-color: rgb(155, 179, 240) !important;
color: black !important;
}
*:focus {
outline-style: solid !important;
outline-width: 2px !important;
outline-color: blue !important;
outline-offset: 0px !important;
}
*.no-focus-outline:focus {
outline-style: none !important;
}`);

    if (DEBUG_VISUALS) {
        injectReadPosCSS();
    }

    win.document.addEventListener("click", (e) => {
        const href = (e.target as any).href;
        if (!href) {
            return;
        }

        // console.log("+++++");
        // console.log(href);

        e.preventDefault();
        e.stopPropagation();
        ipcRenderer.sendToHost(R2_EVENT_LINK, href);
        return false;
    }, true);

    // injectResizeSensor();

    // console.log("-----");
    // console.log(win.location.href);
    // console.log(win.location.origin);
    // console.log(win.location.pathname);
    // console.log(win.location.search);
    // console.log(win.location.hash);

    // const linkUri = new URI(win.location.href);
    try {
        if (queryParams) {
            // tslint:disable-next-line:no-string-literal
            const base64 = queryParams["readiumcss"];
            // if (!base64) {
            //     console.log("!readiumcss BASE64 ??!");
            //     const token = "readiumcss=";
            //     const i = win.location.search.indexOf(token);
            //     if (i > 0) {
            //         base64 = win.location.search.substr(i + token.length);
            //         const j = base64.indexOf("&");
            //         if (j > 0) {
            //             base64 = base64.substr(0, j);
            //         }
            //         base64 = decodeURIComponent(base64);
            //     }
            // }
            if (base64) {
                // console.log(base64);
                const str = window.atob(base64);
                // console.log(str);

                const messageJson = JSON.parse(str);
                // console.log(messageJson);

                readiumCSS(messageJson);
            }
        }
    } catch (err) {
        console.log(err);
    }
});

const processXY = (x: number, y: number) => {

    // const elems = document.elementsFromPoint(x, y);
    // // console.log(elems);
    // let element: Element | undefined = elems && elems.length ? elems[0] : undefined;
    let element: Element | undefined;

    // if ((document as any).caretPositionFromPoint) {
    //     console.log("caretPositionFromPoint");
    //     const range = (document as any).caretPositionFromPoint(x, y);
    //     const node = range.offsetNode;
    //     const offset = range.offset;
    // } else if (document.caretRangeFromPoint) {
    //     console.log("caretRangeFromPoint");
    // }

    let textNode: Node | undefined;
    let textNodeOffset = 0;

    const range = document.caretRangeFromPoint(x, y);
    if (range) {
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                element = node as Element;
            } else if (node.nodeType === Node.TEXT_NODE) {
                textNode = node;
                textNodeOffset = offset;
                if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                    element = node.parentNode as Element;
                }
            }
        }
    }

    if (DEBUG_VISUALS) {
        const existings = document.querySelectorAll(".readium2-read-pos, .readium2-read-pos2");
        existings.forEach((existing) => {
            existing.classList.remove("readium2-read-pos");
            existing.classList.remove("readium2-read-pos2");
        });
    }
    if (element) {
        _locationHashOverride = element;

        if (DEBUG_VISUALS) {
            element.classList.add("readium2-read-pos2");

            // // console.log("fullQualifiedSelector TRUE");
            // // const sel1 = fullQualifiedSelector(element, true);
            // // console.log(sel1);

            // // console.log("fullQualifiedSelector FALSE");
            // const sel2 = fullQualifiedSelector(element, false);
            // // console.log(sel2);

            // const selecteds = document.querySelectorAll(sel2);
            // selecteds.forEach((selected) => {
            //     selected.classList.remove("readium2-read-pos");
            //     selected.classList.add("readium2-read-pos2");
            // });
        }
    }
};

function appendCSSInline(id: string, css: string) {
    const styleElement = win.document.createElement("style");
    styleElement.setAttribute("id", "Readium2-" + id);
    styleElement.setAttribute("type", "text/css");
    styleElement.appendChild(document.createTextNode(css));
    win.document.head.appendChild(styleElement);
}

function removeCSSInline(id: string) {
    const styleElement = win.document.getElementById("Readium2-" + id);
    if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
    }
}

function removeAllCSSInline() {
    removeCSSInline("scrollbarsAndSelection");
}

function appendCSS(mod: string) {
    const linkElement = win.document.createElement("link");
    linkElement.setAttribute("id", "ReadiumCSS-" + mod);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRootReadiumCSS + "ReadiumCSS-" + mod + ".css");
    if (mod === "before" && win.document.head.childElementCount) {
        win.document.head.insertBefore(linkElement, win.document.head.firstElementChild);
    } else {
        win.document.head.appendChild(linkElement);
    }
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
