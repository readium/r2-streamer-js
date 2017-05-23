import { PassThrough } from "stream";

export function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {
    const stream = new PassThrough();
    stream.write(buffer);
    stream.end();
    return stream;
}

export function streamToBufferPromise(readStream: NodeJS.ReadableStream): Promise<Buffer> {

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
