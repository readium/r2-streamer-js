import debounce = require("debounce");
import { R2_EVENT_READIUMCSS } from "../common/events";

// import * as debounce from "debounce";
// import { debounce } from "debounce";

export function startNavigatorExperiment(publicationJsonUrl: string) {

    document.body.style.backgroundColor = "silver";

    const h1 = document.querySelector("html > body > h1");
    if (h1) {
        (h1 as HTMLElement).style.color = "green";
    }

    // const readerChrome = document.getElementById("reader_chrome");
    const readerControls = document.getElementById("reader_controls");

    const showControlsButton = document.getElementById("showControlsButton");
    if (showControlsButton) {
        showControlsButton.style.display = "block";
        showControlsButton.addEventListener("click", (_event) => {
            if (readerControls) {
                readerControls.style.display = "block";
            }
            const hideControlsButt = document.getElementById("hideControlsButton");
            if (hideControlsButt) {
                hideControlsButt.style.display = "block ";
            }
        });
    }

    const webview1 = document.createElement("webview");
    webview1.setAttribute("id", "webview1");
    webview1.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview1.setAttribute("partition", "persist:publicationwebview");
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
        if (event.channel === R2_EVENT_READIUMCSS) {
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

    const hideControlsButton = document.getElementById("hideControlsButton");
    if (hideControlsButton) {
        hideControlsButton.addEventListener("click", (_event) => {
            if (readerControls) {
                readerControls.style.display = "none";
            }
            hideControlsButton.style.display = "none";
        });
    }

    const cssButton1 = document.getElementById("cssButtonInject");
    if (cssButton1) {
        cssButton1.addEventListener("click", (_event) => {
            const jsonMsg = { injectCSS: "yes", setCSS: "ok" };
            webview1.send(R2_EVENT_READIUMCSS, JSON.stringify(jsonMsg)); // .getWebContents()
        });
    }

    const cssButton2 = document.getElementById("cssButtonReset");
    if (cssButton2) {
        cssButton2.addEventListener("click", (_event) => {
            const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
            webview1.send(R2_EVENT_READIUMCSS, JSON.stringify(jsonMsg)); // .getWebContents()
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

        if (publicationJson.spine) {
            const readerControlsSpine = document.getElementById("reader_controls_SPINE");
            publicationJson.spine.forEach((spineItem: any) => {
                const spineItemLink = document.createElement("a");
                const spineItemLinkHref = publicationJsonUrl + "/../" + spineItem.href;
                spineItemLink.setAttribute("href", spineItemLinkHref);
                spineItemLink.addEventListener("click", (event) => {
                    event.preventDefault();

                    webview1.setAttribute("src", spineItemLinkHref);
                    // webview1.getWebContents().loadURL(spineItemLinkHref, { extraHeaders: "pragma: no-cache\n" });
                    // webview1.loadURL(spineItemLinkHref, { extraHeaders: "pragma: no-cache\n" });
                });
                spineItemLink.appendChild(document.createTextNode(spineItem.href));
                if (readerControlsSpine) {
                    readerControlsSpine.appendChild(spineItemLink);
                    readerControlsSpine.appendChild(document.createElement("br"));
                }
            });
        }

        if (publicationJson.toc && publicationJson.toc.length) {
            const readerControlsToc = document.getElementById("reader_controls_TOC");
            if (readerControlsToc) {
                appendToc(publicationJson.toc, readerControlsToc, publicationJsonUrl, webview1);
            }
        }
        if (publicationJson["page-list"] && publicationJson["page-list"].length) {
            const readerControlsPageList = document.getElementById("reader_controls_PAGELIST");
            if (readerControlsPageList) {
                appendToc(publicationJson["page-list"], readerControlsPageList, publicationJsonUrl, webview1);
            }
        }

        const readerControlsLandmarks = document.getElementById("reader_controls_LANDMARKS");
        if (readerControlsLandmarks) {
            if (publicationJson.landmarks && publicationJson.landmarks.length) {
                appendToc(publicationJson.landmarks, readerControlsLandmarks, publicationJsonUrl, webview1);
            }
            if (publicationJson.lot && publicationJson.lot.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.lot, readerControlsLandmarks, publicationJsonUrl, webview1);
            }
            if (publicationJson.loa && publicationJson.loa.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.loa, readerControlsLandmarks, publicationJsonUrl, webview1);
            }
            if (publicationJson.loi && publicationJson.loi.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.loi, readerControlsLandmarks, publicationJsonUrl, webview1);
            }
            if (publicationJson.lov && publicationJson.lov.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.lov, readerControlsLandmarks, publicationJsonUrl, webview1);
            }
        }
    })();
    //     const spineItemUrl = publicationJsonUrl + "/../" + publicationJson.spine[0].href;
    //     console.log(spineItemUrl);
    //     webview1.setAttribute("src", spineItemUrl);

    // const a = document.querySelector("html > body > a");
    // a.click();
}

function appendToc(json: any, anchor: HTMLElement, publicationJsonUrl: string, webview1: HTMLElement) {

    const ul = document.createElement("ul");
    json.forEach((tocLinkJson: any) => {
        const li = document.createElement("li");

        if (!tocLinkJson.title) {
            tocLinkJson.title = "xxx";
        }

        if (tocLinkJson.href) {
            const tocLink = document.createElement("a");
            const tocLinkHref = publicationJsonUrl + "/../" + tocLinkJson.href;
            tocLink.setAttribute("href", tocLinkHref);
            tocLink.addEventListener("click", (event) => {
                event.preventDefault();

                webview1.setAttribute("src", tocLinkHref);
                // webview1.getWebContents().loadURL(tocLinkHref, { extraHeaders: "pragma: no-cache\n" });
                // webview1.loadURL(tocLinkHref, { extraHeaders: "pragma: no-cache\n" });
            });
            tocLink.appendChild(document.createTextNode(tocLinkJson.title));
            li.appendChild(tocLink);

            const br = document.createElement("br");
            li.appendChild(br);

            const tocHeading = document.createElement("span");
            tocHeading.appendChild(document.createTextNode(tocLinkJson.href));
            li.appendChild(tocHeading);
        } else {
            const tocHeading = document.createElement("span");
            tocHeading.appendChild(document.createTextNode(tocLinkJson.title));
            li.appendChild(tocHeading);
        }

        ul.appendChild(li);

        if (tocLinkJson.children && tocLinkJson.children.length) {
            appendToc(tocLinkJson.children, li, publicationJsonUrl, webview1);
        }
    });

    anchor.appendChild(ul);
}
