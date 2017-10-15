// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink} from "../index_navigator";
import { riot_mixin_EventTracer } from "./riot_mixin_EventTracer";

export const riotMountSpineList = (opts: any) => {
    const tag = riot.mount("riot-spinelist", opts);
    console.log(tag); // RiotTag[]
};

(window as any).riot_spinelist = function(opts: any) {
    console.log(opts);
    console.log(this);

    const that = this as RiotTag;

    that.mixin(riot_mixin_EventTracer);

    this.spine = opts.spine;
    this.pubUrl = opts.pubUrl;

    this.onclick = (ev: RiotEvent) => {
        ev.preventUpdate = true;
        ev.preventDefault();
        console.log((ev.currentTarget as HTMLElement).getAttribute("data-href"));
        const href = (ev.currentTarget as HTMLElement).getAttribute("href");
        if (href) {
            handleLink(href, this.pubUrl);
        }
    };

    this.on("mount", () => {

        // let firstLinear: any | undefined;
        // opts.spine.forEach((spineItem: any) => {
        //     // in Readium2, spine items are always linear (otherwise just "resource" collection)
        //     if (!firstLinear) { // && (!spineItem.linear || spineItem.linear === "yes")) {
        //         firstLinear = spineItem;
        //     }
        // });
        const firstLinear = this.spine.length ? this.spine[0] : undefined;
        if (firstLinear) {
            setTimeout(() => {
                const firstLinearLinkHref = this.pubUrl + "/../" + firstLinear.href;
                handleLink(firstLinearLinkHref, this.pubUrl);
            }, 200);
        }
    });
};
