// http://riotjs.com/guide/
// http://riotjs.com/api/
import { handleLink} from "../../index_navigator";
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

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
};
