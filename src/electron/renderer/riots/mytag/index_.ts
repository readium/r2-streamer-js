// http://riotjs.com/guide/
// http://riotjs.com/api/
import { riot_mixin_EventTracer } from "../riot_mixin_EventTracer";

export const riotMountMyTag = (opts: any): RiotTag[] => {
    const tag = riot.mount("riot-mytag", opts);
    console.log(tag); // RiotTag[]
    // console.log((tag[0] as any).getOpts()); // see RiotMixinWithOpts
    return tag;
};

// tslint:disable-next-line:space-before-function-paren
(window as any).riot_mytag = function (opts: any) {
    console.log(opts);
    console.log(this);

    const that = this as RiotTag;

    that.mixin(riot_mixin_EventTracer);

    this.prop1 = "val1";
    this.applyClazz = false;

    // ev.currentTarget (where event handler is attached)
    // ev.target (originating element)
    // ev.which (keyboard)
    // ev.item (loop)
    this.onclickButton = (ev: RiotEvent) => {
        console.log("CLICK button");
        // applyClazz will not be taken into account immediately (no automatic call to update()
        ev.preventUpdate = true;
        this.applyClazz = false;
        (that.refs.testSpan as HTMLElement).style.fontSize = "100%";
        setTimeout(() => {
            // (window as any).riot.update();
            that.update();
        }, 1000);
    };
    this.onclickHeading = (ev: RiotEvent) => {
        console.log("CLICK heading");
        this.applyClazz = true;
        (that.refs.testSpan as HTMLElement).style.fontSize = "200%";
        ev.preventDefault();
    };

    this.on("mount", () => {
        console.log(that.root.id);
        console.log(document.getElementById("myRiotTagID"));
        console.log(that.root.querySelectorAll("button")[0]);
    });

    that.shouldUpdate = (data: any, nextOpts: any) => {
        console.log(data);
        console.log(nextOpts);
        return true;
    };
};
