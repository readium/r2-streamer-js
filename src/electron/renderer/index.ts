import debounce = require("debounce");
import { ipcRenderer } from "electron";
import { shell } from "electron";
import { R2_EVENT_LINK, R2_EVENT_READIUMCSS, R2_EVENT_TRY_LCP_PASS, R2_EVENT_TRY_LCP_PASS_RES } from "../common/events";
import { R2_SESSION_WEBVIEW } from "../common/sessions";
import { getURLQueryParams } from "./querystring";
import { riotMountSpineList } from "./riots/spinelist/index_";
import { riotMountSpineListGroup } from "./riots/spinelistgroup/index_";

// import { riotMountMyTag } from "./riots/mytag/index_";
// import { RiotMixinWithOpts } from "./riots/riot_mixin_EventTracer";
// import { startServiceWorkerExperiment } from "./sw/index_service-worker";

console.log("INDEX");

console.log(window.location);
console.log(document.baseURI);
console.log(document.URL);

const queryParams = getURLQueryParams();

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];

console.log(" (((( publicationJsonUrl )))) " + publicationJsonUrl);

const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
console.log(pathBase64);
const pathDecoded = window.atob(pathBase64);
console.log(pathDecoded);
const pathFileName = pathDecoded.substr(
    pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
    pathDecoded.length - 1);

// tslint:disable-next-line:no-string-literal
const lcpHint = queryParams["lcpHint"];

const basicLinkTitles = true;

let snackBar: any;
let drawer: any;

export function handleLink(href: string) {
    console.log(href);
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
    console.log("R2_EVENT_LINK");
    console.log(href);
    handleLink(href);
});

