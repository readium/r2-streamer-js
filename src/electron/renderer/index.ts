import debounce = require("debounce");
import ElectronStore = require("electron-store");
import URI = require("urijs");

import { shell } from "electron";
import { ipcRenderer } from "electron";
import * as path from "path";
import { JSON as TAJSON } from "ta-json";

import { initGlobals } from "@r2-streamer-js/init-globals";
import { IStringMap } from "@r2-streamer-js/models/metadata-multilang";
import { Publication } from "@r2-streamer-js/models/publication";
import { Link } from "@r2-streamer-js/models/publication-link";
import { setLcpNativePluginPath } from "@r2-streamer-js/parser/epub/lcp";

import {
    R2_EVENT_LINK,
    R2_EVENT_PAGE_TURN,
    R2_EVENT_PAGE_TURN_RES,
    R2_EVENT_READIUMCSS,
    R2_EVENT_TRY_LCP_PASS,
    R2_EVENT_TRY_LCP_PASS_RES,
    R2_EVENT_WEBVIEW_READY,
} from "../common/events";
import { R2_SESSION_WEBVIEW } from "../common/sessions";
import { getURLQueryParams } from "./querystring";
import {
    IRiotOptsLinkList,
    IRiotOptsLinkListItem,
    IRiotTagLinkList,
    riotMountLinkList,
} from "./riots/linklist/index_";
import {
    IRiotOptsLinkListGroup,
    IRiotOptsLinkListGroupItem,
    IRiotTagLinkListGroup,
    riotMountLinkListGroup,
} from "./riots/linklistgroup/index_";
import {
    IRiotOptsLinkTree,
    IRiotOptsLinkTreeItem,
    IRiotTagLinkTree,
    riotMountLinkTree,
} from "./riots/linktree/index_";
import {
    IRiotOptsMenuSelect,
    IRiotOptsMenuSelectItem,
    IRiotTagMenuSelect,
    riotMountMenuSelect,
} from "./riots/menuselect/index_";

// console.log(window.location);
// console.log(document.baseURI);
// console.log(document.URL);

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP/lcp.node"));

const queryParams = getURLQueryParams();

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];

const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");

const pathDecoded = window.atob(pathBase64);

const pathFileName = pathDecoded.substr(
    pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
    pathDecoded.length - 1);

// tslint:disable-next-line:no-string-literal
const lcpHint = queryParams["lcpHint"];

const defaultsStyling = {
    dark: false,
    font: "DEFAULT",
    invert: false,
    night: false,
    readiumcss: false,
    sepia: false,
};
const defaults = {
    basicLinkTitles: true,
    styling: defaultsStyling,
};
const electronStore = new ElectronStore({
    defaults,
    name: "readium2-navigator",
});

const defaultsLCP = {
};
const electronStoreLCP = new ElectronStore({
    defaults: defaultsLCP,
    name: "readium2-navigator-lcp",
});

(electronStore as any).onDidChange("styling.night", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }

    const nightSwitch = document.getElementById("night_switch-input");
    if (nightSwitch) {
        (nightSwitch as HTMLInputElement).checked = newValue;
    }

    if (newValue) {
        document.body.classList.add("mdc-theme--dark");
    } else {
        document.body.classList.remove("mdc-theme--dark");
    }

    readiumCssOnOff();
});

const computeReadiumCssJsonMessage = (): string => {

    const on = electronStore.get("styling.readiumcss");
    if (on) {
        const dark = electronStore.get("styling.dark");
        const font = electronStore.get("styling.font");
        const invert = electronStore.get("styling.invert");
        const night = electronStore.get("styling.night");
        const sepia = electronStore.get("styling.sepia");
        const cssJson = {
            dark,
            font,
            invert,
            night,
            sepia,
        };
        const jsonMsg = { injectCSS: "yes", setCSS: cssJson };
        return JSON.stringify(jsonMsg, null, 0);

    } else {
        const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
        return JSON.stringify(jsonMsg, null, 0);
    }
};

