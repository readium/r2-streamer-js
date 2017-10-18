// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink } from "../../index";
// import {
//     RiotMixinWithRecursivePropertySetter,
//     riot_mixin_RecursivePropertySetter,
// } from "../riot_mixin_RecursivePropertySetter";
// import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export interface IRiotOptsLinkListItem {
    href: string;
    title: string;
}
export interface IRiotOptsLinkList {
    basic: boolean;
    fixBasic?: boolean;
    links: IRiotOptsLinkListItem[];
    url: string;
}

export interface IRiotTagLinkList extends
    // IRiotOptsLinkList,
    RiotTag { // RiotMixinWithRecursivePropertySetter
    setBasic: (basic: boolean) => void;
}

export const riotMountLinkList = (selector: string, opts: IRiotOptsLinkList): RiotTag[] => {
    const tag = riot.mount(selector, opts);
    // console.log(tag); // RiotTag[]
    return tag;
};

(window as any).riot_linklist = function(_opts: IRiotOptsLinkList) {
    // console.log(opts);
    // console.log(this);

    const that = this as IRiotTagLinkList;

    // that.mixin(riot_mixin_RecursivePropertySetter);

    // that.links = opts.links;
    // that.url = opts.url;
    // that.basic = opts.basic ? true : false;

    that.setBasic = (basic: boolean) => {
        that.opts.basic = basic;
        // that.basic = basic;
        // this.setPropertyRecursively("basic", basic, "riot-xxx");
    };

    this.onclick = (ev: RiotEvent) => {
        ev.preventUpdate = true;
        ev.preventDefault();
        // console.log((ev.currentTarget as HTMLElement).getAttribute("data-href"));
        const href = (ev.currentTarget as HTMLElement).getAttribute("href");
        if (href) {
            handleLink(href);
        }
    };

    // that.shouldUpdate = (data: any, nextOpts: any) => {
    //     console.log("shouldUpdate - linklist");
    //     console.log(data);
    //     console.log(nextOpts);
    //     // return data && typeof data.basic !== "undefined";
    //     return true;
    // };
};
