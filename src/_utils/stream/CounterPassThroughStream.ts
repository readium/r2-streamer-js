import { Transform } from "stream";

// const debug = debug_("r2:rangeStream");

export class CounterPassThroughStream extends Transform {
    public bytesReceived: number;
    public readonly id: number;

    constructor(id: number) {
        super();
        this.id = id;
        this.bytesReceived = 0;
    }

    public _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
        this.bytesReceived += chunk.length;

        this.push(chunk);

        this.emit("progress");

        callback();
    }
}
