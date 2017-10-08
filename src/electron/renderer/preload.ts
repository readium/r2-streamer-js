console.log("PRELOAD SERVICE WORKER");

// console.log(process.env);

// console.log(global);
// console.log(global.window);
// console.log(global.navigator);

// console.log(global.window.location);

console.log(((global as any).navigator as Navigator).serviceWorker.controller);

const pathItems = ((global as any).window as Window).location.pathname.split("/");
const scope = "/pub/" + pathItems[2] + "/";
console.log(scope);

// routed by HTTP server to ./service-worker.js
const swURL = ((global as any).window as Window).location.origin + "/sw.js";
console.log(swURL);

((global as any).navigator as Navigator).serviceWorker.register(
    swURL, {
    scope,
}).then((swReg) => {
    console.log("service-worker.js REG");
    console.log(swReg);
    console.log(swReg.installing);
    console.log(swReg.waiting);
    console.log(swReg.active);

}).catch((err) => {
    console.log("service-worker.js ERROR");
    console.log(err);
});

((global as any).navigator as Navigator).serviceWorker.addEventListener("controllerchange", () => {
    console.log("controllerchange");
    // ((global as any).window as Window).location.reload();
});
