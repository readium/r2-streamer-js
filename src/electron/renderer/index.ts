import debounce = require("debounce");
import { shell } from "electron";
import { ipcRenderer } from "electron";
import ElectronStore = require("electron-store");
import { R2_EVENT_LINK, R2_EVENT_READIUMCSS, R2_EVENT_TRY_LCP_PASS, R2_EVENT_TRY_LCP_PASS_RES } from "../common/events";
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

// import { riotMountMyTag } from "./riots/mytag/index_";
// import { RiotMixinWithOpts } from "./riots/riot_mixin_EventTracer";
// import { startServiceWorkerExperiment } from "./sw/index_service-worker";

// console.log("INDEX");

// console.log(window.location);
// console.log(document.baseURI);
// console.log(document.URL);

const queryParams = getURLQueryParams();

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];

// console.log(" (((( publicationJsonUrl )))) " + publicationJsonUrl);

const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
// console.log(pathBase64);
const pathDecoded = window.atob(pathBase64);
// console.log(pathDecoded);
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

(electronStore as any).onDidChange("styling.night", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    // console.log("STORE CHANGE: styling.night");
    // console.log(oldValue);
    // console.log(newValue);

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

const readiumCssOnOff = debounce(() => {
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

        _webviews.forEach((wv) => {
            wv.send(R2_EVENT_READIUMCSS, JSON.stringify(jsonMsg)); // .getWebContents()
        });
    } else {
        const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };

        _webviews.forEach((wv) => {
            wv.send(R2_EVENT_READIUMCSS, JSON.stringify(jsonMsg)); // .getWebContents()
        });
    }
}, 500);

(electronStore as any).onDidChange("styling.readiumcss", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }
    // console.log("STORE CHANGE: styling.readiumcss");
    // console.log(oldValue);
    // console.log(newValue);

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
    // console.log("STORE CHANGE: basicLinkTitles");
    // console.log(oldValue);
    // console.log(newValue);

    const basicSwitch = document.getElementById("nav_basic_switch-input");
    if (basicSwitch) {
        (basicSwitch as HTMLInputElement).checked = !newValue;
    }

    // const tags: RiotTag[] = riot.update();
    // // console.log(tags);
    // // console.log(riot);
    // // console.log("----- 1");
    // tags.forEach((tag) => {
    //     // (tag.opts as any).basic = !checked;
    //     if ((tag.opts as any).fixBasic) {
    //         return;
    //     }
    //     if ((tag as any).setBasic) {
    //         (tag as any).setBasic(newValue);
    //         // console.log(tag);
    //         tag.update();
    //     }
    // });
    // // console.log("----- 2");
    // // riot.update();
    // // tags.forEach((tag) => {
    // //     // tag.update();
    // //     console.log("-----");
    // //     console.log(tag.opts.basic);
    // //     tag.update({ basic: !checked });
    // //     console.log(tag);
    // //     console.log(tag.opts.basic);
    // // });
});

let snackBar: any;
let drawer: any;

export function handleLink(href: string) {
    // console.log("handleLink");
    // console.log(href);

    const prefix = publicationJsonUrl.replace("manifest.json", "");
    if (href.startsWith(prefix)) {
        if (drawer.open) {
            drawer.open = false;
            setTimeout(() => {
                loadLink(href, href.replace(prefix, ""), publicationJsonUrl);
            }, 500);
        } else {
            loadLink(href, href.replace(prefix, ""), publicationJsonUrl);
        }
    } else {
        shell.openExternal(href);
    }
}

window.onerror = (err) => {
    console.log("Error", err);
};

ipcRenderer.on(R2_EVENT_LINK, (_event: any, href: string) => {
    // console.log("R2_EVENT_LINK");
    // console.log(href);
    handleLink(href);
});

ipcRenderer.on(R2_EVENT_TRY_LCP_PASS_RES, (_event: any, okay: boolean, msg: string) => {
    // console.log("R2_EVENT_TRY_LCP_PASS_RES");
    // console.log(okay);
    // console.log(msg);

    if (!okay) {
        // const message = "LCP error.";
        // const data = {
        //     // actionHandler: () => {
        //     //     console.log("SnackBar OK");
        //     // },
        //     // actionOnBottom: false,
        //     actionText: null,
        //     message,
        //     multiline: false,
        //     timeout: 1000,
        // };
        // snackBar.show(data);

        setTimeout(() => {
            showLcpDialog(msg);
        }, 500);

        return;
    }

    startNavigatorExperiment();

    // const lcpPassMessage = document.getElementById("lcpPassMessage");
    // const lcpPassForm = document.getElementById("lcpPassForm");
    // if (!lcpPassMessage || !lcpPassForm) {
    //     return;
    // }

    // (lcpPassMessage as HTMLInputElement).textContent = message;

    // if (okay) {
    //     setTimeout(() => {
    //         lcpPassForm.style.display = "none";
    //     }, 1000);
    // }
});

