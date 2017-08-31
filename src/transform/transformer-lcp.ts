import * as zlib from "zlib";

import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { bufferToStream, streamToBufferPromise } from "@utils/stream/BufferUtils";
import { RangeStream } from "@utils/stream/RangeStream";
import { IStreamAndLength } from "@utils/zip/zip";
import * as debug_ from "debug";
import * as forge from "node-forge";

import { ITransformer } from "./transformer";

const debug = debug_("r2:transformer:lcp");

const AES_BLOCK_SIZE = 16;

export class TransformerLCP implements ITransformer {
    private contentKey: string | undefined;

    public supports(publication: Publication, link: Link): boolean {
        const check = link.Properties.Encrypted.Scheme === "http://readium.org/2014/01/lcp"
            && link.Properties.Encrypted.Profile === "http://readium.org/lcp/basic-profile"
            && link.Properties.Encrypted.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc";
        if (!check) {
            return false;
        }

        const lcpPass = publication.Internal.find((i) => {
            if (i.Name === "lcp_user_pass") {
                return true;
            }
            return false;
        });

        const lcpPassHash: string | undefined = lcpPass ? lcpPass.Value : undefined;

        if (!lcpPassHash) {
            debug("LCP missing key.");
            return false;
        }

        this.contentKey = this.UpdateLCP(publication, lcpPassHash);

        return true;
    }

    public async getDecryptedSizeStream(
        _publication: Publication, _link: Link,
        stream: IStreamAndLength): Promise<number> {

        const twoBlocks = 2 * AES_BLOCK_SIZE;
        if (stream.length < twoBlocks) {
            return 0;
        }
        const readPos = stream.length - twoBlocks;

        //     stream.pos(readPos); // TODO: ReadableStream is not SEEKABLE!!
        //     const buff = stream.read(twoBlocks);

        const rangeStream = new RangeStream(readPos, readPos + twoBlocks - 1, stream.length);
        stream.stream.pipe(rangeStream);
        let buff: Buffer | undefined;
        try {
            buff = await streamToBufferPromise(rangeStream);
        } catch (err) {
            console.log(err);
            return 0;
        }

        const newBuff = this.innerDecrypt(buff);

        const size = stream.length - AES_BLOCK_SIZE - ((AES_BLOCK_SIZE - newBuff.length) % AES_BLOCK_SIZE);
        return Promise.resolve(size);
    }

    public async getDecryptedSizeBuffer(_publication: Publication, _link: Link, data: Buffer): Promise<number> {

        const totalByteLength = data.length;

        const twoBlocks = 2 * AES_BLOCK_SIZE;
        if (totalByteLength < twoBlocks) {
            return 0;
        }
        const readPos = totalByteLength - twoBlocks;

        const buff = data.slice(readPos, readPos + twoBlocks);

        const newBuff = this.innerDecrypt(buff);

        const size = totalByteLength - AES_BLOCK_SIZE - ((AES_BLOCK_SIZE - newBuff.length) % AES_BLOCK_SIZE);
        return size;
    }

