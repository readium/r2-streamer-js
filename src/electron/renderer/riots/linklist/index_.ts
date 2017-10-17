// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink } from "../../index";
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export interface IRiotOptsLinkListItem {
    href: string;
    title: string;
}
export interface IRiotOptsLinkList {
    basic: boolean;
    links: IRiotOptsLinkListItem[];
    url: string;
}

export const riotMountLinkList = (selector: string, opts: IRiotOptsLinkList) => {
    const tag = riot.mount(selector, opts);
    console.log(tag); // RiotTag[]
};

(window as any).riot_linklist = function(opts: IRiotOptsLinkList) {
    console.log(opts);
    console.log(this);

    const that = this as RiotTag;

    that.mixin(riot_mixin_EventTracer);

    this.links = opts.links;
    this.url = opts.url;
    this.basic = opts.basic ? true : false;

    this.onclick = (ev: RiotEvent) => {
        ev.preventUpdate = true;
        ev.preventDefault();
        console.log((ev.currentTarget as HTMLElement).getAttribute("data-href"));
        const href = (ev.currentTarget as HTMLElement).getAttribute("href");
        if (href) {
            handleLink(href);
        }
    };
};
