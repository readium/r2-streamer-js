import debounce = require("debounce");
// import * as debounce from "debounce";
// import { debounce } from "debounce";

export function startNavigatorExperiment(publicationJsonUrl: string) {

    document.body.style.backgroundColor = "silver";

    const h1 = document.querySelector("html > body > h1");
    if (h1) {
        (h1 as HTMLElement).style.color = "green";
    }

    const readerChrome = document.getElementById("reader_chrome");
    const readerControls = document.getElementById("reader_controls");

    const showControlsButton = document.createElement("button");
    showControlsButton.setAttribute("id", "showControlsButton");
    // showControlsButton.setAttribute("style", "position:absolute;top:0;left:0");
    showControlsButton.addEventListener("click", (_event) => {
        if (readerControls) {
            readerControls.style.display = "block";
        }
    });
    showControlsButton.appendChild(document.createTextNode("O"));
    if (readerChrome) {
        readerChrome.appendChild(showControlsButton);
    }

    const webview1 = document.createElement("webview");
    webview1.setAttribute("id", "webview1");
    webview1.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview1.setAttribute("partition", "persist:publication");
    webview1.setAttribute("httpreferrer", publicationJsonUrl);
    webview1.setAttribute("preload", "./preload.js");
    // webview.setAttribute("src", "dummy");
    // webview1.style.visibility = "hidden";
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
    }, 200));
    webview1.addEventListener("ipc-message", (event) => {
        console.log("webview1 ipc-message");
        console.log(event.channel);
        if (event.channel === "readium") {
            console.log(event.args);
        }
    });
    webview1.addEventListener("dom-ready", () => {
        // webview1.openDevTools();

        const cssButtonN1 = document.getElementById("cssButtonInject");
        if (!cssButtonN1) {
            return;
        }
        cssButtonN1.removeAttribute("disabled");

        const cssButtonN2 = document.getElementById("cssButtonReset");
        if (!cssButtonN2) {
            return;
        }
        cssButtonN2.removeAttribute("disabled");

        // webview1.style.visibility = "visible";
    });
    const publicationViewport = document.getElementById("publication_viewport");
    if (publicationViewport) {
        publicationViewport.appendChild(webview1);
    }

    const hideControlsButton = document.createElement("button");
    hideControlsButton.setAttribute("id", "hideControlsButton");
    hideControlsButton.addEventListener("click", (_event) => {
        if (readerControls) {
            readerControls.style.display = "none";
        }
    });
    hideControlsButton.appendChild(document.createTextNode("X"));
    if (readerControls) {
        readerControls.appendChild(hideControlsButton);
        readerControls.appendChild(document.createElement("hr"));
    }

    const cssButton1 = document.createElement("button");
    cssButton1.setAttribute("id", "cssButtonInject");
    cssButton1.addEventListener("click", (_event) => {
        const jsonMsg = { injectCSS: "yes", setCSS: "ok" };
        webview1.send("readium", JSON.stringify(jsonMsg)); // .getWebContents()
    });
    cssButton1.appendChild(document.createTextNode("CSS inject"));
    cssButton1.setAttribute("disabled", "");
    if (readerControls) {
        readerControls.appendChild(cssButton1);
    }

    const cssButton2 = document.createElement("button");
    cssButton2.setAttribute("id", "cssButtonReset");
    cssButton2.addEventListener("click", (_event) => {
        const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
        webview1.send("readium", JSON.stringify(jsonMsg)); // .getWebContents()
    });
    cssButton2.appendChild(document.createTextNode("CSS remove"));
    cssButton2.setAttribute("disabled", "");
    if (readerControls) {
        readerControls.appendChild(cssButton2);
        readerControls.appendChild(document.createElement("hr"));
    }

    // tslint:disable-next-line:no-floating-promises
    (async () => {

        try {
            // hacky :) (just for testing);
            // (initializes the LCP pass)
            await fetch(publicationJsonUrl.replace("/pub/",
                "/pub/*-" +
                "ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg" +
                "==-*"));
        } catch (e) {
            console.log(e);
        }

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

        publicationJson.spine.forEach((spineItem: any) => {
            const spineItemLink = document.createElement("a");
            const spineItemLinkHref = publicationJsonUrl + "/../" + spineItem.href;
            spineItemLink.setAttribute("href", spineItemLinkHref);
            spineItemLink.addEventListener("click", (event) => {
                webview1.setAttribute("src", spineItemLinkHref);
                event.preventDefault();
            });
            spineItemLink.appendChild(document.createTextNode(spineItem.href));
            if (readerControls) {
                readerControls.appendChild(spineItemLink);
                readerControls.appendChild(document.createElement("br"));
            }
        });
    })();
    //     const spineItemUrl = publicationJsonUrl + "/../" + publicationJson.spine[0].href;
    //     console.log(spineItemUrl);
    //     webview1.setAttribute("src", spineItemUrl);

    // const a = document.querySelector("html > body > a");
    // a.click();
}
