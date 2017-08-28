console.log("INDEX");

console.log(window.location);
console.log(document.baseURI);
console.log(document.URL);

window.onerror = function (err) {
    console.log("Error", err);
};

const getURLQueryParams = function () {
    var params = {};

    var query = window.location.search;
    if (query && query.length) {
        query = query.substring(1);
        var keyParams = query.split('&');
        for (var x = 0; x < keyParams.length; x++) {
            var keyVal = keyParams[x].split('=');
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        }
    }

    return params;
};

window.addEventListener('DOMContentLoaded', () => {

    const queryParams = getURLQueryParams();
    const publicationJsonUrl = queryParams["pub"];

    const webview1 = document.createElement("webview");
    webview1.addEventListener('dom-ready', () => {
        webview1.openDevTools();
    });
    webview1.setAttribute("id", "webview1");
    webview1.setAttribute("style", "width: 100%; height: 400px; box-sizing: border-box; border: 2px solid black");
    webview1.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
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

    webview2.addEventListener('dom-ready', () => {

        webview2.openDevTools();
        // const wc = webview2.getWebContents();

        setTimeout(function () {
            document.body.setAttribute("style", "background-color: silver; margin: 0; padding: 0;");

            const h1 = document.querySelector("html > body > h1");
            h1.setAttribute("style", "color: green;");

            (async () => {
                try {
                    const response = await fetch(publicationJsonUrl);
                    if (!response.ok) {
                        console.log("BAD RESPONSE?!");
                    }
                    response.headers.forEach(function () { console.log(arguments[1] + " => " + arguments[0]); });

                    var publicationJson = await response.json();
                    console.log(publicationJson);

                    publicationJson.spine.forEach((spineItem) => {
                        const spineItemLink = document.createElement("a");
                        const spineItemLinkHref = publicationJsonUrl + "/../" + spineItem.href;
                        spineItemLink.setAttribute("href", spineItemLinkHref);
                        spineItemLink.addEventListener("click", function (event) {
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
            })();
        }, 5000);
    });
    webview2.setAttribute("id", "webview2");
    webview2.setAttribute("style", "display: inline-flex; visibilityx: hidden; width: 100%; height: 50px; box-sizing: border-box; border: 2px solid magenta");
    webview2.setAttribute("webpreferences",
        "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    webview2.setAttribute("preload", "./preload.js");
    document.body.appendChild(webview2);

    // const swBootUrl = publicationJsonUrl + "/show/metadata";
    // const swBootUrl = publicationJsonUrl;
    const swBootUrl = publicationJsonUrl + "/../";
    console.log(swBootUrl);
    webview2StageTwo = false;
    webview2.setAttribute("src", swBootUrl);
});
