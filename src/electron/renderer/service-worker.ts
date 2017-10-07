/// <referencexx path='../../../node_modules/typescript/lib/lib.es2015.d.ts' />
/// <referencexx path='../../../node_modules/typescript/lib/lib.webworker.d.ts' />
/// <referencexx path='../../../node_modules/typescript/lib/lib.dom.d.ts' />
// tslint:disablexx:no-reference
// import { ServiceWorkerGlobalScope } from "../../../node_modules/typescript/lib/lib.webworker.d.ts";
// const { clients, addEventListener, skipWaiting, registration } = self as ServiceWorkerGlobalScope;
// (function (self: ServiceWorkerGlobalScope) {
//     //Service worker contents...
//  })(<ServiceWorkerGlobalScope>self);

console.log("SERVICE WORKER");

// self.addEventListener('message', function (event) {
//     if (event.data.action == 'skipWaiting') {
//         self.skipWaiting()
//     }
// });

self.addEventListener("install", async (_event) => {
    console.log("service-worker.js INSTALL");
    await (self as any).skipWaiting();
});

self.addEventListener("activate", (event: any) => {
    console.log("service-worker.js ACTIVE");
    event.waitUntil((self as any).clients.claim());
});

self.addEventListener("fetch", (event: any) => {
    console.log("service-worker.js FETCH");

    // console.log(event.request);
    console.log(event.request.url);
    event.request.headers.forEach((arg0: any, arg1: any) => {
        console.log(arg0 + " => " + arg1);
    });

    //   var mode = event.request.mode;
    //   if (mode === "navigate") {
    //     mode = "cors";
    //   }

    const req = event.request.clone();
    const fetchPromise = fetch(req);
    event.respondWith(fetchPromise);

    // if (event.request.url.indexOf("/pub/*-") >= 0
    //     || event.request.url.endsWith("manifest.json")
    //     || event.request.url.endsWith("/")) {
    //     const req = event.request.clone();
    //     const fetchPromise = fetch(req);
    //     event.respondWith(fetchPromise);
    // } else {
    //     console.log("re-fetching with LCP user pass ...");
    //     const newUrl = event.request.url.replace("/pub/",
    //         "/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==-*");
    //     const fetchPromise = fetch(newUrl);
    //     event.respondWith(fetchPromise);
    // }

    // // tslint:disable-next-line:no-floating-promises
    // (async () => {
    //     try {
    //         const response = await fetch(req);
    //         if (!response.ok) {
    //             console.log("BAD FETCH RESPONSE?!");
    //         }
    //         response.headers.forEach(function () { console.log(arguments[1] + " => " + arguments[0]); });

    //         var blob = await response.arrayBuffer
    //         ...
    //     } catch (e) {
    //         console.log(e);
    //     }
    // })();
});