const readiumCssOnOff = debounce(() => {

    const str = computeReadiumCssJsonMessage();
    _webviews.forEach((wv) => {
        wv.send(R2_EVENT_READIUMCSS, str); // .getWebContents()
    });
}, 500);

(electronStore as any).onDidChange("styling.readiumcss", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    if (readiumcssSwitch) {
        (readiumcssSwitch as HTMLInputElement).checked = newValue;
    }

    readiumCssOnOff();

    const nightSwitch = document.getElementById("night_switch-input");
    if (nightSwitch) {
        (nightSwitch as HTMLInputElement).disabled = !newValue;
    }

    if (!newValue) {
        electronStore.set("styling.night", false);
    }
});

(electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    const basicSwitch = document.getElementById("nav_basic_switch-input");
    if (basicSwitch) {
        (basicSwitch as HTMLInputElement).checked = !newValue;
    }
});

let snackBar: any;
let drawer: any;

export function handleLink(href: string, previous: boolean) {
    const prefix = publicationJsonUrl.replace("manifest.json", "");
    if (href.startsWith(prefix)) {
        if (drawer.open) {
            drawer.open = false;
            setTimeout(() => {
                loadLink(href, previous);
            }, 200);
        } else {
            loadLink(href, previous);
        }
    } else {
        shell.openExternal(href);
    }
}

window.onerror = (err) => {
    console.log("Error", err);
};

const unhideWebView = (_id: string, forced: boolean) => {
    const hidePanel = document.getElementById("reader_chrome_HIDE");
    if (hidePanel && hidePanel.style.display === "none") {

        // const message = "Already revealed.";
        // const data = {
        //     actionHandler: () => {
        //         // console.log("SnackBar OK");
        //     },
        //     actionOnBottom: false,
        //     actionText: "OK",
        //     message,
        //     multiline: false,
        //     timeout: 1000,
        // };
        // snackBar.show(data);

        return;
    }
    if (forced) {
        console.log("unhideWebView FORCED");
    }
    // console.log("unhideWebView ID: " + id);
    // if (_webviews.length) {
    // let href = _webviews[0].getAttribute("src");
    // // console.log("WEBVIEW SRC: " + href);
    // const wc = _webviews[0].getWebContents();
    // if (wc) {
    //     const url = wc.getURL();
    //     if (url) {
    //         href = url;
    //         // console.log("WEBVIEW URL: " + href);
    //     }
    // }
    // if (href === id) {
    // console.log("webview unhiding...");

    if (hidePanel) {
        hidePanel.style.display = "none";
    }
    // _webviews[0].style.opacity = "1";
    // _webviews[0].style.visibility = "visible";
    // _webviews[0].classList.remove("hidden");
    // }
    // if (forced) {

    //     const message = "Slow content :(";
    //     const data = {
    //         actionHandler: () => {
    //             // console.log("SnackBar OK");
    //         },
    //         actionOnBottom: false,
    //         actionText: "OK",
    //         message,
    //         multiline: false,
    //         timeout: 1000,
    //     };
    //     snackBar.show(data);
    // }
};

ipcRenderer.on(R2_EVENT_LINK, (_event: any, href: string) => {
    console.log("R2_EVENT_LINK");
    console.log(href);
    handleLink(href, false);
});

ipcRenderer.on(R2_EVENT_TRY_LCP_PASS_RES, (_event: any, okay: boolean, msg: string, passSha256Hex: string) => {

    if (!okay) {
        setTimeout(() => {
            showLcpDialog(msg);
        }, 500);

        return;
    }

    const lcpStore = electronStoreLCP.get("lcp");
    if (!lcpStore) {
        const lcpObj: any = {};
        const pubLcpObj: any = lcpObj[pathDecoded] = {};
        pubLcpObj.sha = passSha256Hex;

        electronStoreLCP.set("lcp", lcpObj);
    } else {
        const pubLcpStore = lcpStore[pathDecoded];
        if (pubLcpStore) {
            pubLcpStore.sha = passSha256Hex;
        } else {
            lcpStore[pathDecoded] = {
                sha: passSha256Hex,
            };
        }
        electronStoreLCP.set("lcp", lcpStore);
    }

    startNavigatorExperiment();
});

