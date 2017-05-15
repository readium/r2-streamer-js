import { Stream } from "stream";

import * as debug_ from "debug";
import * as request from "request";
import * as yauzl from "yauzl";

import { HttpZipReader } from "./HttpZipReader";
import { IZip } from "./zip";

const debug = debug_("r2:zip2");

export class Zip2 implements IZip {

    public static loadPromise(filePath: string): Promise<IZip> {

        return new Promise<IZip>((resolve, reject) => {

            if (filePath.indexOf("http") === 0) {
                request.get({
                    headers: {},
                    method: "HEAD",
                    uri: filePath,
                }).
                    on("response", (res: request.RequestResponse) => {
                        debug(filePath);
                        debug(res.headers);

                        // if (!res.headers["content-type"]
                        //     || res.headers["content-type"] !== "application/epub+zip") {
                        //     reject("content-type not supported!");
                        //     return;
                        // }
                        if (!res.headers["accept-ranges"]
                            || res.headers["accept-ranges"] !== "bytes") {
                            reject("accept-ranges not supported!");
                            return;
                        }
                        if (!res.headers["content-length"]) {
                            reject("content-length not supported!");
                            return;
                        }
                        const httpZipByteLength = parseInt(res.headers["content-length"], 10);
                        debug(`Content-Length: ${httpZipByteLength}`);

                        const httpZipReader = new HttpZipReader(filePath, httpZipByteLength);
                        yauzl.fromRandomAccessReader(httpZipReader, httpZipByteLength,
                            { lazyEntries: true, autoClose: false },
                            (err: any, zip: any) => {
                                if (err) {
                                    debug("yauzl init ERROR");
                                    debug(err);
                                    reject(err);
                                    return;
                                }
                                zip.httpZipReader = httpZipReader;
                                const zip2 = new Zip2(filePath, zip);

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
                                        // debug(entry.fileName);
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
                    }).
                    on("error", (err: any) => {
                        debug(err);
                        reject(err);
                    });
            } else {
                yauzl.open(filePath, { lazyEntries: true, autoClose: false }, (err: any, zip: any) => {
                    if (err) {
                        debug("yauzl init ERROR");
                        debug(err);
                        reject(err);
                        return;
                    }
                    const zip2 = new Zip2(filePath, zip);

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
                            // debug(entry.fileName);
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
            }
        });
    }

    private entries: any[];

    private constructor(readonly filePath: string, readonly zip: any) {
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

    public entryStreamPromise(entryPath: string): Promise<NodeJS.ReadableStream> {

        debug(entryPath);

        if (!this.hasEntries()) {
            return Promise.reject("no zip entries");
        }

        const entry = this.entries.find((ent) => {
            return ent.fileName === entryPath;
        });
        if (!entry) {
            return Promise.reject("no such path in zip: " + entryPath);
        }

        return new Promise<Stream>((resolve, reject) => {

            this.zip.openReadStream(entry, (err: any, readStream: Stream) => {
                if (err) {
                    debug("yauzl openReadStream ERROR");
                    debug(err);
                    reject(err);
                    return;
                }
                resolve(readStream);
            });
        });
    }

    private addEntry(entry: any) {
        this.entries.push(entry);
    }
}
