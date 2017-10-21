// http://riotjs.com/guide/
// http://riotjs.com/api/
import { IRiotOptsLinkListItem } from "../linklist/index_";

export interface IRiotOptsLinkListGroupItem {
    label: string;
    links: IRiotOptsLinkListItem[];
}
export interface IRiotOptsLinkListGroup {
    basic: boolean;
    linksgroup: IRiotOptsLinkListGroupItem[];
    url: string;
}

export interface IRiotTagLinkListGroup extends
    // IRiotOptsLinkListGroup,
    RiotTag { // RiotMixinWithRecursivePropertySetter
    setBasic: (basic: boolean) => void;
}

export const riotMountLinkListGroup = (selector: string, opts: IRiotOptsLinkListGroup): RiotTag[] => {
    const tag = riot.mount(selector, opts);
    // console.log(tag); // RiotTag[]
    return tag;
};

// tslint:disable-next-line:space-before-function-paren
(window as any).riot_linklistgroup = function (_opts: IRiotOptsLinkListGroup) {

    const that = this as IRiotTagLinkListGroup;

    // tslint:disable-next-line:space-before-function-paren
    that.setBasic = function (basic: boolean) {
        this.opts.basic = basic;
        this.update();
    };
};
