import { BufferReadableStream } from "@utils/stream/BufferReadableStream";
// import { PassThrough } from "stream";

export function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {

    return new BufferReadableStream(buffer);

    // const stream = new PassThrough();

    // setTimeout(() => {

    //     // stream.write(buffer);
    //     // stream.end();

    //     // const maxBuffLength = 2048; // 2kB
    //     let maxBuffLength = 100 * 1024; // 100kB

    //     let buff = buffer;
    //     let remaining = buff.length;
    //     let done = 0;

    //     console.log("bufferToStream()  BEFORE: " + remaining);

    //     while (remaining > 0) {

    //         if (done > 0) {
    //             buff = buffer.slice(done);
    //             // remaining === buff.length
    //         }

    //         if (buff.length > maxBuffLength) {
    //             buff = buff.slice(0, maxBuffLength);
    //         }

    //         const res = stream.write(buff);
    //         if (!res) {
    //             console.log("bufferToStream()  highWaterMark");

    //             // Buffer highWaterMark CHECK
    //             if ((stream as any)._writableState) {
    //                 const internalStreamWriteBuffer = (stream as any)._writableState.getBuffer();
    //                 if (internalStreamWriteBuffer) {
    //                     console.log("bufferToStream() _writableState.getBuffer().length: "
    // + internalStreamWriteBuffer.length);
    //                 }
    //             }

    //             // Buffer highWaterMark CHECK
    //             if ((stream as any)._readableState) {
    //                 const internalStreamReadBuffer = (stream as any)._readableState.buffer;
    //                 if (internalStreamReadBuffer) {
    //                     console.log("bufferToStream() _readableState.buffer.length: "
    // + internalStreamReadBuffer.length);
    //                 }
    //             }

    //         }

    //         done += buff.length;
    //         remaining -= buff.length;
    //     }

    //     console.log("bufferToStream()  AFTER: " + done);

    //     stream.end();
    // }, 20);

    // return stream;
}

export async function streamToBufferPromise_READABLE(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];

        readStream.on("error", reject);

        readStream.on("readable", () => {
            let chunk: Buffer;
            do {
                chunk = readStream.read() as Buffer;
                if (chunk) {
                    buffers.push(chunk);
                }
            }
            while (chunk);
        });

        readStream.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
    });
}

export async function streamToBufferPromise(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];

        readStream.on("error", reject);

        readStream.on("data", (data: Buffer) => {
            buffers.push(data);
        });

        readStream.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
    });
}