let lcpDialog: any;

function showLcpDialog(message?: string) {

    // dialog.lastFocusedTarget = evt.target;

    // const lcpPassForm = document.getElementById("lcpPassForm");
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
    // document.body.addEventListener("mouseup", () => {
    //     dateLastMouseEvent = new Date();
    // });
    // document.body.addEventListener("keyup", () => {
    //     dateLastKeyboardEvent = new Date();
    // });
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
        selected: electronStore.get("styling.font"), // options[0].id,
    };
    const tag = riotMountMenuSelect("#fontSelect", opts)[0] as IRiotTagMenuSelect;
    // data-is="riot-menuselect"

    tag.on("selectionChanged", (val: string) => {
        // console.log("selectionChanged (font)");

        electronStore.set("styling.font", val);
    });

    (electronStore as any).onDidChange("styling.font", (newValue: any, oldValue: any) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }

        // console.log("styling.font");

        tag.setSelectedItem(newValue);

        readiumCssOnOff();
    });

    (electronStore as any).onDidChange("styling.readiumcss", (newValue: any, oldValue: any) => {
        if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
            return;
        }

        // console.log("styling.readiumcss");

        tag.setDisabled(!newValue);
    });
};

window.addEventListener("DOMContentLoaded", () => {

    setTimeout(() => {
        // material-components-web
        (window as any).mdc.autoInit();
    }, 500);

    // const tag = riot.mount("*");
    // riotMountMyTag({ opt1: "val1" });

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
            // console.log("DRAWER CLICK");
            // console.log(ev.target);
            const allMenus = drawerElement.querySelectorAll(".mdc-simple-menu");
            const openedMenus: Node[] = [];
            allMenus.forEach((elem) => {
                if ((elem as any).mdcSimpleMenu && (elem as any).mdcSimpleMenu.open) {
                    // console.log("OPENED MENU");
                    // console.log(elem);
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
                    // console.log("CLOSING MENU");
                    // console.log(elem);
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
        // console.log("MDCDialog:accept");

        const lcpPass = (lcpPassInput as HTMLInputElement).value;

        ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass);
    });
    lcpDialog.listen("MDCDialog:cancel", () => {
        // console.log("MDCDialog:cancel");

        // ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, "NILL");
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
        showLcpDialog();
    } else {
        startNavigatorExperiment();
    }

    // const buttonStart = document.getElementById("buttonStart");
    // if (buttonStart) {
    //     buttonStart.addEventListener("click", () => {
    //         buttonStart.setAttribute("disabled", "");
    //         buttonStart.style.display = "none";
    //         // startServiceWorkerExperiment(publicationJsonUrl);
    //         startNavigatorExperiment(publicationJsonUrl);
    //     });
    // }

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

            // console.log(electronStore.store);
            // (electronStore.store as any).styling = defaultsStyling;
            electronStore.set("styling", defaultsStyling);
            // console.log(electronStore.store);

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
    // webview.setAttribute("src", "dummy");
    // webview1.style.visibility = "hidden";
    webview1.setAttribute("disableguestresize", "");

    webview1.addEventListener("ipc-message", (event) => {
        // console.log("webview1 ipc-message");
        // console.log(event.channel);
        if (event.channel === R2_EVENT_LINK) {
            handleLink(event.args[0]);
        }
    });

    webview1.addEventListener("dom-ready", () => {
        // webview1.openDevTools();
        console.log("WEBVIEW DOM READY: " + _webviews.length);

        webview1.clearHistory();

        readiumCssOnOff();

        // webview1.style.visibility = "visible";

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

function loadLink(hrefFull: string, _hrefPartial: string, _publicationJsonUrl: string) {
    if (_webviews.length) {
        _webviews[0].setAttribute("src", hrefFull);
        // _webviews[0].getWebContents().loadURL(tocLinkHref, { extraHeaders: "pragma: no-cache\n" });
        // _webviews[0].loadURL(tocLinkHref, { extraHeaders: "pragma: no-cache\n" });
    }
}

function startNavigatorExperiment() {

    // document.body.style.backgroundColor = "silver";

    // const h1 = document.querySelector("html > body > h1");
    // if (h1) {
    //     (h1 as HTMLElement).style.color = "green";
    // }

    // const readerChrome = document.getElementById("reader_chrome");
    // const readerControls = document.getElementById("reader_controls");

    // const showControlsButton = document.getElementById("showControlsButton");
    // if (showControlsButton) {
    //     showControlsButton.style.display = "block";
    //     showControlsButton.addEventListener("click", (_event) => {
    //         if (readerControls) {
    //             readerControls.style.display = "block";
    //         }
    //         const hideControlsButt = document.getElementById("hideControlsButton");
    //         if (hideControlsButt) {
    //             hideControlsButt.style.display = "block ";
    //         }
    //     });
    // }
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
            // console.log("NIGHT checked: " + checked);
            electronStore.set("styling.night", checked);
        });

        // if (!electronStore.get("styling.readiumcss")) {
        //     nightSwitch.setAttribute("disabled", "");
        // } else {
        //     nightSwitch.removeAttribute("disabled");
        // }
        (nightSwitch as HTMLInputElement).disabled = !electronStore.get("styling.readiumcss");
    }

    const readiumcssSwitch = document.getElementById("readiumcss_switch-input");
    if (readiumcssSwitch) {
        (readiumcssSwitch as HTMLInputElement).checked = electronStore.get("styling.readiumcss");
        readiumcssSwitch.addEventListener("change", (_event) => {
            const checked = (readiumcssSwitch as HTMLInputElement).checked;
            // console.log("READIUMCSS checked: " + checked);
            electronStore.set("styling.readiumcss", checked);
        });
    }

    const basicSwitch = document.getElementById("nav_basic_switch-input");
    if (basicSwitch) {
        (basicSwitch as HTMLInputElement).checked = !electronStore.get("basicLinkTitles");
        basicSwitch.addEventListener("change", (_event) => {
            const checked = (basicSwitch as HTMLInputElement).checked;
            // console.log("BASIC checked: " + checked);
            electronStore.set("basicLinkTitles", !checked);
        });
    }

    // tslint:disable-next-line:no-floating-promises
    (async () => {

        // try {
        //     // hacky :) (just for testing);
        //     // (initializes the LCP pass)
        //     await fetch(publicationJsonUrl.replace("/pub/",
        //         "/pub/*-" +
        //         "ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg" +
        //         "==-*"));
        // } catch (e) {
        //     console.log(e);
        // }

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

        let publicationJson: any | undefined;
        try {
            publicationJson = await response.json();
        } catch (e) {
            console.log(e);
        }
        if (!publicationJson) {
            return;
        }
        // console.log(publicationJson);

        if (publicationJson.metadata && publicationJson.metadata.title) {
            const h1 = document.getElementById("pubTitle");
            if (h1) {
                (h1 as HTMLElement).textContent = publicationJson.metadata.title;
            }
        }

        const buttonNavLeft = document.getElementById("buttonNavLeft");
        if (buttonNavLeft) {
            buttonNavLeft.addEventListener("click", (_event) => {
                navLeftOrRight(false, publicationJsonUrl, publicationJson);
            });
        }

        const buttonNavRight = document.getElementById("buttonNavRight");
        if (buttonNavRight) {
            buttonNavRight.addEventListener("click", (_event) => {
                navLeftOrRight(true, publicationJsonUrl, publicationJson);
            });
        }

        if (publicationJson.spine) {

            const opts: IRiotOptsLinkList = {
                // get basic() {
                //     return true;
                // },
                basic: true,
                fixBasic: true, // always single-line list items (no title)
                links: publicationJson.spine as IRiotOptsLinkListItem[],
                url: publicationJsonUrl,
            };
            // const tag =
            riotMountLinkList("#reader_controls_SPINE", opts);
            // data-is="riot-linklist"

            const firstLinear = publicationJson.spine.length ? publicationJson.spine[0] : undefined;
            if (firstLinear) {
                setTimeout(() => {
                    const firstLinearLinkHref = publicationJsonUrl + "/../" + firstLinear.href;
                    handleLink(firstLinearLinkHref);
                }, 200);
            }

            // const readerControlsSpine = document.getElementById("reader_controls_SPINE");
            // let firstLinear: any | undefined;
            // publicationJson.spine.forEach((spineItem: any) => {
            //     // in Readium2, spine items are always linear (otherwise just "resource" collection)
            //     if (!firstLinear) { // && (!spineItem.linear || spineItem.linear === "yes")) {
            //         firstLinear = spineItem;
            //     }
            //     const spineItemLink = document.createElement("a");
            //     const spineItemLinkHref = publicationJsonUrl + "/../" + spineItem.href;
            //     spineItemLink.setAttribute("href", spineItemLinkHref);
            //     spineItemLink.setAttribute("data-href", spineItem.href);
            //     spineItemLink.addEventListener("click", (event) => {
            //         event.preventDefault();
            //         loadLink(spineItemLinkHref, spineItem.href, publicationJsonUrl);
            //     });
            //     spineItemLink.appendChild(document.createTextNode(spineItem.href));
            //     if (readerControlsSpine) {
            //         readerControlsSpine.appendChild(spineItemLink);
            //         readerControlsSpine.appendChild(document.createElement("br"));
            //     }
            // });
            // if (firstLinear) {
            //     setTimeout(() => {
            //         const firstLinearLinkHref = publicationJsonUrl + "/../" + firstLinear.href;
            //         loadLink(firstLinearLinkHref, firstLinear.href, publicationJsonUrl);
            //     }, 200);
            // }
        }

        if (publicationJson.toc && publicationJson.toc.length) {

            const opts: IRiotOptsLinkTree = {
                // get basic() {
                //     return electronStore.get("basicLinkTitles");
                // },
                basic: electronStore.get("basicLinkTitles"),
                links: publicationJson.toc as IRiotOptsLinkTreeItem[],
                url: publicationJsonUrl,
            };
            const tag = riotMountLinkTree("#reader_controls_TOC", opts)[0] as IRiotTagLinkTree;
            // data-is="riot-linktree"

            (electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                // console.log("STORE CHANGE 1: basicLinkTitles");
                // console.log(oldValue);
                // console.log(newValue);
                // console.log(electronStore.get("basicLinkTitles"));
                // console.log(tag.opts.basic);
                // console.log(tag);

                tag.setBasic(newValue);
            });

            // const readerControlsToc = document.getElementById("reader_controls_TOC");
            // if (readerControlsToc) {
            //     appendToc(publicationJson.toc, readerControlsToc);
            // }
        }
        if (publicationJson["page-list"] && publicationJson["page-list"].length) {

            const opts: IRiotOptsLinkList = {
                // get basic() {
                //     return electronStore.get("basicLinkTitles");
                // },
                basic: electronStore.get("basicLinkTitles"),
                links: publicationJson["page-list"] as IRiotOptsLinkListItem[],
                url: publicationJsonUrl,
            };
            const tag = riotMountLinkList("#reader_controls_PAGELIST", opts)[0] as IRiotTagLinkList;
            // data-is="riot-linklist"

            (electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                // console.log("STORE CHANGE 2: basicLinkTitles");
                // console.log(oldValue);
                // console.log(newValue);
                // console.log(electronStore.get("basicLinkTitles"));
                // console.log(tag);

                tag.setBasic(newValue);
            });

            // const readerControlsPageList = document.getElementById("reader_controls_PAGELIST");
            // if (readerControlsPageList) {
            //     appendToc(publicationJson["page-list"], readerControlsPageList, publicationJsonUrl);
            // }
        }

        const landmarksData: IRiotOptsLinkListGroupItem[] = [];
        if (publicationJson.landmarks && publicationJson.landmarks.length) {
            landmarksData.push({
                label: "Main",
                links: publicationJson.landmarks as IRiotOptsLinkListItem[],
                // url: publicationJsonUrl,
            });
        }
        if (publicationJson.lot && publicationJson.lot.length) {
            landmarksData.push({
                label: "Tables",
                links: publicationJson.lot as IRiotOptsLinkListItem[],
                // url: publicationJsonUrl,
            });
        }
        if (publicationJson.loi && publicationJson.loi.length) {
            landmarksData.push({
                label: "Illustrations",
                links: publicationJson.loi as IRiotOptsLinkListItem[],
                // url: publicationJsonUrl,
            });
        }
        if (publicationJson.lov && publicationJson.lov.length) {
            landmarksData.push({
                label: "Video",
                links: publicationJson.lov as IRiotOptsLinkListItem[],
                // url: publicationJsonUrl,
            });
        }
        if (publicationJson.loa && publicationJson.loa.length) {
            landmarksData.push({
                label: "Audio",
                links: publicationJson.loa as IRiotOptsLinkListItem[],
                // url: publicationJsonUrl,
            });
        }
        if (landmarksData.length) {
            // landmarksData.push({
            //     label: "Testing...",
            //     links: publicationJson.landmarks,
            //     url: publicationJsonUrl,
            // });
            const opts: IRiotOptsLinkListGroup = {
                // get basic() {
                //     return electronStore.get("basicLinkTitles");
                // },
                basic: electronStore.get("basicLinkTitles"),
                linksgroup: landmarksData,
                url: publicationJsonUrl,
            };
            const tag = riotMountLinkListGroup("#reader_controls_LANDMARKS", opts)[0] as IRiotTagLinkListGroup;
            // data-is="riot-linklistgroup"

            (electronStore as any).onDidChange("basicLinkTitles", (newValue: any, oldValue: any) => {
                if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
                    return;
                }
                // console.log("STORE CHANGE 3: basicLinkTitles");
                // console.log(oldValue);
                // console.log(newValue);
                // console.log(electronStore.get("basicLinkTitles"));
                // console.log(tag);

                tag.setBasic(newValue);
            });
        }

        // const readerControlsLandmarks = document.getElementById("reader_controls_LANDMARKS");
        // if (readerControlsLandmarks) {
        //     if (publicationJson.landmarks && publicationJson.landmarks.length) {
        //         appendToc(publicationJson.landmarks, readerControlsLandmarks, publicationJsonUrl);
        //     }
        //     if (publicationJson.lot && publicationJson.lot.length) {
        //         readerControlsLandmarks.appendChild(document.createElement("hr"));
        //         appendToc(publicationJson.lot, readerControlsLandmarks, publicationJsonUrl);
        //     }
        //     if (publicationJson.loa && publicationJson.loa.length) {
        //         readerControlsLandmarks.appendChild(document.createElement("hr"));
        //         appendToc(publicationJson.loa, readerControlsLandmarks, publicationJsonUrl);
        //     }
        //     if (publicationJson.loi && publicationJson.loi.length) {
        //         readerControlsLandmarks.appendChild(document.createElement("hr"));
        //         appendToc(publicationJson.loi, readerControlsLandmarks, publicationJsonUrl);
        //     }
        //     if (publicationJson.lov && publicationJson.lov.length) {
        //         readerControlsLandmarks.appendChild(document.createElement("hr"));
        //         appendToc(publicationJson.lov, readerControlsLandmarks, publicationJsonUrl);
        //     }
        // }
    })();
    //     const spineItemUrl = publicationJsonUrl + "/../" + publicationJson.spine[0].href;
    //     console.log(spineItemUrl);
    //     webview1.setAttribute("src", spineItemUrl);

    // const a = document.querySelector("html > body > a");
    // a.click();
}

