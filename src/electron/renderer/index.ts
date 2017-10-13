import { ipcRenderer } from "electron";
import { R2_EVENT_DEVTOOLS, R2_EVENT_LINK, R2_EVENT_TRY_LCP_PASS, R2_EVENT_TRY_LCP_PASS_RES } from "../common/events";
import { handleLink, startNavigatorExperiment } from "./index_navigator";
import { getURLQueryParams } from "./querystring";

// import { startServiceWorkerExperiment } from "./sw/index_service-worker";

console.log("INDEX");

console.log(window.location);
console.log(document.baseURI);
console.log(document.URL);

const queryParams = getURLQueryParams();

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];

console.log(" (((( publicationJsonUrl )))) " + publicationJsonUrl);

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

    const lcpPassInput = document.getElementById("lcpPassInput");
    const lcpPassForm = document.getElementById("lcpPassForm");
    if (!lcpPassInput || !lcpPassForm) {
        return;
    }

    (lcpPassInput as HTMLInputElement).value = message;

    if (okay) {
        setTimeout(() => {
            lcpPassForm.style.display = "none";
        }, 1000);
    }
});

window.addEventListener("DOMContentLoaded", () => {

    const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    console.log(pathBase64);
    const pathDecoded = window.atob(pathBase64);
    console.log(pathDecoded);
    const pathFileName = pathDecoded.substr(
        pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
        pathDecoded.length - 1);

    window.document.title = "Readium2 [ " + pathFileName + "]";

    const h1 = document.querySelector("html > body > h1 > span");
    if (h1) {
        (h1 as HTMLElement).textContent = pathFileName;
    }

    if (lcpHint) {
        const lcpPassForm = document.getElementById("lcpPassForm");
        const lcpPassInput = document.getElementById("lcpPassInput");
        if (lcpPassInput && lcpPassForm) {

            (lcpPassInput as HTMLInputElement).value = lcpHint;
            lcpPassForm.style.display = "inline-block";
            // lcpPassForm.onsubmit
            lcpPassForm.addEventListener("submit", (evt) => {
                if (evt) {
                    evt.preventDefault();
                }
                const lcpPass = (lcpPassInput as HTMLInputElement).value;
                ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPass);
                return false;
            });
        }
    }

    const buttStart = document.getElementById("buttonStart");
    if (buttStart) {
        buttStart.addEventListener("click", () => {
            buttStart.setAttribute("disabled", "");
            buttStart.style.display = "none";
            // startServiceWorkerExperiment(publicationJsonUrl);
            startNavigatorExperiment(publicationJsonUrl);
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

    const buttonDevTools = document.getElementById("buttonDevTools");
    if (buttonDevTools) {
        buttonDevTools.addEventListener("click", () => {
            ipcRenderer.send(R2_EVENT_DEVTOOLS, "test");
        });
    }
});
