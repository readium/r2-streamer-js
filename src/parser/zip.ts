import { Stream } from "stream";

import * as toArray from "stream-to-array";
import * as util from "util";

// https://github.com/thejoshwolfe/yauzl/blob/master/README.md#fromrandomaccessreaderreader-totalsize-options-callback
// https://github.com/maxogden/punzip
// https://github.com/maxogden/mount-url/blob/master/index.js#L144
// https://github.com/gildas-lormeau/zip.js/blob/master/WebContent/zip-ext.js#L95
// https://github.com/thejoshwolfe/yauzl/blob/master/test/range-test.js#L83
export interface IZip {
    hasEntries: () => boolean;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string) => void) => void;
    entryStreamPromise: (entryPath: string) => Promise<Stream>;
}

export function streamToBufferPromise(readStream: Stream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, _reject) => {
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
}
