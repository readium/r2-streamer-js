import * as debug_ from "debug";
import * as uuid from "uuid";

import { IStore } from "../common/store";
import { StoreElectron } from "../common/store-electron";

export const electronStoreLSD: IStore = new StoreElectron("readium2-navigator-lsd", {});

const debug = debug_("r2:electron:main:lsd");

const LSD_STORE_DEVICEID_ENTRY_PREFIX = "deviceID_";

export interface IDeviceIDManager {
    getDeviceNAME(): string;

    getDeviceID(): string;

    checkDeviceID(key: string): string | undefined;

    recordDeviceID(key: string): void;
}

export const deviceIDManager: IDeviceIDManager = {

    checkDeviceID(key: string): string | undefined {

        const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;

        const lsdStore = electronStoreLSD.get("lsd");
        if (!lsdStore || !lsdStore[entry]) {
            return undefined;
        }

        return lsdStore[entry];
    },

    getDeviceID(): string {

        let id = uuid.v4();

        const lsdStore = electronStoreLSD.get("lsd");
        if (!lsdStore) {
            electronStoreLSD.set("lsd", {
                deviceID: id,
            });
        } else {
            if (lsdStore.deviceID) {
                id = lsdStore.deviceID;
            } else {
                lsdStore.deviceID = id;
                electronStoreLSD.set("lsd", lsdStore);
            }
        }

        return id;
    },

    getDeviceNAME(): string {
        return "Readium2 Electron desktop app";
    },

    recordDeviceID(key: string) {

        const id = this.getDeviceID();

        const lsdStore = electronStoreLSD.get("lsd");
        if (!lsdStore) {
            // Should be init'ed at this.getDeviceID()
            debug("LSD store problem?!");
            return;
        }

        const entry = LSD_STORE_DEVICEID_ENTRY_PREFIX + key;
        lsdStore[entry] = id;
        electronStoreLSD.set("lsd", lsdStore);
    },
};
