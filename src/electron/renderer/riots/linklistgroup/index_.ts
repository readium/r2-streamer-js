// http://riotjs.com/guide/
// http://riotjs.com/api/
import { IRiotOptsLinkListItem } from "../linklist/index_";
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export interface IRiotOptsLinkListGroupItem {
    label: string;
    links: IRiotOptsLinkListItem[];
    url: string;
}
export interface IRiotOptsLinkListGroup {
    basic: boolean;
    linksgroup: IRiotOptsLinkListGroupItem[];
    url: string;
}

export const riotMountLinkListGroup = (selector: string, opts: IRiotOptsLinkListGroup) => {
    const tag = riot.mount(selector, opts);
    console.log(tag); // RiotTag[]
};

(window as any).riot_linklistgroup = function(opts: IRiotOptsLinkListGroup) {
    console.log(opts);
    console.log(this);

    const that = this as RiotTag;

    that.mixin(riot_mixin_EventTracer);

    this.linksgroup = opts.linksgroup;
    this.url = opts.url;
    this.basic = opts.basic ? true : false;
};