let lcpDialog: any;

function showLcpDialog(message?: string) {

    // dialog.lastFocusedTarget = evt.target;

    const lcpPassHint = document.getElementById("lcpPassHint");
    (lcpPassHint as HTMLInputElement).textContent = lcpHint;

    if (message) {
        const lcpPassMessage = document.getElementById("lcpPassMessage");
        (lcpPassMessage as HTMLInputElement).textContent = message;
    }

    lcpDialog.show();
    setTimeout(() => {
        const lcpPassInput = document.getElementById("lcpPassInput");
        if (lcpPassInput) {
            lcpPassInput.focus();
            setTimeout(() => {
                lcpPassInput.classList.add("no-focus-outline");
            }, 500);
        }
    }, 800);
}

function installKeyboardMouseFocusHandler() {
    let dateLastKeyboardEvent = new Date();
    let dateLastMouseEvent = new Date();
    document.body.addEventListener("focusin", debounce((ev: any) => {
        const focusWasTriggeredByMouse = dateLastMouseEvent > dateLastKeyboardEvent;
        if (focusWasTriggeredByMouse) {
            if (ev.target && ev.target.classList) {
                ev.target.classList.add("no-focus-outline");
            }
        }
    }, 500));
    document.body.addEventListener("focusout", (ev: any) => {
        if (ev.target && ev.target.classList) {
            ev.target.classList.remove("no-focus-outline");
        }
    });
    document.body.addEventListener("mousedown", () => {
        dateLastMouseEvent = new Date();
    });
    document.body.addEventListener("keydown", () => {
        dateLastKeyboardEvent = new Date();
    });
}

const initFontSelector = () => {

    const options: IRiotOptsMenuSelectItem[] =
        [{
            id: "DEFAULT",
            label: "Default",
        }, {
            id: "OLD",
            label: "Old Style",
        }, {
            id: "MODERN",
            label: "Modern",
        }, {
            id: "SANS",
            label: "Sans",
        }, {
            id: "HUMAN",
            label: "Humanist",
        }, {
            id: "DYS",
            label: "Readable (dys)",
        }];
    const opts: IRiotOptsMenuSelect = {
        disabled: !electronStore.get("styling.readiumcss"),
        options,
        selected: electronStore.get("styling.font"),
    };
    const tag = riotMountMenuSelect("#fontSelect", opts)[0] as IRiotTagMenuSelect;

    tag.on("selectionChanged", (val: string) => {
        electronStore.set("styling.font", val);
    });

    (electronStore as any).onDidChange("styling.font", (newValue: any, oldValue: any) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setSelectedItem(newValue);

        readiumCssOnOff();
    });

    (electronStore as any).onDidChange("styling.readiumcss", (newValue: any, oldValue: any) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }
        tag.setDisabled(!newValue);
    });
};

