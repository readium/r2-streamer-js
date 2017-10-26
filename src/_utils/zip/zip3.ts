import * as debug_ from "debug";
import * as request from "request";
import * as unzipper from "unzipper";

import { isHTTP } from "../http/UrlUtils";
import { IStreamAndLength, IZip, Zip } from "./zip";

const debug = debug_("r2:zip3");

interface IStringKeyedObject { [key: string]: any; }

export class Zip3 extends Zip {

    public static async loadPromise(filePath: string): Promise<IZip> {
        if (isHTTP(filePath)) {
            return Zip3.loadPromiseHTTP(filePath);
        }

        return new Promise<IZip>(async (resolve, reject) => {
            let zip: any;
            try {
                zip = await unzipper.Open.file(filePath);
            } catch (err) {
                debug(err);
                reject(err);
                return;
            }
            debug(zip);
            resolve(new Zip3(filePath, zip));
        });
    }

    private static async loadPromiseHTTP(filePath: string): Promise<IZip> {

        return new Promise<IZip>(async (resolve, reject) => {
            let zip: any;
            try {
                zip = await unzipper.Open.url(request.get,
                    {
                        headers: {},
                        method: "GET",
                        uri: filePath,
                        url: filePath,
                    });
            } catch (err) {
                debug(err);
                reject(err);
                return;
            }
            debug(zip);
            resolve(new Zip3(filePath, zip));
        });
    }

    private entries: IStringKeyedObject;

    private constructor(readonly filePath: string, readonly zip: any) {
        super();

        this.entries = {};
        this.zip.files.forEach((file: any) => {
            this.entries[file.path] = file;
        });
    }

    public freeDestroy(): void {
        debug("freeDestroy: Zip3 -- " + this.filePath);
        if (this.zip) {
            // TODO?
            // this.zip.close();
        }
    }

    public entriesCount(): number {
        return this.zip.files.length;
    }

    public hasEntries(): boolean {
        return this.entriesCount() > 0;
    }

    public hasEntry(entryPath: string): boolean {
        return this.hasEntries() && this.entries[entryPath];
    }

    public forEachEntry(callback: (entryName: string) => void) {

        if (!this.hasEntries()) {
            return;
        }

        Object.keys(this.entries).forEach((entryName) => {
            callback(entryName);
        });
    }

    public async entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

        // debug(`entryStreamPromise: ${entryPath}`);

        if (!this.hasEntries() || !this.hasEntry(entryPath)) {
            return Promise.reject("no such path in zip: " + entryPath);
        }

        return new Promise<IStreamAndLength>((resolve, _reject) => {

            const entry = this.entries[entryPath];
            debug(entry);

            const stream: NodeJS.ReadableStream = entry.stream();
            const streamAndLength: IStreamAndLength = {
                length: entry.size,
                reset: async () => {
                    return this.entryStreamPromise(entryPath);
                },
                stream,
            };
            resolve(streamAndLength);
        });
    }
}
