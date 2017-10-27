import debounce = require("debounce");
import ResizeSensor = require("resize-sensor/ResizeSensor");

import {
    DEBUG_VISUALS,
    injectDefaultCSS,
    injectReadPosCSS,
    readiumCSS,
} from "@r2-streamer-js/electron/renderer/webview/readium-css";
import { ipcRenderer } from "electron";

import {
    R2_EVENT_LINK,
    R2_EVENT_PAGE_TURN,
    R2_EVENT_PAGE_TURN_RES,
    R2_EVENT_READING_LOCATION,
    R2_EVENT_SCROLLTO,
    R2_EVENT_WEBVIEW_READY,
} from "../../common/events";
import { animateProperty } from "../common/animateProperty";
import { fullQualifiedSelector } from "../common/cssselector";
import { easings } from "../common/easings";
import { getURLQueryParams } from "../common/querystring";

const win = (global as any).window as Window;

let queryParams = win.location.search ? getURLQueryParams(win.location.search) : undefined;

// console.log("-----");
// console.log(win.location.href);
// console.log(win.location.origin);
// console.log(win.location.pathname);
// console.log(win.location.search);
// console.log(win.location.hash);

let _hashElement: Element | null;

ipcRenderer.on(R2_EVENT_SCROLLTO, (_event: any, messageString: any) => {
    console.log("R2_EVENT_SCROLLTO");
    console.log(messageString);

    const messageJson = JSON.parse(messageString);
    if (!queryParams) {
        queryParams = {};
    }
    if (messageJson.previous) {
        // tslint:disable-next-line:no-string-literal
        queryParams["readiumprevious"] = "true";
    } else {
        // tslint:disable-next-line:no-string-literal
        if (typeof queryParams["readiumprevious"] !== "undefined") {
            // tslint:disable-next-line:no-string-literal
            delete queryParams["readiumprevious"];
        }
    }
    if (messageJson.goto) {
        // tslint:disable-next-line:no-string-literal
        queryParams["readiumgoto"] = "true";
    } else {
        // tslint:disable-next-line:no-string-literal
        if (typeof queryParams["readiumgoto"] !== "undefined") {
            // tslint:disable-next-line:no-string-literal
            delete queryParams["readiumgoto"];
        }
    }
    if (messageJson.hash) {
        _hashElement = win.document.getElementById(messageJson.hash);
    } else {
        _hashElement = null;
    }

    _readyEventSent = false;
    _locationHashOverride = undefined;
    scrollToHashRaw(false);

    // ipcRenderer.sendToHost(R2_EVENT_WEBVIEW_READY, win.location.href);
    // notifyReadingLocation();
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
            animateProperty(
                win.cancelAnimationFrame,
                undefined,
                // (cancelled: boolean) => {
                //     console.log(cancelled);
                // },
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
            animateProperty(
                win.cancelAnimationFrame,
                undefined,
                // (cancelled: boolean) => {
                //     console.log(cancelled);
                // },
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

const checkReadyPass = () => {
    if (_readyPassDone) {
        return;
    }
    _readyPassDone = true;

    if (DEBUG_VISUALS) {
        if (_hashElement) {
            _hashElement.classList.add("readium2-read-pos");
        }
    }

    win.addEventListener("resize", () => {
        scrollToHash();
    });

    // const docElement = win.document.documentElement;
    // let skipFirstResize = docElement.getAttribute("data-readiumcss") || false;
    // let skipFirstScroll = skipFirstResize;

    setTimeout(() => {
        scrollToHashRaw(true);

        win.addEventListener("scroll", (_ev: Event) => {

            if (_ignoreScrollEvent) {
                _ignoreScrollEvent = false;
                return;
            }
            // if (skipFirstScroll) {
            //     skipFirstScroll = false;
            //     return;
            // }

            processXY(0, 0);
        });

    }, 800);

    const useResizeSensor = true;
    if (useResizeSensor && win.document.body) {

        setTimeout(() => {
            window.requestAnimationFrame((_timestamp) => {
                // new (win as any).
                // tslint:disable-next-line:no-unused-expression
                new ResizeSensor(win.document.body, () => {

                    console.log("ResizeSensor");

                    scrollToHash();

                    // if (skipFirstResize) {
                    //     console.log("ResizeSensor SKIP FIRST");

                    //     skipFirstResize = false;
                    //     return;
                    // } else {
                    //     console.log("ResizeSensor");
                    // }
                });
            });
        }, 2000);
    }

    if (win.document.body) {

        win.document.body.addEventListener("click", (ev: MouseEvent) => {

            const x = ev.clientX; // win.document.body.scrollLeft;
            const y = ev.clientY; // win.document.body.scrollTop;

            processXY(x, y);
        });
    }
};

const notifyReady = () => {
    if (_readyEventSent) {
        return;
    }
    _readyEventSent = true;

    ipcRenderer.sendToHost(R2_EVENT_WEBVIEW_READY, win.location.href);
};

const scrollToHashRaw = (firstCall: boolean) => {

    console.log("scrollToHash: " + firstCall);

    if (_locationHashOverride) {

        console.log("_locationHashOverride");

        if (_locationHashOverride === win.document.body) {
            console.log("body...");

            return;
        }

        notifyReady();
        notifyReadingLocation();

        _ignoreScrollEvent = true;
        _locationHashOverride.scrollIntoView({
            behavior: "instant",
            block: "start",
            inline: "nearest",
        });

        return;
    } else if (_hashElement) {

        console.log("_hashElement");

        _locationHashOverride = _hashElement;
        // _locationHashOverrideCSSselector = fullQualifiedSelector(_locationHashOverride, false);

        notifyReady();
        notifyReadingLocation();

        if (!firstCall) {
            _ignoreScrollEvent = true;
            _hashElement.scrollIntoView({
                behavior: "instant",
                block: "start",
                inline: "nearest",
            });
        }

        // _hashElement.classList.add("readium2-hash");
        // setTimeout(() => {
        //     if (_hashElement) {
        //         _hashElement.classList.remove("readium2-hash");
        //     }
        // }, 1000);

        return;
    } else {
        if (win.document.body) {

            if (queryParams) {
                // tslint:disable-next-line:no-string-literal
                const previous = queryParams["readiumprevious"];
                const isPreviousNavDirection = previous === "true";
                if (isPreviousNavDirection) {

                    console.log("readiumprevious");

                    const maxHeightShift = win.document.body.scrollHeight - win.document.documentElement.clientHeight;

                    _ignoreScrollEvent = true;
                    win.document.body.scrollLeft = 0;
                    win.document.body.scrollTop = maxHeightShift;

                    _locationHashOverride = undefined;
                    _locationHashOverrideCSSselector = undefined;
                    processXYRaw(0, win.document.documentElement.clientHeight - 1);

                    console.log("BOTTOM (previous):");
                    console.log(_locationHashOverride);

                    notifyReady();
                    notifyReadingLocation();
                    return;
                }

                // tslint:disable-next-line:no-string-literal
                let gotoCssSelector = queryParams["readiumgoto"];
                if (gotoCssSelector) {
                    gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");
                    // console.log("GOTO: " + gotoCssSelector);
                    let selected: Element | null = null;
                    try {
                        selected = document.querySelector(gotoCssSelector);
                    } catch (err) {
                        console.log(err);
                    }
                    if (selected) {

                        console.log("readiumgoto");

                        _locationHashOverride = selected;
                        _locationHashOverrideCSSselector = gotoCssSelector;

                        notifyReady();
                        notifyReadingLocation();

                        _ignoreScrollEvent = true;
                        selected.scrollIntoView({
                            behavior: "instant",
                            block: "start",
                            inline: "nearest",
                        });

                        return;
                    }
                }
            }

            console.log("_locationHashOverride = win.document.body");

            _locationHashOverride = win.document.body;
            _locationHashOverrideCSSselector = undefined;

            _ignoreScrollEvent = true;
            win.document.body.scrollLeft = 0;
            win.document.body.scrollTop = 0;
        }
    }

    notifyReady();
    notifyReadingLocation();
};

const scrollToHash = debounce(() => {
    scrollToHashRaw(false);
}, 500);

let _ignoreScrollEvent = false;

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
let _locationHashOverrideCSSselector: string | undefined;
let _readyPassDone = false;
let _readyEventSent = false;

const resetInitialState = () => {
    _locationHashOverride = undefined;
    _readyPassDone = false;
    _readyEventSent = false;
};

// after DOMContentLoaded
win.addEventListener("load", () => {
    // console.log("PRELOAD WIN LOAD");
    checkReadyPass();
});

// // does not occur when re-using same webview (src="href")
// win.addEventListener("unload", () => {
//     console.log("PRELOAD WIN UNLOAD");
//     resetInitialState();
// });

win.addEventListener("DOMContentLoaded", () => {

    if (win.location.hash && win.location.hash.length > 1) {
        _hashElement = win.document.getElementById(win.location.hash.substr(1));
    }

    resetInitialState();

    injectDefaultCSS();

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

const processXYRaw = (x: number, y: number) => {
    console.log("processXY");

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
        notifyReadingLocation();

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
const processXY = debounce((x: number, y: number) => {
    processXYRaw(x, y);
}, 300);

const notifyReadingLocation = () => {
    if (!_locationHashOverride) {
        return;
    }
    _locationHashOverrideCSSselector = fullQualifiedSelector(_locationHashOverride, false);
    ipcRenderer.sendToHost(R2_EVENT_READING_LOCATION, _locationHashOverrideCSSselector);
};
