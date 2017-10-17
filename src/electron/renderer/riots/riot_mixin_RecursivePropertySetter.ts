export interface RiotMixinWithRecursivePropertySetter extends RiotMixin {
    setPropertyRecursively(name: string, val: any, childTagName: string): void;
}
// tslint:disable-next-line:variable-name
export const riot_mixin_RecursivePropertySetter: RiotMixinWithRecursivePropertySetter = {
    init(_opts: any) {
        // console.log(opts);
        // console.log(this);

        // const that = this as RiotTag;
    },

    setPropertyRecursively(name: string, val: any, childTagName: string) {

        this[name] = val;

        const that = this as RiotTag;
        const children = that.tags[childTagName] as any;

        if (!children) {
            return;
        }

        if (children instanceof Array) {
            children.forEach((child: RiotMixinWithRecursivePropertySetter) => {
                child.setPropertyRecursively(name, val, childTagName);
            });
        } else {
            (children as RiotMixinWithRecursivePropertySetter)
                .setPropertyRecursively(name, val, childTagName);
        }
    },
};
