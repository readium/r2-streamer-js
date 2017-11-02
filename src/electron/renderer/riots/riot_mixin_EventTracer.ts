// export interface RiotMixinWithOpts extends RiotMixin {
//     getOpts(): any;
//     setOpts(opts: any, update: boolean): RiotTag;
// }
// tslint:disable-next-line:variable-name
export const riot_mixin_EventTracer = { // : RiotMixinWithOpts
    init(opts: any) {
        console.log(opts);
        console.log(this);

        // @ts-ignore: TS2352 (Type of 'this' [init(opts: any) function] cannot be converted to RiotTag)
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

    // getOpts(): any {
    //     const that = this as RiotTag;
    //     return that.opts;
    // },

    // setOpts(opts: any, update: boolean): RiotTag {
    //     const that = this as RiotTag;
    //     that.opts = opts;
    //     if (update) {
    //         that.update();
    //     }
    //     return that;
    // },
};
