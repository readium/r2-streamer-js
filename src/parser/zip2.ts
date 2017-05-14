import { Stream } from "stream";

import * as debug_ from "debug";
import * as toArray from "stream-to-array";
import * as util from "util";
import * as yauzl from "yauzl";

import { IZip } from "./zip";

const debug = debug_("r2:zip2");

export class Zip2 implements IZip {

    public static loadPromise(filePath: string): Promise<IZip> {

        return new Promise<IZip>((resolve, reject) => {

            yauzl.open(filePath, { lazyEntries: true, autoClose: false }, (err: any, zip: any) => {
                if (err) {
                    debug("yauzl init ERROR");
                    debug(err);
                    reject(err);
                    return;
                }
                const zip2 = new Zip2(zip);

                zip.on("error", (erro: any) => {
                    debug("yauzl ERROR");
                    debug(erro);
                    reject(erro);
                });

                zip.readEntry(); // next (lazyEntries)
                zip.on("entry", (entry: any) => {
                    if (/\/$/.test(entry.fileName)) {
                        // skip directories / folders
                    } else {
                        debug(entry.fileName);
                        zip2.addEntry(entry);
                    }
                    zip.readEntry(); // next (lazyEntries)
                });

                zip.on("end", () => {
                    debug("yauzl END");
                    resolve(zip2);
                });

                zip.on("close", () => {
                    debug("yauzl CLOSE");
                });
            });
        });
    }

    private entries: any[];

    private constructor(readonly zip: any) {
        this.entries = [];
    }

    public hasEntries(): boolean {
        return this.zip.entryCount > 0;
    }

    public hasEntry(entryPath: string): boolean {
        if (!this.hasEntries()) {
            return false;
        }
        const ent = this.entries.find((entry) => {
            return entryPath === entry.fileName;
        });
        return typeof ent !== "undefined";
    }

    public forEachEntry(callback: (entryName: string) => void) {

        if (!this.hasEntries()) {
            return;
        }

        this.entries.forEach((entry) => {
            callback(entry.fileName);
        });
    }

    public entryBufferPromise(entryPath: string): Promise<Buffer> {

        if (!this.hasEntries()) {
            return Promise.reject("no zip entries");
        }

        const entry = this.entries.find((ent) => {
            return ent.fileName === entryPath;
        });
        if (!entry) {
            return Promise.reject("no such path in zip: " + entryPath);
        }

        return new Promise<Buffer>((resolve, reject) => {

            this.zip.openReadStream(entry, (err: any, readStream: Stream) => {
                if (err) {
                    debug("yauzl openReadStream ERROR");
                    debug(err);
                    reject(err);
                    return;
                }

                toArray(readStream)
                    .then((parts: any): Buffer => {
                        const buffers = parts
                            .map((part: any) => {
                                return util.isBuffer(part) ? part : Buffer.from(part);
                            });
                        return Buffer.concat(buffers);
                    }).then((buffer: Buffer) => {
                        resolve(buffer);
                    });
            });
        });
    }

    private addEntry(entry: any) {
        this.entries.push(entry);
    }
}
