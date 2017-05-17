import { Zip2 } from "./zip2";

export interface IZip {
    hasEntries: () => boolean;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string) => void) => void;
    entryStreamPromise: (entryPath: string) => Promise<IStreamAndLength>;
    entryStreamRangePromise: (entryPath: string, begin: number, end: number) => Promise<IStreamAndLength>;
}

export interface IStreamAndLength {
    stream: NodeJS.ReadableStream;
    length: number;
}

export function zipLoadPromise(filePath: string): Promise<IZip> {
    return Zip2.loadPromise(filePath);
}
