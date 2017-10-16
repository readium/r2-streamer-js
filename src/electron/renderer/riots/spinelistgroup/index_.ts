// http://riotjs.com/guide/
// http://riotjs.com/api/
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export const riotMountSpineListGroup = (selector: string, opts: any) => {
    const tag = riot.mount(selector, opts);
    console.log(tag); // RiotTag[]
};

(window as any).riot_spinelistgroup = function(opts: any) {
    console.log(opts);
    console.log(this);

    const that = this as RiotTag;

    that.mixin(riot_mixin_EventTracer);

    this.spinegroup = opts.spinegroup;
    this.url = opts.url;
};