window.addEventListener("DOMContentLoaded", () => {

    window.document.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.keyCode === 37) { // left
            navLeftOrRight(true);
        } else if (ev.keyCode === 39) { // right
            navLeftOrRight(false);
        }
    });

    setTimeout(() => {
        // material-components-web
        (window as any).mdc.autoInit();
    }, 500);

    window.document.title = "Readium2 [ " + pathFileName + "]";

    const h1 = document.getElementById("pubTitle");
    if (h1) {
        (h1 as HTMLElement).textContent = pathFileName;
    }

    installKeyboardMouseFocusHandler();

    if (electronStore.get("styling.night")) {
        document.body.classList.add("mdc-theme--dark");
    } else {
        document.body.classList.remove("mdc-theme--dark");
    }

    initFontSelector();

    const snackBarElem = document.getElementById("snackbar");
    snackBar = new (window as any).mdc.snackbar.MDCSnackbar(snackBarElem);
    (snackBarElem as any).mdcSnackbar = snackBar;
    snackBar.dismissesOnAction = true;

    const drawerElement = document.getElementById("drawer");
    drawer = new (window as any).mdc.drawer.MDCTemporaryDrawer(drawerElement);
    (drawerElement as any).mdcTemporaryDrawer = drawer;
    const drawerButton = document.getElementById("drawerButton");
    if (drawerButton) {
        drawerButton.addEventListener("click", () => {
            drawer.open = true;
        });
    }
    if (drawerElement) {
        drawerElement.addEventListener("click", (ev) => {
            const allMenus = drawerElement.querySelectorAll(".mdc-simple-menu");
            const openedMenus: Node[] = [];
            allMenus.forEach((elem) => {
                if ((elem as any).mdcSimpleMenu && (elem as any).mdcSimpleMenu.open) {
                    openedMenus.push(elem);
                }
            });

            let needsToCloseMenus = true;
            let currElem: Node | null = ev.target as Node;
            while (currElem) {
                if (openedMenus.indexOf(currElem) >= 0) {
                    needsToCloseMenus = false;
                    break;
                }
                currElem = currElem.parentNode;
            }
            if (needsToCloseMenus) {
                openedMenus.forEach((elem) => {
                    (elem as any).mdcSimpleMenu.open = false;
                    const ss = (elem.parentNode as HTMLElement).querySelector(".mdc-select__selected-text");
                    if (ss) {
                        (ss as HTMLElement).style.transform = "initial";
                        (ss as HTMLElement).style.opacity = "1";
                        (ss as HTMLElement).focus();
                    }
                });
            } else {
                // console.log("NOT CLOSING MENU");
            }
        }, true);
    }
    // if (drawerElement) {
    //     drawerElement.addEventListener("MDCTemporaryDrawer:open", () => {
    //         console.log("MDCTemporaryDrawer:open");
    //     });
    //     drawerElement.addEventListener("MDCTemporaryDrawer:close", () => {
    //         console.log("MDCTemporaryDrawer:close");
    //     });
    // }

    const menuFactory = (menuEl: HTMLElement) => {
        const menu = new (window as any).mdc.menu.MDCSimpleMenu(menuEl);
        (menuEl as any).mdcSimpleMenu = menu;
        return menu;
    };

    const selectElement = document.getElementById("nav-select");
    const navSelector = new (window as any).mdc.select.MDCSelect(selectElement, undefined, menuFactory);
    (selectElement as any).mdcSelect = navSelector;
    navSelector.listen("MDCSelect:change", (ev: any) => {
        // console.log("MDCSelect:change");
        // console.log(ev);
        // console.log(ev.detail.selectedOptions[0].textContent);
        // console.log(ev.detail.selectedIndex);
        // console.log(ev.detail.value);

        const activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        const newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.selectedIndex + 1) + ")");
        if (newActivePanel) {
            newActivePanel.classList.add("active");
        }
    });

    const diagElem = document.querySelector("#lcpDialog");
    const lcpPassInput = document.getElementById("lcpPassInput");
    lcpDialog = new (window as any).mdc.dialog.MDCDialog(diagElem);
    (diagElem as any).mdcDialog = lcpDialog;
    lcpDialog.listen("MDCDialog:accept", () => {

        const lcpPass = (lcpPassInput as HTMLInputElement).value;

        ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass, false);
    });
    lcpDialog.listen("MDCDialog:cancel", () => {

        setTimeout(() => {
            showLcpDialog();
        }, 10);
    });
    if (lcpPassInput) {
        lcpPassInput.addEventListener("keyup", (ev) => {
            if (ev.keyCode === 13) {
                ev.preventDefault();
                const lcpDialogAcceptButton = document.getElementById("lcpDialogAcceptButton");
                if (lcpDialogAcceptButton) {
                    lcpDialogAcceptButton.click();
                }
            }
        });
    }

    if (lcpHint) {

        let lcpPassSha256Hex: string | undefined;
        const lcpStore = electronStoreLCP.get("lcp");
        if (lcpStore) {
            const pubLcpStore = lcpStore[pathDecoded];
            if (pubLcpStore && pubLcpStore.sha) {
                lcpPassSha256Hex = pubLcpStore.sha;
            }
        }
        if (lcpPassSha256Hex) {
            ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPassSha256Hex, true);
        } else {
            showLcpDialog();
        }
    } else {
        startNavigatorExperiment();
    }

    const buttonClearSettings = document.getElementById("buttonClearSettings");
    if (buttonClearSettings) {
        buttonClearSettings.addEventListener("click", () => {
            // electronStore.clear();
            electronStore.store = defaults;

            drawer.open = false;
            setTimeout(() => {
                const message = "Settings reset.";
                const data = {
                    actionHandler: () => {
                        // console.log("SnackBar OK");
                    },
                    actionOnBottom: false,
                    actionText: "OK",
                    message,
                    multiline: false,
                    timeout: 2000,
                };
                snackBar.show(data);
            }, 500);
        });
    }

    const buttonClearSettingsStyle = document.getElementById("buttonClearSettingsStyle");
    if (buttonClearSettingsStyle) {
        buttonClearSettingsStyle.addEventListener("click", () => {

            electronStore.set("styling", defaultsStyling);

            drawer.open = false;
            setTimeout(() => {
                const message = "Default styles.";
                const data = {
                    actionHandler: () => {
                        // console.log("SnackBar OK");
                    },
                    actionOnBottom: false,
                    actionText: "OK",
                    message,
                    multiline: false,
                    timeout: 2000,
                };
                snackBar.show(data);
            }, 500);
        });
    }

    const buttonOpenSettings = document.getElementById("buttonOpenSettings");
    if (buttonOpenSettings) {
        buttonOpenSettings.addEventListener("click", () => {
            electronStore.openInEditor();
        });
    }

    const buttonDebug = document.getElementById("buttonDebug");
    if (buttonDebug) {
        buttonDebug.addEventListener("click", () => {
            if (document.documentElement.classList.contains("debug")) {
                document.documentElement.classList.remove("debug");
            } else {
                document.documentElement.classList.add("debug");
            }
        });
    }

    // const buttonDevTools = document.getElementById("buttonDevTools");
    // if (buttonDevTools) {
    //     buttonDevTools.addEventListener("click", () => {
    //         ipcRenderer.send(R2_EVENT_DEVTOOLS, "test");
    //     });
    // }
});

