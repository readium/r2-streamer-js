export interface IPropertyAnimationState {
    animating: boolean;
    duration: number;
    destVal: number;
    originVal: number;
    object: any;
    property: string;
    deltaVal: number;
    startTime: number;
    id: number;
    lastVal: number;
    nowTime: number;
}

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

    const state: IPropertyAnimationState = {
        animating: false, // changes
        deltaVal: destVal - object[property], // fixed
        destVal, // fixed
        duration, // fixed
        id: 0, // changes
        lastVal: 0, // changes
        nowTime: 0, // changes
        object, // fixed
        originVal: object[property], // fixed
        property, // fixed
        startTime: Date.now(), // fixed
    };

    const animate = () => {
        state.animating = true;
        state.nowTime = Date.now(); // +new Date()
        const newVal = Math.floor(
            transition(state.nowTime - state.startTime, state.originVal, state.deltaVal, state.duration));

        if (!state.lastVal || state.object[state.property] !== state.destVal) {
            state.object[state.property] = newVal;
            state.lastVal = newVal;
        } else { // lastVal && object[property] === destVal
            state.animating = false;
            state.object = {}; // to avoid memory leaks / DOM pointer retention
            if (callback) {
                callback(true);
            }
            cAF(state.id);
            return;
        }

        if (state.nowTime > (state.startTime + state.duration)) {
            state.animating = false;
            state.object[state.property] = state.destVal;
            state.object = {}; // to avoid memory leaks / DOM pointer retention
            if (callback) {
                callback(false);
            }
            cAF(state.id);
            return;
        }

        state.id = rAF(animate);
    };

    state.id = rAF(animate);

    return state;
};
