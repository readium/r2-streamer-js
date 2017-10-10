import debounce = require("debounce");
import { R2_EVENT_READIUMCSS } from "../common/events";
import { R2_SESSION_WEBVIEW } from "../common/sessions";

const _webviews: Electron.WebviewTag[] = [];

function createWebView(publicationJsonUrl: string) {
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
        if (event.channel === R2_EVENT_READIUMCSS) {
            console.log(event.args);
        }
    });

    webview1.addEventListener("dom-ready", () => {
        // webview1.openDevTools();

        const cssButtonN1 = document.getElementById("cssButtonInject");
        if (cssButtonN1) {
            cssButtonN1.removeAttribute("disabled");
        }

        const cssButtonN2 = document.getElementById("cssButtonReset");
        if (cssButtonN2) {
            cssButtonN2.removeAttribute("disabled");
        }

        // webview1.style.visibility = "visible";
    });

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
    const webviewFull = createWebView(publicationJsonUrl);
    _webviews.push(webviewFull);

    const publicationViewport = document.getElementById("publication_viewport");
    if (publicationViewport) {
        publicationViewport.appendChild(webviewFull);
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

        if (publicationJson.spine) {
            const readerControlsSpine = document.getElementById("reader_controls_SPINE");
            let firstLinear: any | undefined;
            publicationJson.spine.forEach((spineItem: any) => {
                // in Readium2, spine items are always linear (otherwise just "resource" collection)
                if (!firstLinear) { // && (!spineItem.linear || spineItem.linear === "yes")) {
                    firstLinear = spineItem;
                }
                const spineItemLink = document.createElement("a");
                const spineItemLinkHref = publicationJsonUrl + "/../" + spineItem.href;
                spineItemLink.setAttribute("href", spineItemLinkHref);
                spineItemLink.setAttribute("data-href", spineItem.href);
                spineItemLink.addEventListener("click", (event) => {
                    event.preventDefault();
                    loadLink(spineItemLinkHref, spineItem.href, publicationJsonUrl);
                });
                spineItemLink.appendChild(document.createTextNode(spineItem.href));
                if (readerControlsSpine) {
                    readerControlsSpine.appendChild(spineItemLink);
                    readerControlsSpine.appendChild(document.createElement("br"));
                }
            });
            if (firstLinear) {
                setTimeout(() => {
                    const firstLinearLinkHref = publicationJsonUrl + "/../" + firstLinear.href;
                    loadLink(firstLinearLinkHref, firstLinear.href, publicationJsonUrl);
                }, 200);
            }
        }

        if (publicationJson.toc && publicationJson.toc.length) {
            const readerControlsToc = document.getElementById("reader_controls_TOC");
            if (readerControlsToc) {
                appendToc(publicationJson.toc, readerControlsToc, publicationJsonUrl);
            }
        }
        if (publicationJson["page-list"] && publicationJson["page-list"].length) {
            const readerControlsPageList = document.getElementById("reader_controls_PAGELIST");
            if (readerControlsPageList) {
                appendToc(publicationJson["page-list"], readerControlsPageList, publicationJsonUrl);
            }
        }

        const readerControlsLandmarks = document.getElementById("reader_controls_LANDMARKS");
        if (readerControlsLandmarks) {
            if (publicationJson.landmarks && publicationJson.landmarks.length) {
                appendToc(publicationJson.landmarks, readerControlsLandmarks, publicationJsonUrl);
            }
            if (publicationJson.lot && publicationJson.lot.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.lot, readerControlsLandmarks, publicationJsonUrl);
            }
            if (publicationJson.loa && publicationJson.loa.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.loa, readerControlsLandmarks, publicationJsonUrl);
            }
            if (publicationJson.loi && publicationJson.loi.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.loi, readerControlsLandmarks, publicationJsonUrl);
            }
            if (publicationJson.lov && publicationJson.lov.length) {
                readerControlsLandmarks.appendChild(document.createElement("hr"));
                appendToc(publicationJson.lov, readerControlsLandmarks, publicationJsonUrl);
            }
        }
    })();
    //     const spineItemUrl = publicationJsonUrl + "/../" + publicationJson.spine[0].href;
    //     console.log(spineItemUrl);
    //     webview1.setAttribute("src", spineItemUrl);

    // const a = document.querySelector("html > body > a");
    // a.click();
}

function appendToc(json: any, anchor: HTMLElement, publicationJsonUrl: string) {

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
            tocLink.setAttribute("data-href", tocLinkJson.href);
            tocLink.addEventListener("click", (event) => {
                event.preventDefault();
                loadLink(tocLinkHref, tocLinkJson.href, publicationJsonUrl);
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
            appendToc(tocLinkJson.children, li, publicationJsonUrl);
        }
    });

    anchor.appendChild(ul);
}
