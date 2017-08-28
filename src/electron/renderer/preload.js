console.log("PRELOAD");

// console.log(process.env);

// console.log(global);
// console.log(global.window);
// console.log(global.navigator);

// console.log(global.window.location);

console.log(global.navigator.serviceWorker.controller);

const pathItems = global.window.location.pathname.split("/");
const scope = "/pub/" + pathItems[2] + "/";
// console.log(scope);

global.navigator.serviceWorker.register(global.window.location.origin + '/sw.js', {
    scope: scope
}).then(function (swReg) {
    console.log("service-worker.js REG");
    console.log(swReg);
    console.log(swReg.installing);
    console.log(swReg.waiting);
    console.log(swReg.active);

}).catch(function (err) {
    console.log("service-worker.js ERROR");
    console.log(err);
});

global.navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log("controllerchange");
    // global.window.location.reload();
});