    public async transformStream(
        publication: Publication, link: Link,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number): Promise<IStreamAndLength> {

        if (!isPartialByteRangeRequest) {
            return this.transformStream_(
                publication, link,
                stream,
                isPartialByteRangeRequest,
                partialByteBegin, partialByteEnd);
        }

        debug("LCP transformStream() RAW STREAM LENGTH: " + stream.length);

        let plainTextSize = -1;
        if (link.Properties.Encrypted.DecryptedLengthBeforeInflate > 0) {
            plainTextSize = link.Properties.Encrypted.DecryptedLengthBeforeInflate;
        } else {
            plainTextSize = await this.getDecryptedSizeStream(publication, link, stream);
            debug("LCP getDecryptedSizeStream(): " + plainTextSize);
            stream = await stream.reset();
            // length cached to avoid resetting the stream to zero-position
            link.Properties.Encrypted.DecryptedLengthBeforeInflate = plainTextSize;
        }
        debug("LCP plainTextSize: " + plainTextSize);

        if (partialByteBegin < 0) {
            partialByteBegin = 0;
        }

        if (partialByteEnd < 0) {
            partialByteEnd = plainTextSize;
            if (link.Properties.Encrypted.OriginalLength) {
                partialByteEnd = link.Properties.Encrypted.OriginalLength - 1;
            }
        }

        const partialByteLength = partialByteEnd - partialByteBegin;

        // Get offset result offset in the block
        const blockOffset = partialByteBegin % AES_BLOCK_SIZE;
        // For beginning of the cipher text, IV used for XOR
        // For cipher text in the middle, previous block used for XOR
        const readPosition = partialByteBegin - blockOffset;

        // Count blocks to read
        // First block for IV or previous block to perform XOR
        let blocksCount = 1;
        let bytesInFirstBlock = (AES_BLOCK_SIZE - blockOffset) % AES_BLOCK_SIZE;
        if (partialByteLength < bytesInFirstBlock) {
            bytesInFirstBlock = 0;
        }
        if (bytesInFirstBlock > 0) {
            blocksCount++;
        }

        blocksCount += (partialByteLength - bytesInFirstBlock) / AES_BLOCK_SIZE;
        if ((partialByteLength - bytesInFirstBlock) % AES_BLOCK_SIZE !== 0) {
            blocksCount++;
        }

        // Figure out what block padding scheme to use
        let padding = false; // NO_PADDING
        const sizeWithoutPaddedBlock = plainTextSize - (plainTextSize % AES_BLOCK_SIZE);
        if (partialByteEnd > sizeWithoutPaddedBlock) {
            padding = true; // W3C_PADDING, also PKCS#7
        }

        const toRead = blocksCount * AES_BLOCK_SIZE;
        const rangeStream = new RangeStream(readPosition, readPosition + toRead - 1, stream.length);
        stream.stream.pipe(rangeStream);
        let buff: Buffer | undefined;
        try {
            buff = await streamToBufferPromise(rangeStream);
        } catch (err) {
            console.log(err);
            return Promise.reject("OUCH!");
        }

        let newBuff = this.innerDecrypt(buff);
        if (newBuff.length < partialByteLength) {
            debug("newBuff.length < partialByteLength");
        }
        newBuff = newBuff.slice(blockOffset);
        const bufferStream = bufferToStream(newBuff);

        const sal: IStreamAndLength = {
            length: newBuff.length,
            reset: async () => {
                const resetedStream = await stream.reset();
                return this.transformStream(
                    publication, link,
                    resetedStream,
                    isPartialByteRangeRequest,
                    partialByteBegin, partialByteEnd);
            },
            stream: bufferStream,
        };
        return Promise.resolve(sal);
    }

    public async transformStream_(
        publication: Publication, link: Link,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number): Promise<IStreamAndLength> {

        debug("LCP transformStream() RAW STREAM LENGTH: " + stream.length);

        let l = -1;
        if (link.Properties.Encrypted.DecryptedLengthBeforeInflate > 0) {
            l = link.Properties.Encrypted.DecryptedLengthBeforeInflate;
        } else {
            l = await this.getDecryptedSizeStream(publication, link, stream);
            debug("LCP getDecryptedSizeStream(): " + l);
            stream = await stream.reset();
            // length cached to avoid resetting the stream to zero-position
            link.Properties.Encrypted.DecryptedLengthBeforeInflate = l;
        }

        const data = await streamToBufferPromise(stream.stream);
        debug("LCP transformStream() RAW BUFFER LENGTH after reset: " + stream.length);
        const buff = await this.transformBuffer(publication, link, data);
        debug("LCP transformStream() DECRYPTED BUFFER LENGTH: " + buff.length);

        if (partialByteBegin < 0) {
            partialByteBegin = 0;
        }
        if (partialByteEnd < 0) {
            partialByteEnd = buff.length - 1;
        }

        if (isPartialByteRangeRequest) {
            debug("LCP transformStream() PARTIAL: " + partialByteBegin + " - " + partialByteEnd);

            const rangeStream = new RangeStream(partialByteBegin, partialByteEnd, buff.length);
            const bufferStream = bufferToStream(buff);
            bufferStream.pipe(rangeStream);

            const sal: IStreamAndLength = {
                length: buff.length, // (partialByteEnd + 1) - partialByteBegin,
                reset: async () => {
                    const resetedStream = await stream.reset();
                    return this.transformStream(
                        publication, link,
                        resetedStream,
                        isPartialByteRangeRequest,
                        partialByteBegin, partialByteEnd);
                },
                stream: rangeStream,
            };
            return Promise.resolve(sal);
        } else {
            debug("LCP transformStream() WHOLE: " + buff.length);

            const sal: IStreamAndLength = {
                length: buff.length,
                reset: async () => {
                    return Promise.resolve(sal);
                },
                stream: bufferToStream(buff),
            };
            return Promise.resolve(sal);
        }
    }

