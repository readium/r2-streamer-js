
console.log("SERVICE WORKER");

// self.addEventListener('message', function (event) {
//     if (event.data.action == 'skipWaiting') {
//         self.skipWaiting()
//     }
// });

self.addEventListener('install', function (event) {
    console.log("service-worker.js INSTALL");
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log("service-worker.js ACTIVE");
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function (event) {
    console.log("service-worker.js FETCH");

    // console.log(event.request);
    console.log(event.request.url);
    event.request.headers.forEach(function () { console.log(arguments[1] + " => " + arguments[0]); });

    //   var mode = event.request.mode;
    //   if (mode === "navigate") {
    //     mode = "cors";
    //   }

    if (event.request.url.indexOf("/pub/*-") >= 0) {
        console.log("LCP PASS ALREADY SET??");
        const req = event.request.clone();
        var fetchPromise = fetch(req);
        event.respondWith(fetchPromise);
    } else {
        const newUrl = event.request.url.replace("/pub/", "/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==-*");
        var fetchPromise = fetch(newUrl);
        event.respondWith(fetchPromise);
    }

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
