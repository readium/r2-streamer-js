// tslint:disable-next-line:variable-name
export const riot_mixin_EventTracer = {
    init(opts: any) {
        console.log(opts);
        console.log(this);

        this.on("*", (evName: string) => {
            console.log("EVENT => " + evName);
        });

        this.on("before-mount", () => {
            console.log("EVENT before-mount");
        });
        this.on("mount", () => {
            console.log("EVENT mount");
        });

        this.on("update", () => {
            console.log("EVENT update");
        });
        this.on("updated", () => {
            console.log("EVENT updated");
        });

        this.on("before-unmount", () => {
            console.log("EVENT before-unmount");
        });
        this.on("unmount", () => {
            console.log("EVENT mount");
        });
    },

    getOpts() {
        return this.opts;
    },

    setOpts(opts: any, update: boolean): any {
        this.opts = opts;
        if (update) {
            this.update();
        }
        return this;
    },
};
