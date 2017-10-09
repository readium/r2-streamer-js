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

window.onerror = (err) => {
    console.log("Error", err);
};

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

    const buttStart = document.getElementById("buttonStart");
    if (!buttStart) {
        return;
    }
    buttStart.addEventListener("click", () => {
        buttStart.setAttribute("disabled", "");
        // startServiceWorkerExperiment(publicationJsonUrl);
        startNavigatorExperiment(publicationJsonUrl);
    });
});
