import * as debug_ from "debug";
import * as request from "request";
import * as yauzl from "yauzl";

import { streamToBufferPromise } from "../utils";
import { HttpZipReader } from "./HttpZipReader";
import { RangeStream } from "./RangeStream";
import { IStreamAndLength, IZip } from "./zip";

const debug = debug_("r2:zip2");

interface IStringKeyedObject { [key: string]: any; }

export class Zip2 implements IZip {

    public static loadPromise(filePath: string): Promise<IZip> {
        if (filePath.indexOf("http") === 0) {
            return Zip2.loadPromiseHTTP(filePath);
        }

        return new Promise<IZip>((resolve, reject) => {

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
                    // if (/\/$/.test(entry.fileName)) {
                    if (entry.fileName[entry.fileName.length - 1] === "/") {
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
        });
    }

    private static loadPromiseHTTP(filePath: string): Promise<IZip> {

        return new Promise<IZip>((resolve, reject) => {

            request.head({
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

                    if (!res.headers["content-length"]) {
                        reject("content-length not supported!");
                        return;
                    }
                    const httpZipByteLength = parseInt(res.headers["content-length"], 10);
                    debug(`Content-Length: ${httpZipByteLength}`);

                    if (!res.headers["accept-ranges"]
                        || res.headers["accept-ranges"] !== "bytes") {
                        if (httpZipByteLength > (2 * 1024 * 1024)) {
                            reject("accept-ranges not supported, file too big to download: " + httpZipByteLength);
                            return;
                        }
                        debug("Downloading: " + filePath);
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: filePath,
                        }).
                            on("response", (ress: request.RequestResponse) => {
                                // debug(filePath);
                                // debug(res.headers);
                                streamToBufferPromise(ress).then((buffer) => {
                                    // debug(`streamToBufferPromise: ${buffer.length}`);

                                    yauzl.fromBuffer(buffer,
                                        { lazyEntries: true },
                                        (err: any, zip: any) => {
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
                                                if (entry.fileName[entry.fileName.length - 1] === "/") {
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
                                }).catch((err) => {
                                    debug(err);
                                    reject(err);
                                });
                            }).
                            on("error", (err: any) => {
                                debug(err);
                                reject(err);
                            });
                        return;
                    }

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
                                if (entry.fileName[entry.fileName.length - 1] === "/") {
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
        });
    }

    private entries: IStringKeyedObject;

    private constructor(readonly filePath: string, readonly zip: any) {

        // see addEntry()
        this.entries = {};
    }

    public entriesCount(): number {
        return this.zip.entryCount;
    }

    public hasEntries(): boolean {
        return this.zip.entryCount > 0;
    }

    public hasEntry(entryPath: string): boolean {
        if (!this.hasEntries()) {
            return false;
        }
        return true && this.entries[entryPath];
    }

    public forEachEntry(callback: (entryName: string) => void) {

        if (!this.hasEntries()) {
            return;
        }

        Object.keys(this.entries).forEach((entryName) => {
            callback(entryName);
        });
    }

    public entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

        // debug(`entryStreamPromise: ${entryPath}`);

        if (!this.hasEntries() || !this.hasEntry(entryPath)) {
            return Promise.reject("no such path in zip");
        }

        const entry = this.entries[entryPath];

        return new Promise<IStreamAndLength>((resolve, reject) => {

            this.zip.openReadStream(entry, (err: any, stream: NodeJS.ReadableStream) => {
                if (err) {
                    debug("yauzl openReadStream ERROR");
                    debug(err);
                    reject(err);
                    return;
                }
                const streamAndLength: IStreamAndLength = {
                    stream,
                    length: entry.uncompressedSize as number,
                };
                resolve(streamAndLength);
            });
        });
    }

    public entryStreamRangePromise(entryPath: string, begin: number, end: number): Promise<IStreamAndLength> {

        return new Promise<IStreamAndLength>((resolve, reject) => {
            this.entryStreamPromise(entryPath)
                .then((streamAndLength) => {

                    const b = begin < 0 ? 0 : begin;
                    const e = end < 0 ? (streamAndLength.length - 1) : end;
                    // const length = e - b + 1;

                    const stream = new RangeStream(b, e, streamAndLength.length);

                    streamAndLength.stream.pipe(stream);

                    const sal: IStreamAndLength = {
                        stream,
                        length: streamAndLength.length,
                    };
                    resolve(sal);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private addEntry(entry: any) {
        this.entries[entry.fileName] = entry;
    }
}
