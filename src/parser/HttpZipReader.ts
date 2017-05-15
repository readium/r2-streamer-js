// import * as debug_ from "debug";
import * as util from "util";
import * as yauzl from "yauzl";

import { HttpReadableStream } from "./HttpReadableStream";

// const debug = debug_("r2:zip2");

export interface RandomAccessReader {
    _readStreamForRange(start: number, end: number): void;
}
export class HttpZipReader implements RandomAccessReader {

    public _readStreamForRange: (start: number, end: number) => {
    };

    constructor(readonly url: string, readonly byteLength: number) {
        yauzl.RandomAccessReader.call(this);
    }
}
util.inherits(HttpZipReader, yauzl.RandomAccessReader);

// tslint:disable-next-line:space-before-function-paren
HttpZipReader.prototype._readStreamForRange = function (start: number, end: number) {
    // const length = end - start;
    // debug(`_readStreamForRange (new HttpReadableStream) ${this.url}` +
    //     ` content-length=${this.byteLength} start=${start} end+1=${end} (length=${length})`);
    return new HttpReadableStream(this.url, this.byteLength, start, end);
};