const _webviews: Electron.WebviewTag[] = [];

function createWebView() {
    const webview1 = document.createElement("webview");
    webview1.setAttribute("class", "singleFull");
    webview1.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview1.setAttribute("partition", R2_SESSION_WEBVIEW);
    webview1.setAttribute("httpreferrer", publicationJsonUrl);
    webview1.setAttribute("preload", "./preload.js");
    webview1.setAttribute("disableguestresize", "");

    webview1.addEventListener("ipc-message", (event) => {
        if (event.channel === R2_EVENT_LINK) {
            handleLink(event.args[0], false);
        } else if (event.channel === R2_EVENT_WEBVIEW_READY) {
            const id = event.args[0];
            unhideWebView(id, false);
        } else if (event.channel === R2_EVENT_PAGE_TURN_RES) {
            if (!_publication) {
                return;
            }
            // const isRTL = _publication.Metadata &&
            // _publication.Metadata.Direction &&
            // _publication.Metadata.Direction.toLowerCase() === "rtl"; //  any other value is LTR

            const messageString = event.args[0];
            const messageJson = JSON.parse(messageString);
            // const isRTL = messageJson.direction === "RTL"; //  any other value is LTR
            const goPREVIOUS = messageJson.go === "PREVIOUS"; // any other value is NEXT

            if (!(webview1 as any).READIUM2_LINK) {
                console.log("WEBVIEW READIUM2_LINK ??!!");
                return;
            }

            let nextOrPreviousSpineItem: Link | undefined;
            for (let i = 0; i < _publication.Spine.length; i++) {
                if (_publication.Spine[i] === (webview1 as any).READIUM2_LINK) {
                    if (goPREVIOUS && (i - 1) >= 0) {
                        nextOrPreviousSpineItem = _publication.Spine[i - 1];
                    } else if (!goPREVIOUS && (i + 1) < _publication.Spine.length) {
                        nextOrPreviousSpineItem = _publication.Spine[i + 1];
                    }
                    break;
                }
            }
            if (!nextOrPreviousSpineItem) {
                return;
            }
            const linkHref = publicationJsonUrl + "/../" + nextOrPreviousSpineItem.Href;
            handleLink(linkHref, goPREVIOUS);
        } else {
            console.log("webview1 ipc-message");
            console.log(event.channel);
        }
    });

    webview1.addEventListener("dom-ready", () => {
        // webview1.openDevTools();

        webview1.clearHistory();

        // ReadiumCSS config passed into load URL
        // no need to do this in DOM-ready
        // readiumCssOnOff();

        // webview1.getWebContents().on("will-navigate", (evt, url) => {
        //     console.log("webview1.getWebContents().on('will-navigate'");
        //     console.log(evt);
        //     console.log(url);
        //     evt.preventDefault();
        //     // webview1.stop();
        //     shell.openExternal(url);
        // });
    });

    // webview1.addEventListener("will-navigate", (evt) => {
    //     console.log("webview1.addEventListener('will-navigate'");
    //     console.log(evt);
    //     console.log(evt.url);
    //     // evt.preventDefault();
    //     webview1.stop();
    //     shell.openExternal(evt.url);
    // });

    return webview1;
}

