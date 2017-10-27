export const animateProperty = (
    cAF: (id: number) => void, // typically: window.cancelAnimationFrame
    callback: ((cancelled: boolean) => void) | undefined,
    property: string, // numerical, e.g. "scrollTop" or "scrollLeft"
    duration: number, // e.g. 200
    object: any, // typically, window.document.body (Element)
    destVal: number, // e.g. 0
    rAF: (func: () => void) => number, // typically: window.requestAnimationFrame
    transition: (t: number, b: number, c: number, d: number) => number, // e.g. easings.easeInQuad
) => {
    const originVal: number = object[property];
    const deltaVal = destVal - originVal;

    const startTime = Date.now(); // +new Date()

    let id = 0;
    let lastVal = 0;

    const animate = () => {
        const nowTime = Date.now(); // +new Date()
        const newVal = Math.floor(transition(nowTime - startTime, originVal, deltaVal, duration));

        if (!lastVal || object[property] !== destVal) {
            object[property] = newVal;
            lastVal = newVal;
        } else { // lastVal && object[property] === destVal

            if (callback) {
                callback(true);
            }
            cAF(id);
            return;
        }

        if (nowTime > (startTime + duration)) {
            object[property] = destVal;

            if (callback) {
                callback(false);
            }
            cAF(id);
            return;
        }

        id = rAF(animate);
    };

    id = rAF(animate);
};
