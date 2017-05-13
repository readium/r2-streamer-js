import * as debug_ from "debug";
import * as StreamZip from "node-stream-zip";

const debug = debug_("r2:zip");

// https://github.com/thejoshwolfe/yauzl/blob/master/README.md#fromrandomaccessreaderreader-totalsize-options-callback
// https://github.com/maxogden/punzip
// https://github.com/maxogden/mount-url/blob/master/index.js#L144
// https://github.com/gildas-lormeau/zip.js/blob/master/WebContent/zip-ext.js#L95
// https://github.com/thejoshwolfe/yauzl/blob/master/test/range-test.js#L83
export function createZipPromise(filePath: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {

        const zip = new StreamZip({
            file: filePath,
            storeEntries: true,
        });

        zip.on("error", (err: any) => {
            debug("--ZIP error:");
            debug(err);

            reject(err);
        });

        zip.on("entry", (_entry: any) => {
            // console.log("--ZIP: entry");
            // console.log(entry.name);
        });

        zip.on("extract", (entry: any, file: any) => {
            debug("--ZIP extract:");
            debug(entry.name);
            debug(file);
        });

        zip.on("ready", () => {
            // console.log("--ZIP: ready");
            // console.log(zip.entriesCount);

            // const entries = zip.entries();
            // console.log(entries);

            resolve(zip);
        });
    });
}
