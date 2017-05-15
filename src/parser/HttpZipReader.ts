import { PassThrough } from "stream";

import * as debug_ from "debug";
import * as request from "request";
import * as util from "util";
import * as yauzl from "yauzl";

// import { HttpReadableStream } from "./HttpReadableStream";

const debug = debug_("r2:httpStream");

export interface RandomAccessReader {
    _readStreamForRange(start: number, end: number): void;
}
export class HttpZipReader implements RandomAccessReader {

    constructor(readonly url: string, readonly byteLength: number) {
        yauzl.RandomAccessReader.call(this);
    }

    public _readStreamForRange(start: number, end: number) {
        // const length = end - start;
        // debug(`_readStreamForRange (new HttpReadableStream) ${this.url}` +
        //     ` content-length=${this.byteLength} start=${start} end+1=${end} (length=${length})`);

        // return new HttpReadableStream(this.url, this.byteLength, start, end);
        // =>

        // const stream = new PassThrough();

        const length = end - start;
        // debug(`_read: ${size} (${this.url}` +
        //     ` content-length=${this.byteLength} start=${this.start} end+1=${this.end} (length=${length}))`);
        // debug(`alreadyRead: ${this.alreadyRead} (byteLength: ${length})`);

        console.log(`HTTP GET ${this.url}: ${start}-${end} (${length}) [${this.byteLength}]`);

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

                res.pipe(stream);
                // .on("end", () => {
                //     debug("END");
                // });
                // this.write(res);
                // this.end();
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
