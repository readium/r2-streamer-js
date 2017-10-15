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

ipcRenderer.on(R2_EVENT_TRY_LCP_PASS_RES, (_event: any, okay: boolean, message: string) => {
    console.log("R2_EVENT_TRY_LCP_PASS_RES");
    console.log(okay);
    console.log(message);

    if (!okay) {
        showLcpDialog(message);
        return;
    }

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
    }, 200);
}

window.addEventListener("DOMContentLoaded", () => {

    // material-components-web
    (window as any).mdc.autoInit();

    // const tag = riot.mount("*");
    // riotMountMyTag({ opt1: "val1" });

    window.document.title = "Readium2 [ " + pathFileName + "]";

    // const h1 = document.querySelector("html > body > h1 > span");
    // if (h1) {
    //     (h1 as HTMLElement).textContent = pathFileName;
    // }

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

    // const buttonDevTools = document.getElementById("buttonDevTools");
    // if (buttonDevTools) {
    //     buttonDevTools.addEventListener("click", () => {
    //         ipcRenderer.send(R2_EVENT_DEVTOOLS, "test");
    //     });
    // }
});
