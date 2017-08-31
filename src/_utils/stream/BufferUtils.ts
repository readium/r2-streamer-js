import { PassThrough } from "stream";

export function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {
    const stream = new PassThrough();

    // stream.write(buffer);
    // stream.end();

    setTimeout(() => {
        // const maxBuffLength = 2048; // 2kB
        const maxBuffLength = 50 * 1024; // 50kB

        let buff = buffer;
        let remaining = buff.length;
        let done = 0;

        console.log("bufferToStream BEFORE: " + remaining);

        while (remaining > 0) {

            if (done > 0) {
                buff = buffer.slice(done);
                // remaining === buff.length
            }

            if (buff.length > maxBuffLength) {
                buff = buff.slice(0, maxBuffLength);
            }

            stream.write(buff);

            done += buff.length;
            remaining -= buff.length;
        }

        console.log("bufferToStream AFTER: " + done);

        stream.end();
    }, 20);

    return stream;
}

export async function streamToBufferPromise(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];

        readStream.on("error", reject);

        // readStream.on("readable", () => {
        //     let chunk: Buffer;
        //     chunk = readStream.read() as Buffer;
        //     while (chunk) {
        //         buffers.push(chunk);
        //         chunk = readStream.read() as Buffer;
        //     }
        // });
        readStream.on("data", (data: Buffer) => {
            buffers.push(data);
        });

        readStream.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
    });
}
