import { RangeStream } from "./RangeStream";

export interface IStreamAndLength {
    stream: NodeJS.ReadableStream;
    length: number;
}

export interface IZip {
    hasEntries: () => boolean;
    entriesCount: () => number;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string) => void) => void;
    entryStreamPromise: (entryPath: string) => Promise<IStreamAndLength>;
    entryStreamRangePromise: (entryPath: string, begin: number, end: number) => Promise<IStreamAndLength>;
}

export abstract class Zip implements IZip {
    public abstract hasEntries(): boolean;
    public abstract entriesCount(): number;
    public abstract hasEntry(entryPath: string): boolean;
    public abstract forEachEntry(callback: (entryName: string) => void): void;
    public abstract entryStreamPromise(entryPath: string): Promise<IStreamAndLength>;

    public entryStreamRangePromise(entryPath: string, begin: number, end: number): Promise<IStreamAndLength> {

        return new Promise<IStreamAndLength>((resolve, reject) => {
            this.entryStreamPromise(entryPath)
                .then((streamAndLength) => {

                    const b = begin < 0 ? 0 : begin;
                    const e = end < 0 ? (streamAndLength.length - 1) : end;
                    // const length = e - b + 1;
                    // debug(`entryStreamRangePromise: ${b}-${e}/${streamAndLength.length}`);

                    const stream = new RangeStream(b, e, streamAndLength.length);

                    streamAndLength.stream.pipe(stream);

                    const sal: IStreamAndLength = {
                        stream,
                        length: streamAndLength.length,
                    };
                    resolve(sal);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
}
