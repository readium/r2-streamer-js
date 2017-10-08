import { getURLQueryParams } from "./querystring";

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

    const buttStart = document.getElementById("buttonStart");
    if (!buttStart) {
        return;
    }
    buttStart.addEventListener("click", () => {
        buttStart.setAttribute("disabled", "");
        startServiceWorkerExperiment();
    });
});

function startServiceWorkerExperiment() {

    const webview1 = document.createElement("webview");
    webview1.addEventListener("dom-ready", () => {
        webview1.openDevTools();
    });
    webview1.setAttribute("id", "webview1");
    webview1.setAttribute("style",
        "width: 100%; height: 400px;" +
        "box-sizing: border-box; border: 2px solid black");
    webview1.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    // webview1.setAttribute("preload", "./preload.js");
    // webview.setAttribute("src", "dummy");
    document.body.appendChild(webview1);

    const webview2 = document.createElement("webview");
    // webview2.addEventListener('did-start-loading', () => {
    // });
    // webview2.addEventListener('did-stop-loading', () => {
    // });
    // webview2.addEventListener('did-finish-load', () => {
    // });

    webview2.addEventListener("dom-ready", () => {

        webview2.openDevTools();
        // const wc = webview2.getWebContents();

        setTimeout(async () => {
            document.body.setAttribute("style", "background-color: silver; margin: 0; padding: 0;");

            const h1 = document.querySelector("html > body > h1");
            if (!h1) {
                return;
            }
            h1.setAttribute("style", "color: green;");

            try {

                // hacky :) (just for testing);
                // (initializes the LCP pass)
                await fetch(publicationJsonUrl.replace("/pub/",
                    "/pub/*-" +
                    "ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg" +
                    "==-*"));

                const response = await fetch(publicationJsonUrl);
                if (!response.ok) {
                    console.log("BAD RESPONSE?!");
                }
                response.headers.forEach((arg0: any, arg1: any) => {
                    console.log(arg0 + " => " + arg1);
                });

                const publicationJson = await response.json();
                console.log(publicationJson);

                publicationJson.spine.forEach((spineItem: any) => {
                    const spineItemLink = document.createElement("a");
                    const spineItemLinkHref = publicationJsonUrl + "/../" + spineItem.href;
                    spineItemLink.setAttribute("href", spineItemLinkHref);
                    spineItemLink.addEventListener("click", (event) => {
                        webview1.setAttribute("src", spineItemLinkHref);
                        event.preventDefault();
                    });
                    spineItemLink.appendChild(document.createTextNode(spineItem.href));
                    document.body.appendChild(spineItemLink);
                    document.body.appendChild(document.createElement("br"));
                });

                //     const spineItemUrl = publicationJsonUrl + "/../" + publicationJson.spine[0].href;
                //     console.log(spineItemUrl);
                //     webview1.setAttribute("src", spineItemUrl);

                // const a = document.querySelector("html > body > a");
                // a.click();
            } catch (e) {
                console.log(e);
            }
        }, 5000);
    });
    webview2.setAttribute("id", "webview2");
    webview2.setAttribute("style",
        "display: inline-flex; visibilityx: hidden; width: 100%; height: 50px; " +
        "box-sizing: border-box; border: 2px solid magenta");
    webview2.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview2.setAttribute("preload", "./preload_service-worker.js");
    document.body.appendChild(webview2);

    // const swBootUrl = publicationJsonUrl + "/show/metadata";
    // const swBootUrl = publicationJsonUrl;
    const swBootUrl = publicationJsonUrl + "/../";
    console.log(swBootUrl);

    webview2.setAttribute("src", swBootUrl);
}