// function appendToc(json: any, anchor: HTMLElement) {

//     const ul = document.createElement("ul");
//     // ul.setAttribute("class", "mdc-list mdc-list--dense");

//     json.forEach((tocLinkJson: any) => {
//         const li = document.createElement("li");
//         // li.setAttribute("class", "mdc-list-item");

//         if (!tocLinkJson.title) {
//             tocLinkJson.title = "xxx";
//         }

//         if (tocLinkJson.href) {
//             const tocLink = document.createElement("a");
//             const tocLinkHref = publicationJsonUrl + "/../" + tocLinkJson.href;
//             tocLink.setAttribute("href", tocLinkHref);
//             tocLink.setAttribute("data-href", tocLinkJson.href);
//             tocLink.setAttribute("title", tocLinkJson.href);
//             tocLink.addEventListener("click", (event) => {
//                 event.preventDefault();
//                 handleLink(tocLinkHref);
//                 // loadLink(tocLinkHref, tocLinkJson.href, publicationJsonUrl);
//             });
//             const linkSpan = document.createElement("span");
//             linkSpan.setAttribute("class", "mdc-list-item__text");
//             linkSpan.appendChild(document.createTextNode(tocLinkJson.title));

//             if (!basicLinkTitles) {
//                 const tocHeading = document.createElement("span");
//                 tocHeading.setAttribute("class", "mdc-list-item__text__secondary");
//                 tocHeading.appendChild(document.createTextNode(tocLinkJson.href));
//                 linkSpan.appendChild(tocHeading);
//             }

//             tocLink.appendChild(linkSpan);
//             li.appendChild(tocLink);

//             // const br = document.createElement("br");
//             // li.appendChild(br);

//         } else {
//             const tocHeading = document.createElement("span");
//             // tocHeading.setAttribute("style", "padding-bottom: 1em;");
//             tocHeading.setAttribute("class", "mdc-list-item__text__secondary");
//             tocHeading.appendChild(document.createTextNode(tocLinkJson.title));
//             li.appendChild(tocHeading);
//         }

//         ul.appendChild(li);

//         if (tocLinkJson.children && tocLinkJson.children.length) {
//             appendToc(tocLinkJson.children, li);
//         }
//     });

//     anchor.appendChild(ul);
// }

function navLeftOrRight(_right: boolean, _publicationJsonUrl: string, _publicationJson: any) {
    // TODO: publication spine + pagination state
}
