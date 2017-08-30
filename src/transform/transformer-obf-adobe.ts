import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { bufferToStream, streamToBufferPromise } from "@utils/stream/BufferUtils";
import { IStreamAndLength } from "@utils/zip/zip";

import { ITransformer } from "./transformer";

export class TransformerObfAdobe implements ITransformer {
    public supports(_publication: Publication, link: Link): boolean {
        return link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC";
    }

    public async getDecryptedSizeStream(
        publication: Publication, link: Link,
        stream: NodeJS.ReadableStream, totalByteLength: number): Promise<number> {
        let sal: IStreamAndLength | undefined;
        try {
            sal = await this.transformStream(publication, link, stream, totalByteLength, 0, 0);
        } catch (err) {
            console.log(err);
            return Promise.reject("WTF?");
        }
        return Promise.resolve(sal.length);
    }

    public async getDecryptedSizeBuffer(publication: Publication, link: Link, data: Buffer): Promise<number> {
        let buff: Buffer | undefined;
        try {
            buff = await this.transformBuffer(publication, link, data);
        } catch (err) {
            console.log(err);
            return Promise.reject("WTF?");
        }
        return Promise.resolve(buff.length);
    }

    public async transformStream(
        publication: Publication, link: Link,
        stream: NodeJS.ReadableStream, _totalByteLength: number,
        _partialByteBegin: number, _partialByteEnd: number): Promise<IStreamAndLength> {

        const data = await streamToBufferPromise(stream);
        const buff = await this.transformBuffer(publication, link, data);

        const sal: IStreamAndLength = {
            length: buff.length,
            stream: bufferToStream(buff),
        };
        return Promise.resolve(sal);
    }

    public async transformBuffer(publication: Publication, _link: Link, data: Buffer): Promise<Buffer> {

        let pubID = publication.Metadata.Identifier;
        pubID = pubID.replace("urn:uuid:", "");
        pubID = pubID.replace(/-/g, "");
        pubID = pubID.replace(/\s/g, "");

        const key = [];
        for (let i = 0; i < 16; i++) {
            const byteHex = pubID.substr(i * 2, 2);
            const byteNumer = parseInt(byteHex, 16);
            key.push(byteNumer);
        }

        const prefixLength = 1024;
        const zipDataPrefix = data.slice(0, prefixLength);

        for (let i = 0; i < prefixLength; i++) {
            /* tslint:disable:no-bitwise */
            zipDataPrefix[i] = zipDataPrefix[i] ^ (key[i % key.length]);
        }

        const zipDataRemainder = data.slice(prefixLength);
        return Promise.resolve(Buffer.concat([zipDataPrefix, zipDataRemainder]));
    }
}
