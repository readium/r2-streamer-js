import { Transform } from "stream";

// const debug = debug_("r2:rangeStream");

export class RangeStream extends Transform {
    private bytesReceived: number;
    private finished: boolean;
    private closed: boolean;

    constructor(readonly streamBegin: number, readonly streamEnd: number, readonly streamLength: number) {
        super();
        this.bytesReceived = 0;
        this.finished = false;
        this.closed = false;
        this.on("end", () => {
            // console.log("------ RangeStream END");
        });
        this.on("finish", () => {
            // console.log("------ RangeStream FINISH");
        });
    }

    public _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
        this.bytesReceived += chunk.length;
        // console.log(`_transform bytesReceived ${this.bytesReceived}`);

        if (this.finished) {
            if (!this.closed) {
                // console.log("CLOSING...");
                this.closed = true;
                this.push(null);
            } else {
                // console.log("STILL PIPE CALLING _transform ??!");
                this.end();
            }
        } else {
            if (this.bytesReceived > this.streamBegin) {

                let chunkBegin = 0;
                let chunkEnd = chunk.length - 1;

                chunkBegin = this.streamBegin - (this.bytesReceived - chunk.length);
                if (chunkBegin < 0) {
                    chunkBegin = 0;
                }

                if (this.bytesReceived > this.streamEnd) {
                    this.finished = true;
                    chunkEnd = chunk.length - (this.bytesReceived - this.streamEnd);
                }
                // console.log(`CHUNK: ${chunkBegin}-${chunkEnd}/${chunk.length}`);
                this.push(chunk.slice(chunkBegin, chunkEnd + 1));
            } else {
                // NOOP
                // no call to this.push(), we skip the entire current chunk buffer
            }
        }

        callback();
    }
}
