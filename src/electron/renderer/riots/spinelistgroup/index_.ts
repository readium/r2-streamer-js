// http://riotjs.com/guide/
// http://riotjs.com/api/
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export const riotMountLinkListGroup = (selector: string, opts: any) => {
    const tag = riot.mount(selector, opts);
    console.log(tag); // RiotTag[]
};

(window as any).riot_linklistgroup = function(opts: any) {
    console.log(opts);
    console.log(this);

    const that = this as RiotTag;

    that.mixin(riot_mixin_EventTracer);

    this.linksgroup = opts.linksgroup;
    this.url = opts.url;
    this.basic = opts.basic ? true : false;
};
