import { Zip1 } from "./zip1";

export interface IZip {
    hasEntries: () => boolean;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string, entry: any) => void) => void;
    entryBuffer: (entryPath: string) => Buffer | undefined;
}

// https://github.com/thejoshwolfe/yauzl/blob/master/README.md#fromrandomaccessreaderreader-totalsize-options-callback
// https://github.com/maxogden/punzip
// https://github.com/maxogden/mount-url/blob/master/index.js#L144
// https://github.com/gildas-lormeau/zip.js/blob/master/WebContent/zip-ext.js#L95
// https://github.com/thejoshwolfe/yauzl/blob/master/test/range-test.js#L83
export function createZipPromise(filePath: string): Promise<IZip> {

    return Zip1.init(filePath);
}
