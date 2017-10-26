import * as debug_ from "debug";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import * as yauzl from "yauzl";

import { isHTTP } from "../http/UrlUtils";
import { streamToBufferPromise } from "../stream/BufferUtils";
import { IStreamAndLength, IZip, Zip } from "./zip";
import { HttpZipReader } from "./zip2RandomAccessReader_Http";

const debug = debug_("r2:zip2");

interface IStringKeyedObject { [key: string]: any; }

export class Zip2 extends Zip {

    public static async loadPromise(filePath: string): Promise<IZip> {
        if (isHTTP(filePath)) {
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

    private static async loadPromiseHTTP(filePath: string): Promise<IZip> {

        // No response streaming! :(
        // https://github.com/request/request-promise/issues/90
        const needsStreamingResponse = true;

        return new Promise<IZip>(async (resolve, reject) => {

            const failure = (err: any) => {
                debug(err);
                reject(err);
            };

            const success = async (res: request.RequestResponse) => {
                if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                    failure("HTTP CODE " + res.statusCode);
                    return;
                }

                debug(filePath);
                debug(res.headers);

                // if (!res.headers["content-type"]
                //     || res.headers["content-type"] !== "application/epub+zip") {
                //     reject("content-type not supported!");
                //     return;
                // }

                // TODO: if the HTTP server does not provide Content-Length,
                // then fallback on download, but interrupt (req.abort())
                // if response payload reaches the max limit
                if (!res.headers["content-length"]) {
                    reject("content-length not supported!");
                    return;
                }
                const httpZipByteLength = parseInt(res.headers["content-length"] as string, 10);
                debug(`Content-Length: ${httpZipByteLength}`);

                if (!res.headers["accept-ranges"]
                    || res.headers["accept-ranges"] !== "bytes") {
                    if (httpZipByteLength > (2 * 1024 * 1024)) {
                        reject("accept-ranges not supported, file too big to download: " + httpZipByteLength);
                        return;
                    }
                    debug("Downloading: " + filePath);

                    const failure_ = (err: any) => {

                        debug(err);
                        reject(err);
                    };

                    const success_ = async (ress: request.RequestResponse) => {
                        if (ress.statusCode && (ress.statusCode < 200 || ress.statusCode >= 300)) {
                            failure_("HTTP CODE " + ress.statusCode);
                            return;
                        }

                        // debug(filePath);
                        // debug(res.headers);
                        let buffer: Buffer;
                        try {
                            buffer = await streamToBufferPromise(ress);
                        } catch (err) {
                            debug(err);
                            reject(err);
                            return;
                        }

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
                    };

                    if (needsStreamingResponse) {
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: filePath,
                        })
                            .on("response", success_)
                            .on("error", failure_);
                    } else {
                        let ress: requestPromise.FullResponse;
                        try {
                            // tslint:disable-next-line:await-promise no-floating-promises
                            ress = await requestPromise({
                                headers: {},
                                method: "GET",
                                resolveWithFullResponse: true,
                                uri: filePath,
                            });
                        } catch (err) {
                            failure_(err);
                            return;
                        }

                        await success_(ress);
                    }

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
            };

            if (needsStreamingResponse) {
                request.get({
                    headers: {},
                    method: "HEAD",
                    uri: filePath,
                })
                    .on("response", success)
                    .on("error", failure);
            } else {
                // TODO: instead of a HEAD request, if not supported then
                // GET with immediate req.abort() in the response callback
                let res: requestPromise.FullResponse;
                try {
                    // tslint:disable-next-line:await-promise no-floating-promises
                    res = await requestPromise({
                        headers: {},
                        method: "HEAD",
                        resolveWithFullResponse: true,
                        uri: filePath,
                    });
                } catch (err) {
                    failure(err);
                    return;
                }

                await success(res);
            }
        });
    }

    private entries: IStringKeyedObject;

    private constructor(readonly filePath: string, readonly zip: any) {
        super();

        // see addEntry()
        this.entries = {};
    }

    public freeDestroy(): void {
        debug("freeDestroy: Zip2 -- " + this.filePath);
        if (this.zip) {
            this.zip.close();
        }
    }

    public entriesCount(): number {
        return this.zip.entryCount;
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
                    length: entry.uncompressedSize as number,
                    reset: async () => {
                        return this.entryStreamPromise(entryPath);
                    },
                    stream,
                };
                resolve(streamAndLength);
            });
        });
    }

    private addEntry(entry: any) {
        this.entries[entry.fileName] = entry;
    }
}
