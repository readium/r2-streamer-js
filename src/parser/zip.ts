// https://github.com/thejoshwolfe/yauzl/blob/master/README.md#fromrandomaccessreaderreader-totalsize-options-callback
// https://github.com/maxogden/punzip
// https://github.com/maxogden/mount-url/blob/master/index.js#L144
// https://github.com/gildas-lormeau/zip.js/blob/master/WebContent/zip-ext.js#L95
// https://github.com/thejoshwolfe/yauzl/blob/master/test/range-test.js#L83
export interface IZip {
    hasEntries: () => boolean;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string) => void) => void;
    entryStreamPromise: (entryPath: string) => Promise<NodeJS.ReadableStream>;
}

export function streamToBufferPromise(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];
        readStream.on("error", reject);
        readStream.on("data", (data: Buffer) => {
            buffers.push(data);
        });
        readStream.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
        // declare module "stream-to-array" {
        //     export function toArray(stream: NodeJS.ReadableStream): Promise<any>;
        // }
        // import * as streamtoArray from "stream-to-array";
        // streamtoArray.toArray(readStream)
        //     .then((parts: any): Buffer => {
        //         const buffers = parts
        //             .map((part: any) => {
        //                 return util.isBuffer(part) ? part : Buffer.from(part);
        //             });
        //         return Buffer.concat(buffers);
        //     }).then((buffer: Buffer) => {
        //         resolve(buffer);
        //     });
    });
}