window.addEventListener("resize", debounce(() => {

    _webviews.forEach((wv) => {

        // webview.offsetWidth == full including borders
        // webview.scrollWidth == webview.clientWidth == without borders

        // const computedStyle = window.getComputedStyle(webview1);
        // console.log(parseInt(computedStyle.width as string, 10));
        // console.log(parseInt(computedStyle.height as string, 10));

        const width = wv.clientWidth;
        const height = wv.clientHeight;

        const wc = wv.getWebContents();
        if (wc && width && height) {
            wc.setSize({
                normal: {
                    height,
                    width,
                },
            });
        }
    });
}, 200));

function loadLink(hrefFull: string, previous: boolean) {
    if (_publication && _webviews.length) {

        const hidePanel = document.getElementById("reader_chrome_HIDE");
        if (hidePanel) {
            hidePanel.style.display = "block";
        }
        // _webviews[0].style.opacity = "0.6";
        // _webviews[0].style.visibility = "hidden";
        // _webviews[0].classList.add("hidden");
        setTimeout(() => {
            if (_webviews.length) {
                const href = _webviews[0].getAttribute("src");
                if (href) {
                    unhideWebView(href, true);
                }
            }
        }, 5000);

        const rcssJsonstr = computeReadiumCssJsonMessage();
        // const str = window.atob(base64);
        const rcssJsonstrBase64 = window.btoa(rcssJsonstr);

        const linkUri = new URI(hrefFull);
        linkUri.search((data: any) => {
            // overrides existing (leaves others intact)
            data.readiumprevious = previous ? "true" : "false";
            data.readiumcss = rcssJsonstrBase64;
        });

        const pubUri = new URI(publicationJsonUrl);

        // "/pub/BASE64_PATH/manifest.json" ==> "/pub/BASE64_PATH/"
        const pathPrefix = pubUri.path().replace("manifest.json", "");

        // "/pub/BASE64_PATH/epub/chapter.html" ==> "epub/chapter.html"
        const linkPath = linkUri.normalizePath().path().replace(pathPrefix, "");

        let pubLink = _publication.Spine.find((spineLink) => {
            return spineLink.Href === linkPath;
        });
        if (!pubLink) {
            pubLink = _publication.Resources.find((spineLink) => {
                return spineLink.Href === linkPath;
            });
        }
        if (pubLink) {
            (_webviews[0] as any).READIUM2_LINK = pubLink;
        } else {
            console.log("WEBVIEW READIUM2_LINK ??!!");
            (_webviews[0] as any).READIUM2_LINK = undefined;
        }

        const uriStr = linkUri.toString();
        // console.log("####### >>> ---");
        // console.log(uriStr);
        _webviews[0].setAttribute("src", uriStr);
        // _webviews[0].getWebContents().loadURL(uriStr, { extraHeaders: "pragma: no-cache\n" });
        // _webviews[0].loadURL(uriStr, { extraHeaders: "pragma: no-cache\n" });
    }
}

