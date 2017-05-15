import * as debug_ from "debug";
import * as StreamZip from "node-stream-zip";

import { PassThrough, Stream } from "stream";
import { IZip } from "./zip";

const debug = debug_("r2:zip1");

export class Zip1 implements IZip {

    public static loadPromise(filePath: string): Promise<IZip> {

        return new Promise<IZip>((resolve, reject) => {

            const zip = new StreamZip({
                file: filePath,
                storeEntries: true,
            });

            zip.on("error", (err: any) => {
                debug("--ZIP error:");
                debug(err);

                reject(err);
            });

            zip.on("entry", (entry: any) => {
                // console.log("--ZIP: entry");
                debug(entry.name);
            });

            zip.on("extract", (entry: any, file: any) => {
                debug("--ZIP extract:");
                debug(entry.name);
                debug(file);
            });

            zip.on("ready", () => {
                // console.log("--ZIP: ready");
                // console.log(zip.entriesCount);

                // const entries = zip.entries();
                // console.log(entries);

                resolve(new Zip1(filePath, zip));
            });
        });
    }

    private constructor(readonly filePath: string, readonly zip: any) {
    }

    public hasEntries(): boolean {
        return this.zip.entriesCount > 0;
    }

    public hasEntry(entryPath: string): boolean {
        return this.hasEntries()
            && Object.keys(this.zip.entries()).indexOf(entryPath) >= 0;
    }

    public forEachEntry(callback: (entryName: string) => void) {

        if (!this.hasEntries()) {
            return;
        }

        const entries = this.zip.entries();
        Object.keys(entries).forEach((entryName) => {
            callback(entryName);
        });
    }

    public entryStreamPromise(entryPath: string): Promise<NodeJS.ReadableStream> {

        if (!this.hasEntries() || !this.hasEntry(entryPath)) {
            return Promise.reject("no such path in zip");
        }

        return new Promise<Stream>((resolve, _reject) => {
            const stream = new PassThrough();
            stream.write(this.zip.entryDataSync(entryPath));
            stream.end();
            resolve(stream);
        });
    }
}
