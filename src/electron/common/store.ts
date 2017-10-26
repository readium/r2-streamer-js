export interface IStore {
    // init(name: string, defaults: any): void;
    getDefaults(): any;
    get(key: string): any;
    set(key: string | undefined, value: any): void;
    onChanged(key: string, callback: (newValue: any, oldValue: any) => void): void;
}
declare var IStore: {
    new (name: string, defaults: any): IStore;
};
