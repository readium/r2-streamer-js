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

        // @ts-ignore: TS7017 (Element implicitly has an 'any' type because no index signature)
        this[name] = val;

        // @ts-ignore: TS2352 (Type of 'this' [setPropertyRecursively(...) function] cannot be converted to RiotTag)
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
