import { IStore } from "./store";

import ElectronStore = require("electron-store");

export class StoreElectron implements IStore {
    private _electronStore: ElectronStore;

    constructor(name: string, readonly defaults: any) {
        this._electronStore = new ElectronStore({
            defaults,
            name,
        });
        (this._electronStore as any).events.setMaxListeners(0);
    }

    public getDefaults(): any {
        return this.defaults;
    }

    public get(key: string): any {
        return this._electronStore.get(key);
    }

    public set(key: string | undefined, value: any) {
        if (key) {
            this._electronStore.set(key, value);
        } else {
            this._electronStore.set(value);
        }
    }

    public onChanged(key: string, callback: (newValue: any, oldValue: any) => void): void {
        (this._electronStore as any).onDidChange(key, callback);
    }

    public reveal() {
        this._electronStore.openInEditor();
    }
}
