/////////////
/////////////
/////////////
///////////// THIS IS UNUSED CODE!
/////////////
/////////////
/////////////

import { Readable } from "stream";

import { streamToBufferPromise } from "../utils";

import * as debug_ from "debug";
import * as request from "request";

const debug = debug_("r2:httpStream");

export class HttpReadableStream extends Readable {

    private alreadyRead = 0;

    constructor(
        readonly url: string,
        readonly byteLength: number,
        readonly byteStart: number,
        readonly byteEnd: number) {
        super();
    }

    public _read(_size: number) {

        const length = this.byteEnd - this.byteStart;
        // debug(`_read: ${size} (${this.url}` +
        //     ` content-length=${this.byteLength} start=${this.start} end+1=${this.end} (length=${length}))`);
        // debug(`alreadyRead: ${this.alreadyRead} (byteLength: ${length})`);
        if (this.alreadyRead >= length) {
            // debug("this.alreadyRead >= this.byteLength");
            this.push(null);
            return;
        }

        console.log(`HTTP GET ${this.url}: ${this.byteStart}-${this.byteEnd} (${this.byteEnd - this.byteStart})`);

        const lastByteIndex = this.byteEnd - 1;
        const range = `${this.byteStart}-${lastByteIndex}`;
        request.get({
            headers: { Range: `bytes=${range}` },
            method: "GET",
            uri: this.url,
        }).
            on("response", async (res: request.RequestResponse) => {
                // debug(res.headers);
                // debug(res.headers["content-type"]);
                // debug(`HTTP response content-range: ${res.headers["content-range"]}`);
                // debug(`HTTP response content-length: ${res.headers["content-length"]}`);

                let buffer: Buffer | undefined;
                try {
                    buffer = await streamToBufferPromise(res);
                } catch (err) {
                    debug(err);
                    this.push(null);
                    return;
                }

                // debug(`streamToBufferPromise: ${buffer.length}`);
                this.alreadyRead += buffer.length;
                this.push(buffer);
            }).
            on("error", (err: any) => {
                debug(err);
                this.push(null);
            });
    }
}
