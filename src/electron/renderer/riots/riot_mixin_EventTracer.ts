export interface RiotMixinWithOpts extends RiotMixin {
    getOpts(): any;
    setOpts(opts: any, update: boolean): RiotTag;
    setPropertyRecursively(name: string, val: any, childTagName: string): void;
}
// tslint:disable-next-line:variable-name
export const riot_mixin_EventTracer: RiotMixinWithOpts = {
    init(opts: any) {
        console.log(opts);
        console.log(this);

        const that = this as RiotTag;

        that.on("*", (evName: string) => {
            console.log("EVENT => " + evName);
        });

        that.on("before-mount", () => {
            console.log("EVENT before-mount");
        });
        that.on("mount", () => {
            console.log("EVENT mount");
        });

        that.on("update", () => {
            console.log("EVENT update");
        });
        that.on("updated", () => {
            console.log("EVENT updated");
        });

        that.on("before-unmount", () => {
            console.log("EVENT before-unmount");
        });
        that.on("unmount", () => {
            console.log("EVENT mount");
        });
    },

    setPropertyRecursively(name: string, val: any, childTagName: string) {

        this[name] = val;

        const that = this as RiotTag;
        const children = that.tags[childTagName] as any;

        if (!children) {
            return;
        }

        if (children instanceof Array) {
            children.forEach((child: any) => {
                child.setPropertyRecursively(name, val, childTagName);
            });
        } else {
            children.setPropertyRecursively(name, val, childTagName);
        }
    },

    getOpts(): any {
        const that = this as RiotTag;
        return that.opts;
    },

    setOpts(opts: any, update: boolean): RiotTag {
        const that = this as RiotTag;
        that.opts = opts;
        if (update) {
            that.update();
        }
        return that;
    },
};