ipcRenderer.on(R2_EVENT_TRY_LCP_PASS_RES, (_event: any, okay: boolean, msg: string) => {
    console.log("R2_EVENT_TRY_LCP_PASS_RES");
    console.log(okay);
    console.log(msg);

    if (!okay) {
        showLcpDialog(msg);
        return;
    }

    const message = "Correct publication passphrase.";
    const data = {
        actionHandler: () => {
            console.log("SnackBar OK");
        },
        actionOnBottom: false,
        actionText: "OK",
        message,
        multiline: false,
        timeout: 2000,
    };
    snackBar.show(data);
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
        }
    }, 1000);
}

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

    const snackBarElem = document.getElementById("snackbar");
    snackBar = new (window as any).mdc.snackbar.MDCSnackbar(snackBarElem);
    snackBar.dismissesOnAction = true;

    const drawerElement = document.getElementById("drawer");
    drawer = new (window as any).mdc.drawer.MDCTemporaryDrawer(drawerElement);
    const drawerButton = document.getElementById("drawerButton");
    if (drawerButton) {
        drawerButton.addEventListener("click", () => {
            drawer.open = true;
        });
    }
    if (drawerElement) {
        drawerElement.addEventListener("MDCTemporaryDrawer:open", () => {
            console.log("MDCTemporaryDrawer:open");
        });
        drawerElement.addEventListener("MDCTemporaryDrawer:close", () => {
            console.log("MDCTemporaryDrawer:close");
        });
    }

    const selectElement = document.getElementById("nav-select");
    const navSelector = new (window as any).mdc.select.MDCSelect(selectElement);
    navSelector.listen("MDCSelect:change", (ev: any) => {
        console.log("MDCSelect:change");
        console.log(ev);
        console.log(ev.detail.selectedOptions[0].textContent);
        console.log(ev.detail.selectedIndex);
        console.log(ev.detail.value);

        const activePanel = document.querySelector(".tabPanel.active");
        if (activePanel) {
            activePanel.classList.remove("active");
        }
        const newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.selectedIndex + 1) + ")");
        if (newActivePanel) {
            newActivePanel.classList.add("active");
        }
    });

    // const tabsElement = document.getElementById("tabs");
    // const tabs = new (window as any).mdc.tabs.MDCTabBarScroller(tabsElement);
    // // tabs.tabBar.layout();
    // tabs.tabBar.preventDefaultOnClick = true;
    // tabs.tabBar.listen("MDCTabBar:change", (ev: any) => {
    //     console.log("MDCTabBar:change");
    //     console.log(ev.detail.activeTabIndex);
    //     const activePanel = document.querySelector(".tabPanel.active");
    //     if (activePanel) {
    //         activePanel.classList.remove("active");
    //     }
    //     const newActivePanel = document.querySelector(".tabPanel:nth-child(" + (ev.detail.activeTabIndex + 1) + ")");
    //     if (newActivePanel) {
    //         newActivePanel.classList.add("active");
    //     }
    // });

    const diagElem = document.querySelector("#lcpDialog");
    const lcpPassInput = document.getElementById("lcpPassInput");
    lcpDialog = new (window as any).mdc.dialog.MDCDialog(diagElem);
    lcpDialog.listen("MDCDialog:accept", () => {
        console.log("MDCDialog:accept");

        const lcpPass = (lcpPassInput as HTMLInputElement).value;

        ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass);
    });
    lcpDialog.listen("MDCDialog:cancel", () => {
        console.log("MDCDialog:cancel");

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

    const buttonDark = document.getElementById("buttonDark");
    if (buttonDark) {
        buttonDark.addEventListener("click", () => {
            if (document.body.classList.contains("mdc-theme--dark")) {
                document.body.classList.remove("mdc-theme--dark");
            } else {
                document.body.classList.add("mdc-theme--dark");
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
        console.log("webview1 ipc-message");
        console.log(event.channel);
        if (event.channel === R2_EVENT_LINK) {
            handleLink(event.args[0]);
        }
    });

    webview1.addEventListener("dom-ready", () => {
        // webview1.openDevTools();
        console.log("WEBVIEW DOM READY: " + _webviews.length);

        webview1.clearHistory();

        const cssButtonN1 = document.getElementById("cssButtonInject");
        if (cssButtonN1) {
            cssButtonN1.removeAttribute("disabled");
        }

        const cssButtonN2 = document.getElementById("cssButtonReset");
        if (cssButtonN2) {
            cssButtonN2.removeAttribute("disabled");
        }

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

    // const hideControlsButton = document.getElementById("hideControlsButton");
    // if (hideControlsButton) {
    //     hideControlsButton.addEventListener("click", (_event) => {
    //         if (readerControls) {
    //             readerControls.style.display = "none";
    //         }
    //         hideControlsButton.style.display = "none";
    //     });
    // }

    const cssButton1 = document.getElementById("cssButtonInject");
    if (cssButton1) {
        cssButton1.addEventListener("click", (_event) => {
            const jsonMsg = { injectCSS: "yes", setCSS: "ok" };

            _webviews.forEach((wv) => {
                wv.send(R2_EVENT_READIUMCSS, JSON.stringify(jsonMsg)); // .getWebContents()
            });
        });
    }

    const cssButton2 = document.getElementById("cssButtonReset");
    if (cssButton2) {
        cssButton2.addEventListener("click", (_event) => {
            const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };

            _webviews.forEach((wv) => {
                wv.send(R2_EVENT_READIUMCSS, JSON.stringify(jsonMsg)); // .getWebContents()
            });
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
        response.headers.forEach((arg0: any, arg1: any) => {
            console.log(arg0 + " => " + arg1);
        });

        let publicationJson: any | undefined;
        try {
            publicationJson = await response.json();
        } catch (e) {
            console.log(e);
        }
        if (!publicationJson) {
            return;
        }
        console.log(publicationJson);

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

            riotMountSpineList("#reader_controls_SPINE",
                { spine: publicationJson.spine, url: publicationJsonUrl, basic: basicLinkTitles });

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
            const readerControlsToc = document.getElementById("reader_controls_TOC");
            if (readerControlsToc) {
                appendToc(publicationJson.toc, readerControlsToc);
            }
        }
        if (publicationJson["page-list"] && publicationJson["page-list"].length) {

            riotMountSpineList("#reader_controls_PAGELIST",
                { spine: publicationJson["page-list"], url: publicationJsonUrl, basic: basicLinkTitles });

            // const readerControlsPageList = document.getElementById("reader_controls_PAGELIST");
            // if (readerControlsPageList) {
            //     appendToc(publicationJson["page-list"], readerControlsPageList, publicationJsonUrl);
            // }
        }

        const landmarksData = [];
        if (publicationJson.landmarks && publicationJson.landmarks.length) {
            landmarksData.push({
                label: "Main",
                spine: publicationJson.landmarks,
                url: publicationJsonUrl,
            });
        }
        if (publicationJson.lot && publicationJson.lot.length) {
            landmarksData.push({
                label: "Tables",
                spine: publicationJson.lot,
                url: publicationJsonUrl,
            });
        }
        if (publicationJson.loi && publicationJson.loi.length) {
            landmarksData.push({
                label: "Illustrations",
                spine: publicationJson.loi,
                url: publicationJsonUrl,
            });
        }
        if (publicationJson.lov && publicationJson.lov.length) {
            landmarksData.push({
                label: "Video",
                spine: publicationJson.lov,
                url: publicationJsonUrl,
            });
        }
        if (publicationJson.loa && publicationJson.loa.length) {
            landmarksData.push({
                label: "Audio",
                spine: publicationJson.loa,
                url: publicationJsonUrl,
            });
        }
        if (landmarksData.length) {
            // landmarksData.push({
            //     label: "Testing...",
            //     spine: publicationJson.landmarks,
            //     url: publicationJsonUrl,
            // });
            riotMountSpineListGroup("#reader_controls_LANDMARKS",
                { spinegroup: landmarksData, url: publicationJsonUrl, basic: basicLinkTitles });
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

function appendToc(json: any, anchor: HTMLElement) {

    const ul = document.createElement("ul");
    // ul.setAttribute("class", "mdc-list mdc-list--dense");

    json.forEach((tocLinkJson: any) => {
        const li = document.createElement("li");
        // li.setAttribute("class", "mdc-list-item");

        if (!tocLinkJson.title) {
            tocLinkJson.title = "xxx";
        }

        if (tocLinkJson.href) {
            const tocLink = document.createElement("a");
            const tocLinkHref = publicationJsonUrl + "/../" + tocLinkJson.href;
            tocLink.setAttribute("href", tocLinkHref);
            tocLink.setAttribute("data-href", tocLinkJson.href);
            tocLink.setAttribute("title", tocLinkJson.href);
            tocLink.addEventListener("click", (event) => {
                event.preventDefault();
                handleLink(tocLinkHref);
                // loadLink(tocLinkHref, tocLinkJson.href, publicationJsonUrl);
            });
            const linkSpan = document.createElement("span");
            linkSpan.setAttribute("class", "mdc-list-item__text");
            linkSpan.appendChild(document.createTextNode(tocLinkJson.title));

            if (!basicLinkTitles) {
                const tocHeading = document.createElement("span");
                tocHeading.setAttribute("class", "mdc-list-item__text__secondary");
                tocHeading.appendChild(document.createTextNode(tocLinkJson.href));
                linkSpan.appendChild(tocHeading);
            }

            tocLink.appendChild(linkSpan);
            li.appendChild(tocLink);

            // const br = document.createElement("br");
            // li.appendChild(br);

        } else {
            const tocHeading = document.createElement("span");
            // tocHeading.setAttribute("style", "padding-bottom: 1em;");
            tocHeading.setAttribute("class", "mdc-list-item__text__secondary");
            tocHeading.appendChild(document.createTextNode(tocLinkJson.title));
            li.appendChild(tocHeading);
        }

        ul.appendChild(li);

        if (tocLinkJson.children && tocLinkJson.children.length) {
            appendToc(tocLinkJson.children, li);
        }
    });

    anchor.appendChild(ul);
}

function navLeftOrRight(_right: boolean, _publicationJsonUrl: string, _publicationJson: any) {
    // TODO: publication spine + pagination state
}
