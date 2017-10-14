import { riot_mixin_EventTracer } from "./riot_mixin_EventTracer";

(window as any).riot_mytag = function(opts: any) {
    console.log(opts);
    console.log(this);

    this.mixin(riot_mixin_EventTracer);

    this.prop1 = "val1";
    this.applyClazz = false;

    this.onclickButton = (ev: any) => {
        console.log("CLICK button");
        // applyClazz will not be taken into account immediately (no automatic call to update()
        ev.preventUpdate = true;
        this.applyClazz = false;
        this.refs.testSpan.style.fontSize = "100%";
        setTimeout(() => {
            // (window as any).riot.update();
            this.update();
        }, 1000);
    };
    this.onclickHeading = (ev: any) => {
        console.log("CLICK heading");
        this.applyClazz = true;
        this.refs.testSpan.style.fontSize = "200%";
        ev.preventDefault();
    };

    const self = this;
    function onMount(tag: any) {
        console.log(tag.root.id);
        console.log(self.root.id);
        console.log(this.root.id);
        console.log(document.getElementById("myRiotTagID"));
        console.log(tag.root.querySelectorAll("button")[0]);
    }
    this.on("mount", () => {
        onMount.bind(this)(this);
    });
};
