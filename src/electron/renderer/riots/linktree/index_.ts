// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink } from "../../index";
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export interface IRiotOptsLinkTreeItem {
    children: IRiotOptsLinkTreeItem[];
    href: string;
    title: string;
}
export interface IRiotOptsLinkTree {
    basic: boolean;
    links: IRiotOptsLinkTreeItem[];
    url: string;
}

export const riotMountLinkTree = (selector: string, opts: IRiotOptsLinkTree) => {
    const tag = riot.mount(selector, opts);
    console.log(tag); // RiotTag[]
};

(window as any).riot_linktree = function(opts: IRiotOptsLinkTree) {
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
