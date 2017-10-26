import { RangeStream } from "../stream/RangeStream";

export interface IStreamAndLength {
    stream: NodeJS.ReadableStream;
    length: number;
    reset: () => Promise<IStreamAndLength>;
}

export interface IZip {
    hasEntries: () => boolean;
    entriesCount: () => number;
    hasEntry: (entryPath: string) => boolean;
    forEachEntry: (callback: (entryName: string) => void) => void;
    entryStreamPromise: (entryPath: string) => Promise<IStreamAndLength>;
    entryStreamRangePromise: (entryPath: string, begin: number, end: number) => Promise<IStreamAndLength>;
    freeDestroy: () => void;
}

export abstract class Zip implements IZip {
    public abstract hasEntries(): boolean;
    public abstract entriesCount(): number;
    public abstract hasEntry(entryPath: string): boolean;
    public abstract forEachEntry(callback: (entryName: string) => void): void;
    public abstract entryStreamPromise(entryPath: string): Promise<IStreamAndLength>;
    public abstract freeDestroy(): void;

    public async entryStreamRangePromise(entryPath: string, begin: number, end: number): Promise<IStreamAndLength> {

        let streamAndLength: IStreamAndLength;
        try {
            streamAndLength = await this.entryStreamPromise(entryPath);
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
        // necessary for TypeScript compiler :(
        streamAndLength = streamAndLength as IStreamAndLength;

        const b = begin < 0 ? 0 : begin;
        const e = end < 0 ? (streamAndLength.length - 1) : end;
        // const length = e - b + 1;
        // debug(`entryStreamRangePromise: ${b}-${e}/${streamAndLength.length}`);

        const stream = new RangeStream(b, e, streamAndLength.length);

        streamAndLength.stream.pipe(stream);

        const sal: IStreamAndLength = {
            length: streamAndLength.length,
            reset: async () => {
                return this.entryStreamRangePromise(entryPath, begin, end);
            },
            stream,
        };
        return sal;
    }
}
