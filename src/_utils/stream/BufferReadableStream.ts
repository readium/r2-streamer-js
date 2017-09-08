import { Readable } from "stream";

// import * as debug_ from "debug";
// const debug = debug_("r2:BufferReadableStream");

export class BufferReadableStream extends Readable {
    public readonly buffer: Buffer;
    private alreadyRead: number;

    constructor(buffer: Buffer) {
        super();
        this.buffer = buffer;
        this.alreadyRead = 0;
    }

    public _read(size: number): void {
        // debug("_read(size): " + size);

        if (this.alreadyRead >= this.buffer.length) {
            this.push(null);
            return;
        }

        let chunk = this.alreadyRead ?
            this.buffer.slice(this.alreadyRead) :
            this.buffer;

        if (size) {
            let l = size;
            if (size > chunk.length) {
                l = chunk.length;
            }

            chunk = chunk.slice(0, l);
        }

        this.alreadyRead += chunk.length;
        this.push(chunk);
    }
}
