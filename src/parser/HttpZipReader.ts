import { PassThrough } from "stream";

import * as debug_ from "debug";
import * as request from "request";
import * as util from "util";
import * as yauzl from "yauzl";

import { bufferToStream, streamToBufferPromise } from "../utils";
// import { HttpReadableStream } from "./HttpReadableStream";

const debug = debug_("r2:httpStream");

export interface RandomAccessReader {
    _readStreamForRange(start: number, end: number): void;
}
export class HttpZipReader implements RandomAccessReader {

    private firstBuffer: Buffer | undefined = undefined;
    private firstBufferStart: number = 0;
    private firstBufferEnd: number = 0;

    constructor(readonly url: string, readonly byteLength: number) {
        yauzl.RandomAccessReader.call(this);
    }

    public _readStreamForRange(start: number, end: number) {
        // const length = end - start;
        // debug(`_readStreamForRange (new HttpReadableStream) ${this.url}` +
        //     ` content-length=${this.byteLength} start=${start} end+1=${end} (length=${length})`);

        // return new HttpReadableStream(this.url, this.byteLength, start, end);
        // =>

        // const length = end - start;
        // debug(`_read: ${size} (${this.url}` +
        //     ` content-length=${this.byteLength} start=${this.start} end+1=${this.end} (length=${length}))`);
        // debug(`alreadyRead: ${this.alreadyRead} (byteLength: ${length})`);

        if (this.firstBuffer && start >= this.firstBufferStart && end <= this.firstBufferEnd) {

            // console.log(`HTTP CACHE ${this.url}: ${start}-${end} (${length}) [${this.byteLength}]`);

            const begin = start - this.firstBufferStart;
            const stop = end - this.firstBufferStart;

            return bufferToStream(this.firstBuffer.slice(begin, stop));
        }

        // console.log(`HTTP GET ${this.url}: ${start}-${end} (${length}) [${this.byteLength}]`);

        const stream = new PassThrough();

        const lastByteIndex = end - 1;
        const range = `${start}-${lastByteIndex}`;
        request.get({
            headers: { Range: `bytes=${range}` },
            method: "GET",
            uri: this.url,
        }).
            on("response", (res: request.RequestResponse) => {
                // debug(res.headers);
                // debug(res.headers["content-type"]);
                // debug(`HTTP response content-range: ${res.headers["content-range"]}`);
                // debug(`HTTP response content-length: ${res.headers["content-length"]}`);

                if (this.firstBuffer) {
                    res.pipe(stream);
                    // // .on("end", () => {
                    // //     debug("END");
                    // // });
                } else {
                    streamToBufferPromise(res).then((buffer) => {
                        // debug(`streamToBufferPromise: ${buffer.length}`);

                        this.firstBuffer = buffer;
                        this.firstBufferStart = start;
                        this.firstBufferEnd = end;

                        stream.write(buffer);
                        stream.end();
                    }).catch((err) => {
                        debug(err);
                        stream.end();
                    });
                }
            }).
            on("error", (err: any) => {
                debug(err);
                // this.stream.end();
            });

        return stream;
    }
}
util.inherits(HttpZipReader, yauzl.RandomAccessReader);

// // tslint:disable-next-line:space-before-function-paren
// HttpZipReader.prototype._readStreamForRange = function (start: number, end: number) {

// };