let _publication: Publication | undefined;
let _publicationJSON: any | undefined;

function startNavigatorExperiment() {

    const webviewFull = createWebView();
    _webviews.push(webviewFull);

    const publicationViewport = document.getElementById("publication_viewport");
    if (publicationViewport) {
        publicationViewport.appendChild(webviewFull);
    }

    const nightSwitch = document.getElementById("night_switch-input");
    if (nightSwitch) {
        (nightSwitch as HTMLInputElement).checked = electronStore.get("styling.night");
        nightSwitch.addEventListener("change", (_event) => {
            const checked = (nightSwitch as HTMLInputElement).checked;
            electronStore.set("styling.night", checked);
        });
        (nightSwitch as HTMLInputElement).disabled = !electronStore.get("styling.readiumcss");
    }

    const readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    if (readiumcssSwitch) {
        (readiumcssSwitch as HTMLInputElement).checked = electronStore.get("styling.readiumcss");
        readiumcssSwitch.addEventListener("change", (_event) => {
            const checked = (readiumcssSwitch as HTMLInputElement).checked;
            electronStore.set("styling.readiumcss", checked);
        });
    }

    const basicSwitch = document.getElementById("nav_basic_switch-input");
    if (basicSwitch) {
        (basicSwitch as HTMLInputElement).checked = !electronStore.get("basicLinkTitles");
        basicSwitch.addEventListener("change", (_event) => {
            const checked = (basicSwitch as HTMLInputElement).checked;
            electronStore.set("basicLinkTitles", !checked);
        });
    }

    // tslint:disable-next-line:no-floating-promises
    (async () => {

        let response: Response | undefined;
        try {
            response = await fetch(publicationJsonUrl);
        } catch (e) {
            console.log(e);
        }
        if (!response) {
            return;
        }
        if (!response.ok) {
            console.log("BAD RESPONSE?!");
        }
        // response.headers.forEach((arg0: any, arg1: any) => {
        //     console.log(arg0 + " => " + arg1);
        // });

        try {
            _publicationJSON = await response.json();
        } catch (e) {
            console.log(e);
        }
        if (!_publicationJSON) {
            return;
        }
        // const pubJson = global.JSON.parse(publicationStr);

        _publication = TAJSON.deserialize<Publication>(_publicationJSON, Publication);

        if (_publication.Metadata && _publication.Metadata.Title) {
            let title: string | undefined;
            if (typeof _publication.Metadata.Title === "string") {
                title = _publication.Metadata.Title;
            } else {
                const keys = Object.keys(_publication.Metadata.Title as IStringMap);
                if (keys && keys.length) {
                    title = (_publication.Metadata.Title as IStringMap)[keys[0]];
                }
            }

            if (title) {
                const h1 = document.getElementById("pubTitle");
                if (h1) {
                    (h1 as HTMLElement).textContent = title;
                }
            }
        }

        const buttonNavLeft = document.getElementById("buttonNavLeft");
        if (buttonNavLeft) {
            buttonNavLeft.addEventListener("click", (_event) => {
                navLeftOrRight(true);
            });
        }

        const buttonNavRight = document.getElementById("buttonNavRight");
        if (buttonNavRight) {
            buttonNavRight.addEventListener("click", (_event) => {
                navLeftOrRight(false);
            });
        }

        if (_publication.Spine && _publication.Spine.length) {

            const opts: IRiotOptsLinkList = {
                basic: true,
                fixBasic: true, // always single-line list items (no title)
                links: _publicationJSON.spine as IRiotOptsLinkListItem[],
                url: publicationJsonUrl,
            };
            // const tag =
            riotMountLinkList("#reader_controls_SPINE", opts);

            const firstLinear = _publication.Spine[0];
            if (firstLinear) {
                setTimeout(() => {
                    const firstLinearLinkHref = publicationJsonUrl + "/../" + firstLinear.Href;
                    handleLink(firstLinearLinkHref, false);
                }, 200);
            }
        }

        if (_publication.TOC && _publication.TOC.length) {

            const opts: IRiotOptsLinkTree = {
                basic: electronStore.get("basicLinkTitles"),
                links: _publicationJSON.toc as IRiotOptsLinkTreeItem[],
                url: publicationJsonUrl,
            };
            const tag = riotMountLinkTree("#reader_controls_TOC", opts)[0] as IRiotTagLinkTree;

            (electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }
        if (_publication.PageList && _publication.PageList.length) {

            const opts: IRiotOptsLinkList = {
                basic: electronStore.get("basicLinkTitles"),
                links: _publicationJSON["page-list"] as IRiotOptsLinkListItem[],
                url: publicationJsonUrl,
            };
            const tag = riotMountLinkList("#reader_controls_PAGELIST", opts)[0] as IRiotTagLinkList;

            (electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }

        const landmarksData: IRiotOptsLinkListGroupItem[] = [];
        if (_publication.Landmarks && _publication.Landmarks.length) {
            landmarksData.push({
                label: "Main",
                links: _publicationJSON.landmarks as IRiotOptsLinkListItem[],
            });
        }
        if (_publication.LOT && _publication.LOT.length) {
            landmarksData.push({
                label: "Tables",
                links: _publicationJSON.lot as IRiotOptsLinkListItem[],
            });
        }
        if (_publication.LOI && _publication.LOI.length) {
            landmarksData.push({
                label: "Illustrations",
                links: _publicationJSON.loi as IRiotOptsLinkListItem[],
            });
        }
        if (_publication.LOV && _publication.LOV.length) {
            landmarksData.push({
                label: "Video",
                links: _publicationJSON.lov as IRiotOptsLinkListItem[],
            });
        }
        if (_publication.LOA && _publication.LOA.length) {
            landmarksData.push({
                label: "Audio",
                links: _publicationJSON.loa as IRiotOptsLinkListItem[],
            });
        }
        if (landmarksData.length) {
            const opts: IRiotOptsLinkListGroup = {
                basic: electronStore.get("basicLinkTitles"),
                linksgroup: landmarksData,
                url: publicationJsonUrl,
            };
            const tag = riotMountLinkListGroup("#reader_controls_LANDMARKS", opts)[0] as IRiotTagLinkListGroup;

            (electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                tag.setBasic(newValue);
            });
        }
    })();
}

function navLeftOrRight(left: boolean) {
    if (!_publication) {
        return;
    }
    const isRTL = _publication.Metadata &&
        _publication.Metadata.Direction &&
        _publication.Metadata.Direction.toLowerCase() === "rtl"; //  any other value is LTR
    const goPREVIOUS = left ? !isRTL : isRTL;
    const messageJson = {
        direction: isRTL ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    const messageStr = JSON.stringify(messageJson);
    _webviews.forEach((wv) => {
        wv.send(R2_EVENT_PAGE_TURN, messageStr); // .getWebContents()
    });
}
