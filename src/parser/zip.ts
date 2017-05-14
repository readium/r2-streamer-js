// https://github.com/thejoshwolfe/yauzl/blob/master/README.md#fromrandomaccessreaderreader-totalsize-options-callback
// https://github.com/maxogden/punzip
// https://github.com/maxogden/mount-url/blob/master/index.js#L144
// https://github.com/gildas-lormeau/zip.js/blob/master/WebContent/zip-ext.js#L95
// https://github.com/thejoshwolfe/yauzl/blob/master/test/range-test.js#L83
export interface IZip {
    hasEntries: () => boolean;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string) => void) => void;
    entryBufferPromise: (entryPath: string) => Promise<Buffer>;
}
