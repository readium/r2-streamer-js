// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink } from "../../index";

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

// tslint:disable-next-line:space-before-function-paren
(window as any).riot_linklist = function (_opts: IRiotOptsLinkList) {

    const that = this as IRiotTagLinkList;

    // tslint:disable-next-line:space-before-function-paren
    that.setBasic = function (basic: boolean) {
        this.opts.basic = basic;
        this.update();
    };

    this.onclick = (ev: RiotEvent) => {
        ev.preventUpdate = true;
        ev.preventDefault();

        const href = (ev.currentTarget as HTMLElement).getAttribute("href");
        if (href) {
            handleLink(href, undefined, false);
        }
    };
};
