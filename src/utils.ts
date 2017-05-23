import * as querystring from "querystring";

import { PassThrough } from "stream";

export function isHTTP(urlOrPath: string): boolean {
    // TODO: smarter regexp
    return urlOrPath.indexOf("http") === 0;
}

interface IStringKeyedObject { [key: string]: any; }

export function sortObject(obj: any): any {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sortObject(obj[i]);
        }
        return obj;
    } else if (typeof obj !== "object") {
        return obj;
    }

    const newObj: IStringKeyedObject = {};

    Object.keys(obj).sort().forEach((key) => {
        newObj[key] = sortObject(obj[key]);
    });

    return newObj;
}

export function encodeURIComponent_RFC3986(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c: string) => {
            return "%" + c.charCodeAt(0).toString(16);
        });
}

export function encodeURIComponent_RFC5987(str: string): string {
    return encodeURIComponent(str).
        replace(/['()]/g, querystring.escape). // i.e., %27 %28 %29
        replace(/\*/g, "%2A").
        // |`^
        replace(/%(?:7C|60|5E)/g, querystring.unescape);
}

export interface IRange { begin: number; end: number; }
export function parseRangeHeader(rangeHeader: string): IRange[] {
    const ranges: IRange[] = [];
    const iEqual = rangeHeader.indexOf("=");
    if (iEqual <= 0) {
        return ranges;
    }
    // const rangeType = rangeHeader.substr(0, iEqual); // assumes "bytes"
    const rangesStr = rangeHeader.substr(iEqual + 1); // multi-ranges?
    const rangeStrArray = rangesStr.split(",");
    rangeStrArray.forEach((rangeStr) => {
        // can be "-END", "BEGIN-" or "BEGIN-END"
        const beginEndArray = rangeStr.split("-");
        const beginStr = beginEndArray[0];
        const endStr = beginEndArray[1];
        let begin = -1;
        if (beginStr && beginStr.length) {
            begin = parseInt(beginStr, 10);
        }
        let end = -1;
        if (endStr && endStr.length) {
            end = parseInt(endStr, 10);
        }

        const rangeObj: IRange = { begin, end };
        ranges.push(rangeObj);
    });

    return ranges;
}

export function combineRanges(ranges: IRange[]): IRange[] {

    const orderedRanges = ranges
        .map((range, index) => {
            return {
                begin: range.begin,
                end: range.end,
                index,
            };
        })
        .sort((a, b) => {
            return a.begin - b.begin;
        });

    let j = 0;
    let i = 1;
    for (j = 0, i = 1; i < orderedRanges.length; i++) {
        const orderedRange = orderedRanges[i];
        const currentRange = orderedRanges[j];

        if (orderedRange.begin > currentRange.end + 1) {
            orderedRanges[++j] = orderedRange;
        } else if (orderedRange.end > currentRange.end) {
            currentRange.end = orderedRange.end;
            currentRange.index = Math.min(currentRange.index, orderedRange.index);
        }
    }

    orderedRanges.length = j + 1;

    return orderedRanges
        .sort((a, b) => {
            return a.index - b.index;
        })
        .map((range) => {
            return {
                begin: range.begin,
                end: range.end,
            };
        });
}

export function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {
    const stream = new PassThrough();
    stream.write(buffer);
    stream.end();
    return stream;
}

export function streamToBufferPromise(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];

        readStream.on("error", reject);

        // readStream.on("readable", () => {
        //     let chunk: Buffer;
        //     chunk = readStream.read() as Buffer;
        //     while (chunk) {
        //         buffers.push(chunk);
        //         chunk = readStream.read() as Buffer;
        //     }
        // });
        readStream.on("data", (data: Buffer) => {
            buffers.push(data);
        });

        readStream.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
    });
}
