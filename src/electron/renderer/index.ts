import { ipcRenderer } from "electron";
import { startNavigatorExperiment } from "./index_navigator";
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

ipcRenderer.on("tryLcpPass", (_event: any, okay: boolean, message: string) => {
    console.log(okay);
    console.log(message);

    const lcpPassInput = document.getElementById("lcpPassInput");
    if (!lcpPassInput) {
        return;
    }

    (lcpPassInput as HTMLInputElement).value = message;

    if (okay) {
        setTimeout(() => {
            const lcpPassForm = document.getElementById("lcpPassForm");
            if (!lcpPassForm) {
                return;
            }
            lcpPassForm.style.display = "none";
        }, 1000);
    }
});

window.addEventListener("DOMContentLoaded", () => {

    const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    console.log(pathBase64);
    const pathDecoded = window.atob(pathBase64);
    console.log(pathDecoded);
    const pathFileName = pathDecoded.substr(pathDecoded.lastIndexOf("/") + 1, pathDecoded.length - 1);

    const h1 = document.querySelector("html > body > h1 > span");
    if (h1) {
        (h1 as HTMLElement).textContent = pathFileName;
    }

    const lcpPassForm = document.getElementById("lcpPassForm");
    if (!lcpPassForm) {
        return;
    }
    const lcpPassInput = document.getElementById("lcpPassInput");
    if (!lcpPassInput) {
        return;
    }
    if (lcpHint) {
        (lcpPassInput as HTMLInputElement).value = lcpHint;
        lcpPassForm.style.display = "inline-block";
        // lcpPassForm.onsubmit
        lcpPassForm.addEventListener("submit", (evt) => {
            if (evt) {
                evt.preventDefault();
            }
            const lcpPass = (lcpPassInput as HTMLInputElement).value;
            ipcRenderer.send("tryLcpPass", pathDecoded, lcpPass);
            return false;
        });
    }

    const buttStart = document.getElementById("buttonStart");
    if (!buttStart) {
        return;
    }
    buttStart.addEventListener("click", () => {
        buttStart.setAttribute("disabled", "");
        buttStart.style.display = "none";
        // startServiceWorkerExperiment(publicationJsonUrl);
        startNavigatorExperiment(publicationJsonUrl);
    });

    const buttonDebug = document.getElementById("buttonDebug");
    if (!buttonDebug) {
        return;
    }
    buttonDebug.addEventListener("click", () => {
        if (document.documentElement.classList.contains("debug")) {
            document.documentElement.classList.remove("debug");
        } else {
            document.documentElement.classList.add("debug");
        }
    });

    const buttonDevTools = document.getElementById("buttonDevTools");
    if (!buttonDevTools) {
        return;
    }
    buttonDevTools.addEventListener("click", () => {
        ipcRenderer.send("devtools", "test");
    });
});
