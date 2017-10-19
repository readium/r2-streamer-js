// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink } from "../../index";
// import {
//     RiotMixinWithRecursivePropertySetter,
//     riot_mixin_RecursivePropertySetter,
// } from "../riot_mixin_RecursivePropertySetter";
// import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

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

export interface IRiotTagLinkTree extends
    // IRiotOptsLinkTree,
    RiotTag { // RiotMixinWithRecursivePropertySetter
    setBasic: (basic: boolean) => void;
    // getBasic: () => boolean;
    // basic: boolean;
}

export const riotMountLinkTree = (selector: string, opts: IRiotOptsLinkTree): RiotTag[] => {
    const tag = riot.mount(selector, opts);
    // console.log(tag); // RiotTag[]
    return tag;
};

// tslint:disable-next-line:space-before-function-paren
(window as any).riot_linktree = function (_opts: IRiotOptsLinkTree) {
    // console.log(opts);
    // console.log(this);

    const that = this as IRiotTagLinkTree;

    // that.mixin(riot_mixin_RecursivePropertySetter);

    // that.links = opts.links;
    // that.url = opts.url;
    // this.basic = opts.basic ? true : false;

    // Object.defineProperty(this, "basic", { get: () => that.opts.basic });
    // that.setBasic = (basic: boolean) => {
    // tslint:disable-next-line:space-before-function-paren
    that.setBasic = function (basic: boolean) {
        // console.log("SET: " + basic);
        // if (that !== this) {
        //     console.log(that);
        //     console.log(this);
        // }
        this.opts.basic = basic;
        // this.basic = basic;
        this.update();
    };

    // // that.getBasic = (): boolean => {
    // that.getBasic = function (): boolean {
    //     // console.log("GET");
    //     // if (that !== this) {
    //     //     console.log(that);
    //     //     console.log(this);
    //     // }
    //     const val = this.opts.basic;
    //     // const val = this.basic;
    //     // console.log("GET: " + val);
    //     return val;
    // };

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
    //     console.log("shouldUpdate - linktree");
    //     console.log(data);
    //     console.log(nextOpts);
    //     // return data && typeof data.basic !== "undefined";
    //     return true;
    // };
};
