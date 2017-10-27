// http://riotjs.com/guide/
// http://riotjs.com/api/

export interface IRiotOptsMenuSelectItem {
    id: string;
    label: string;
    style?: string;
}
export interface IRiotOptsMenuSelect {
    options: IRiotOptsMenuSelectItem[];
    selected: string;
    disabled: boolean;
}

export interface IRiotTagMenuSelect extends
    RiotTag {
    setDisabled: (disabled: boolean) => void;
    setSelectedItem: (item: string) => void;
    getIndexForId: (id: string) => number | undefined;
    getIndexForLabel: (label: string) => number | undefined;
    getIdForLabel: (label: string) => string | undefined;
    getLabelForId: (id: string) => string | undefined;
}

export const riotMountMenuSelect = (selector: string, opts: IRiotOptsMenuSelect): RiotTag[] => {
    const tag = riot.mount(selector, opts);
    // console.log(tag); // RiotTag[]
    return tag;
};

// tslint:disable-next-line:space-before-function-paren
(window as any).riot_menuselect = function (_opts: IRiotOptsMenuSelect) {
    const that = this as IRiotTagMenuSelect;

    // tslint:disable-next-line:space-before-function-paren
    that.getIndexForId = function (id: string): number | undefined {
        // let nDivider = 0;
        // (this.opts as IRiotOptsMenuSelect).options.forEach((option) => {
        //     if (option.label === "_") {
        //         nDivider++;
        //     }
        // });
        let index = -1;
        const found = (this.opts as IRiotOptsMenuSelect).options.find((option) => {
            if (option.label !== "_") {
                index++;
            }
            return option.id === id;
        });
        // (this.opts as IRiotOptsMenuSelect).options.indexOf(found) - nDivider
        return found ? index : undefined;
    };

    // tslint:disable-next-line:space-before-function-paren
    that.getIndexForLabel = function (label: string): number | undefined {
        // let nDivider = 0;
        // (this.opts as IRiotOptsMenuSelect).options.forEach((option) => {
        //     if (option.label === "_") {
        //         nDivider++;
        //     }
        // });
        let index = -1;
        const found = (this.opts as IRiotOptsMenuSelect).options.find((option) => {
            if (option.label !== "_") {
                index++;
            }
            return option.label === label;
        });
        // (this.opts as IRiotOptsMenuSelect).options.indexOf(found) - nDivider
        return found ? index : undefined;
    };

    // tslint:disable-next-line:space-before-function-paren
    that.getLabelForId = function (id: string): string | undefined {
        const found = (this.opts as IRiotOptsMenuSelect).options.find((option) => {
            return option.id === id;
        });
        return found ? found.label : undefined;
    };

    // tslint:disable-next-line:space-before-function-paren
    that.getIdForLabel = function (label: string): string | undefined {
        const found = (this.opts as IRiotOptsMenuSelect).options.find((option) => {
            return option.label === label;
        });
        return found ? found.id : undefined;
    };

    // tslint:disable-next-line:space-before-function-paren
    that.setSelectedItem = function (item: string) {

        let index = that.getIndexForId(item);
        if (typeof index === "undefined" || index < 0) {
            index = 0;
            item = (this.opts as IRiotOptsMenuSelect).options[0].id;
        }
        // console.log("setSelectedItem");
        // console.log(item);
        // console.log(index);
        (this.opts as IRiotOptsMenuSelect).selected = item;
        (that.root as any).mdcSelect.selectedIndex = index;
        this.update();
    };

    // tslint:disable-next-line:space-before-function-paren
    that.setDisabled = function (disabled: boolean) {

        this.opts.disabled = disabled;
        (that.root as any).mdcSelect.disabled = disabled;
        // this.update();
    };

    that.on("mount", () => {

        const menuFactory = (menuEl: HTMLElement) => {
            const menu = new (window as any).mdc.menu.MDCSimpleMenu(menuEl);
            (menuEl as any).mdcSimpleMenu = menu;
            return menu;
        };
        // MDCSelect.attachTo(that.root)
        const mdcSelector = new (window as any).mdc.select.MDCSelect(that.root, undefined, menuFactory);
        (that.root as any).mdcSelect = mdcSelector;

        mdcSelector.disabled = that.opts.disabled;

        mdcSelector.listen("MDCSelect:change", (ev: any) => {
            // console.log("MDCSelect:change: " + that.root.id);
            // console.log(ev);
            // console.log(ev.detail.selectedOptions[0].textContent);
            // console.log(ev.detail.selectedIndex);
            // console.log(ev.detail.value);

            // let label = ev.detail.value;
            // const element = that.root.ownerDocument.getElementById(label);
            // if (element) {
            //     console.log(element.textContent);
            //     label = element.textContent;
            // }

            that.trigger("selectionChanged", ev.detail.value);
        });
    });
};
