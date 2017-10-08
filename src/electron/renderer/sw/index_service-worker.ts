import debounce = require("debounce");
// import * as debounce from "debounce";
// import { debounce } from "debounce";

export function startServiceWorkerExperiment(publicationJsonUrl: string) {

    const webview1 = document.createElement("webview");
    webview1.addEventListener("ipc-message", (event) => {
        console.log("webview1 ipc-message");
        console.log(event.channel);
        if (event.channel === "readium") {
            console.log(event.args);
        }
    });
    webview1.addEventListener("dom-ready", () => {
        webview1.openDevTools();

        const cssButton1 = document.getElementById("cssButtonInject");
        if (!cssButton1) {
            return;
        }
        cssButton1.removeAttribute("disabled");

        const cssButton2 = document.getElementById("cssButtonReset");
        if (!cssButton2) {
            return;
        }
        cssButton2.removeAttribute("disabled");
    });
    webview1.setAttribute("id", "webview1");
    webview1.setAttribute("style",
        "display:inline-flex; visibilityx: hidden; width: 100%; height: 400px; margin: 0; padding: 0;");
    webview1.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview1.setAttribute("partition", "persist:publication");
    webview1.setAttribute("httpreferrer", publicationJsonUrl);
    webview1.setAttribute("preload", "./preload.js");
    // webview.setAttribute("src", "dummy");

    webview1.setAttribute("disableguestresize", "");
    window.addEventListener("resize", debounce(() => {

        // webview.offsetWidth == full including borders
        // webview.scrollWidth == webview.clientWidth == without borders

        // const computedStyle = window.getComputedStyle(webview1);
        // console.log(parseInt(computedStyle.width as string, 10));
        // console.log(parseInt(computedStyle.height as string, 10));

        const width = webview1.clientWidth;
        const height = webview1.clientHeight;

        const wc = webview1.getWebContents();
        if (wc && width && height) {
            wc.setSize({
                normal: {
                    height,
                    width,
                },
            });
        }
    }, 500));

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

                const cssButton1 = document.createElement("button");
                cssButton1.setAttribute("id", "cssButtonInject");
                cssButton1.addEventListener("click", (_event) => {
                    const jsonMsg = { injectCSS: "yes", setCSS: "ok" };
                    webview1.send("readium", JSON.stringify(jsonMsg)); // .getWebContents()
                });
                cssButton1.appendChild(document.createTextNode("CSS inject"));
                cssButton1.setAttribute("disabled", "");
                document.body.appendChild(cssButton1);

                const cssButton2 = document.createElement("button");
                cssButton2.setAttribute("id", "cssButtonReset");
                cssButton2.addEventListener("click", (_event) => {
                    const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
                    webview1.send("readium", JSON.stringify(jsonMsg)); // .getWebContents()
                });
                cssButton2.appendChild(document.createTextNode("CSS remove"));
                cssButton2.setAttribute("disabled", "");
                document.body.appendChild(cssButton2);

                document.body.appendChild(document.createElement("hr"));

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
        }, 2000);
    });
    webview2.setAttribute("id", "webview2");
    webview2.setAttribute("style",
        "display: inline-flex; visibilityx: hidden; width: 100%; height: 50px; " +
        "box-sizing: border-box; border: 2px solid magenta");
    webview2.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview2.setAttribute("preload", "./sw/preload_service-worker.js");
    document.body.appendChild(webview2);

    // const swBootUrl = publicationJsonUrl + "/show/metadata";
    // const swBootUrl = publicationJsonUrl;
    const swBootUrl = publicationJsonUrl + "/../";
    console.log(swBootUrl);

    webview2.setAttribute("src", swBootUrl);
}
