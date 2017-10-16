import { ipcRenderer } from "electron";
import { R2_EVENT_LINK, R2_EVENT_TRY_LCP_PASS, R2_EVENT_TRY_LCP_PASS_RES } from "../common/events";
import { handleLink, startNavigatorExperiment } from "./index_navigator";
import { getURLQueryParams } from "./querystring";

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

window.onerror = (err) => {
    console.log("Error", err);
};

ipcRenderer.on(R2_EVENT_LINK, (_event: any, href: string) => {
    console.log("R2_EVENT_LINK");
    console.log(href);
    handleLink(href, publicationJsonUrl);
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
    startNavigatorExperiment(publicationJsonUrl);

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

let snackBar: any;

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
    const drawer = new (window as any).mdc.drawer.MDCTemporaryDrawer(drawerElement);
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
        startNavigatorExperiment(publicationJsonUrl);
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