    public innerDecrypt(data: Buffer): Buffer {

        const iv = data.slice(0, AES_BLOCK_SIZE).toString("binary");
        const toDecrypt =
            forge.util.createBuffer(data.slice(AES_BLOCK_SIZE).toString("binary"), "binary");
        // const toDecrypt = aesCbcCipher.output;
        const aesCbcDecipher = (forge as any).cipher.createDecipher("AES-CBC", this.contentKey);
        aesCbcDecipher.start({ iv, additionalData_: "binary-encoded string" });
        aesCbcDecipher.update(toDecrypt);
        aesCbcDecipher.finish();

        const decryptedZipData = aesCbcDecipher.output.bytes();

        return new Buffer(decryptedZipData, "binary");
    }

    public async transformBuffer(_publication: Publication, link: Link, data: Buffer): Promise<Buffer> {

        let transformedData = this.innerDecrypt(data);

        debug("LCP transformBuffer() decrypted buffer length: " + transformedData.length);

        const l = await this.getDecryptedSizeBuffer(_publication, link, data);
        debug("LCP transformBuffer() decrypted buffer length CHECK: " + l);

        if (link.Properties.Encrypted.Compression === "deflate") {
            transformedData = zlib.inflateRawSync(transformedData);
        }

        debug("LCP transformBuffer() decrypted buffer length after INFLATE: " + transformedData.length);

        if (link.Properties.Encrypted.OriginalLength
            && link.Properties.Encrypted.OriginalLength !== transformedData.length) {
            debug(`LENGTH NOT MATCH ${link.Properties.Encrypted.OriginalLength} !== ${transformedData.length}`);
        }

        return Promise.resolve(transformedData);
    }

    private UpdateLCP(publication: Publication, lcpPassHash: string): string | undefined {

        if (!publication.LCP) {
            return undefined;
        }

        const userKey = forge.util.hexToBytes(lcpPassHash);

        // let userKey: string | undefined;
        // const lcpPass = this.Internal.find((i) => {
        //     if (i.Name === "lcp_user_pass_hash") {
        //         return true;
        //     }
        //     return false;
        // });

        // if (lcpPass) {
        //     userKey = lcpPass.Value; // basic profile: user passphrase SHA256 hash digest
        // }
        // else {
        //     const userPassPhrase = "dan"; // testing with my own WasteLand sample (LCP basic profile)
        //     const sha256 = forge.md.sha256.create();
        //     sha256.update(userPassPhrase, "utf8");
        //     const digest = sha256.digest();
        //     userKey = digest.bytes(); // 32 bytes => AES-256 key
        //     // publication.AddToInternal("lcp_user_key", userKey);
        //     // console.log("---LCP user key == passphrase + SHA256 digest HEX: "
        //     //     + digest.toHex() + " // " + userKey.length);
        // }
        if (userKey
            && publication.LCP.Encryption.UserKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#sha256"
            && publication.LCP.Encryption.Profile === "http://readium.org/lcp/basic-profile"
            && publication.LCP.Encryption.ContentKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc") {

            try {
                // publication.AddToInternal("lcp_id", lcp.ID);
                // publication.AddToInternal("lcp_content_key_algorithm", lcp.Encryption.ContentKey.Algorithm);
                // publication.AddToInternal("lcp_user_hint", lcp.Encryption.UserKey.TextHint);

                const keyCheck = new Buffer(publication.LCP.Encryption.UserKey.KeyCheck, "base64").toString("binary");
                // const keyCheck_ = forge.util.decode64(lcp.Encryption.UserKey.KeyCheck);
                // if (keyCheck !== keyCheck_) {
                //     console.log(`ERROR LCP.Encryption.UserKey.KeyCheck base64: ${keyCheck} !== ${keyCheck_}`);
                // }
                // publication.AddToInternal("lcp_user_key_check", keyCheck);
                // console.log("---LCP Encryption.UserKey.KeyCheck BASE64 decoded (forge BYTES TO HEX): "
                //     + forge.util.bytesToHex(keyCheck));

                const encryptedLicenseID = keyCheck;

                const iv = encryptedLicenseID.substring(0, AES_BLOCK_SIZE);

                // console.log("=============== LCP ID");
                // console.log(lcp.ID);
                // const lcpIDbuff = forge.util.createBuffer(lcp.ID, "utf8");
                // console.log(lcpIDbuff.toHex());
                // console.log(lcpIDbuff.toString());
                // console.log(lcpIDbuff.bytes());

                // const aesCbcCipher = (forge as any).cipher.createCipher("AES-CBC", userKey);
                // aesCbcCipher.start({ iv, additionalData_: "binary-encoded string" });
                // aesCbcCipher.update(lcpIDbuff);
                // aesCbcCipher.finish();
                // console.log("=============== LCP CYPHER");
                // // breakLength: 100  maxArrayLength: undefined
                // console.log(util.inspect(aesCbcCipher.output,
                //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
                // console.log(aesCbcCipher.output.bytes());
                // console.log(aesCbcCipher.output.toHex());
                // // console.log(aesCbcCipher.output.toString());

                const toDecrypt = forge.util.createBuffer(encryptedLicenseID.substring(AES_BLOCK_SIZE), "binary");
                // const toDecrypt = aesCbcCipher.output;
                const aesCbcDecipher = (forge as any).cipher.createDecipher("AES-CBC", userKey);
                aesCbcDecipher.start({ iv, additionalData_: "binary-encoded string" });
                aesCbcDecipher.update(toDecrypt);
                aesCbcDecipher.finish();
                // console.log("=============== LCP DECYPHER");
                // // breakLength: 100  maxArrayLength: undefined
                // console.log(util.inspect(aesCbcDecipher.output,
                //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
                // console.log(aesCbcDecipher.output.bytes());
                // console.log(aesCbcDecipher.output.toHex());
                // // console.log(aesCbcDecipher.output.toString());

                if (publication.LCP.ID === aesCbcDecipher.output.toString()) {
                    const encryptedContentKey =
                        new Buffer(publication.LCP.Encryption.ContentKey.EncryptedValue, "base64").toString("binary");

                    const iv2 = encryptedContentKey.substring(0, AES_BLOCK_SIZE);
                    const toDecrypt2 =
                        forge.util.createBuffer(encryptedContentKey.substring(AES_BLOCK_SIZE), "binary");
                    // const toDecrypt = aesCbcCipher.output;
                    const aesCbcDecipher2 = (forge as any).cipher.createDecipher("AES-CBC", userKey);
                    aesCbcDecipher2.start({ iv: iv2, additionalData_: "binary-encoded string" });
                    aesCbcDecipher2.update(toDecrypt2);
                    aesCbcDecipher2.finish();

                    const contentKey = aesCbcDecipher2.output.bytes();
                    // this.AddToInternal("lcp_content_key", contentKey);

                    return contentKey;
                }
            } catch (err) {
                console.log("LCP error! " + err);
            }
        }

        return undefined;
    }
}
