import * as crypto from "crypto";
import * as zlib from "zlib";

import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { streamToBufferPromise } from "@utils/stream/BufferUtils";
import { RangeStream } from "@utils/stream/RangeStream";
import { IStreamAndLength } from "@utils/zip/zip";
import * as debug_ from "debug";
import * as forge from "node-forge";

import { ITransformer } from "./transformer";

// import { CounterPassThroughStream } from "@utils/stream/CounterPassThroughStream";
// import { Transform } from "stream";

const debug = debug_("r2:transformer:lcp");
// const debugx = debug_("r2:transformer:stream:lcp");

const AES_BLOCK_SIZE = 16;

// let streamCounter = 0;

export interface ICryptoInfo {
    length: number;
    padding: number;
}

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

    public async transformStream(
        publication: Publication,
        link: Link,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number,
        partialByteEnd: number): Promise<IStreamAndLength> {

        let cryptoInfo: ICryptoInfo | undefined;
        let plainTextSize = -1;
        let cypherBlockPadding = -1;
        if (link.Properties.Encrypted.DecryptedLengthBeforeInflate > 0) {
            plainTextSize = link.Properties.Encrypted.DecryptedLengthBeforeInflate;
            cypherBlockPadding = link.Properties.Encrypted.CypherBlockPadding;
        } else {
            // const timeBegin = process.hrtime();

            cryptoInfo = await this.getDecryptedSizeStream(publication, link, stream);
            plainTextSize = cryptoInfo.length;
            cypherBlockPadding = cryptoInfo.padding;

            // length cached to avoid resetting the stream to zero-position
            link.Properties.Encrypted.DecryptedLengthBeforeInflate = plainTextSize;
            link.Properties.Encrypted.CypherBlockPadding = cypherBlockPadding;

            stream = await stream.reset();

            // const timeElapsed = process.hrtime(timeBegin);
            // debug(`LCP transformStream() ---- getDecryptedSizeStream():` +
            //     `${timeElapsed[0]} seconds + ${timeElapsed[1]} nanoseconds`);

            // debug("LCP transformStream() ---- getDecryptedSizeStream(): " + plainTextSize);

            if (link.Properties.Encrypted.OriginalLength &&
                link.Properties.Encrypted.Compression === "none" &&
                link.Properties.Encrypted.OriginalLength !== plainTextSize) {

                debug(`############### ` +
                    `LCP transformStream() LENGTH NOT MATCH ` +
                    `link.Properties.Encrypted.OriginalLength !== plainTextSize:` +
                    `${link.Properties.Encrypted.OriginalLength} !== ${plainTextSize}`);
            }
        }

        if (partialByteBegin < 0) {
            partialByteBegin = 0;
        }

        if (partialByteEnd < 0) {
            partialByteEnd = plainTextSize - 1;
            if (link.Properties.Encrypted.OriginalLength) {
                partialByteEnd = link.Properties.Encrypted.OriginalLength - 1;
            }
        }

        // const partialByteLength = (partialByteEnd + 1) - partialByteBegin;

        let ivBuffer: Buffer | undefined;
        if (link.Properties.Encrypted.CypherBlockIV) {
            ivBuffer = Buffer.from(link.Properties.Encrypted.CypherBlockIV, "binary");
        } else {
            const ivRangeStream = new RangeStream(0, AES_BLOCK_SIZE - 1, stream.length);
            stream.stream.pipe(ivRangeStream);
            try {
                ivBuffer = await streamToBufferPromise(ivRangeStream);
            } catch (err) {
                console.log(err);
                return Promise.reject("OUCH!");
            }
            stream = await stream.reset();
            link.Properties.Encrypted.CypherBlockIV = ivBuffer.toString("binary");
        }
        // debug("IV: " + forge.util.bytesToHex(ivBuffer));

        // const readStream = async (s: NodeJS.ReadableStream, n: number): Promise<Buffer> => {
        //     return new Promise<Buffer>((resolve, reject) => {
        //         s.pause();
        //         const onReadable = () => {
        //             const b = s.read(n);
        //             s.removeListener("readable", onReadable);
        //             s.removeListener("error", reject);
        //             s.resume();
        //             resolve(b as Buffer);
        //         };
        //         s.on("readable", onReadable);
        //         s.on("error", reject);
        //     });
        // };
        // const cypherRangeStream = stream.stream;
        // const firstBlockIV = await readStream(cypherRangeStream, AES_BLOCK_SIZE);
        // debug(firstBlockIV.length);

        const cypherRangeStream = new RangeStream(AES_BLOCK_SIZE, stream.length - 1, stream.length);
        stream.stream.pipe(cypherRangeStream);

        // debug(forge.util.bytesToHex(this.contentKey as string));

        const decryptStream = crypto.createDecipheriv("aes-256-cbc",
            new Buffer(this.contentKey as string, "binary"),
            ivBuffer);
        decryptStream.setAutoPadding(false);
        cypherRangeStream.pipe(decryptStream);

        let destStream: NodeJS.ReadableStream = decryptStream;

        if (cypherBlockPadding) {
            // debugx("cryptoInfo.padding: " + cypherBlockPadding);
            const cypherUnpaddedStream = new RangeStream(0, plainTextSize - 1, plainTextSize);
            destStream.pipe(cypherUnpaddedStream);
            destStream = cypherUnpaddedStream;
        }

        // const counterStream2 = new CounterPassThroughStream(++streamCounter);
        // destStream.pipe(counterStream2)
        //     .on("progress", function f() {
        //         // debug("Crypto PROGRESS: " +
        //         //     (this as CounterPassThroughStream).id +
        //         //     " -- " + (this as CounterPassThroughStream).bytesReceived);
        //     })
        //     .on("end", function f() {
        //         debug("Crypto END: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("close", function f() {
        //         debug("Crypto CLOSE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .once("finish", function f() {
        //         debug("Crypto FINISH: " +
        //             (this as CounterPassThroughStream).id +
        //             " -- " + (this as CounterPassThroughStream).bytesReceived);

        //         if (plainTextSize !==
        //             (this as CounterPassThroughStream).bytesReceived) {

        //             debug(`############### ` +
        //                 `LCP Crypto LENGTH NOT MATCH ` +
        //                 `plainTextSize !== bytesReceived:` +
        //                 `${plainTextSize} !== ` +
        //                 `${(this as CounterPassThroughStream).bytesReceived}`);
        //         }
        //     })
        //     .on("error", function f() {
        //         debug("CounterPassThroughStream ERROR: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("pipe", function f() {
        //         debug("CounterPassThroughStream PIPE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("unpipe", function f() {
        //         debug("CounterPassThroughStream UNPIPE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("drain", function f() {
        //         // debug("CounterPassThroughStream DRAIN: " +
        //         //     (this as CounterPassThroughStream).id);
        //     });
        // destStream = counterStream2;

        if (link.Properties.Encrypted.Compression === "deflate") {
            const inflateStream = zlib.createInflateRaw();
            destStream.pipe(inflateStream);
            destStream = inflateStream;

            // const counterStream = new CounterPassThroughStream(++streamCounter);
            // inflateStream.pipe(counterStream)
            //     .on("progress", function f() {
            //         // debug("CounterPassThroughStream PROGRESS: " +
            //         //     (this as CounterPassThroughStream).id +
            //         //     " -- " + (this as CounterPassThroughStream).bytesReceived);
            //     })
            //     .on("end", function f() {
            //         debug("CounterPassThroughStream END: " +
            //             (this as CounterPassThroughStream).id);
            //     })
            //     .on("close", function f() {
            //         debug("CounterPassThroughStream CLOSE: " +
            //             (this as CounterPassThroughStream).id);
            //     })
            //     .once("finish", function f() {
            //         debug("CounterPassThroughStream FINISH: " +
            //             (this as CounterPassThroughStream).id +
            //             " -- " + (this as CounterPassThroughStream).bytesReceived);

            //         if (link.Properties.Encrypted.OriginalLength &&
            //             link.Properties.Encrypted.OriginalLength !==
            //             (this as CounterPassThroughStream).bytesReceived) {

            //             debug(`############### ` +
            //                 `LCP zlib.createInflateRaw LENGTH NOT MATCH ` +
            //                 `link.Properties.Encrypted.OriginalLength !== bytesReceived:` +
            //                 `${link.Properties.Encrypted.OriginalLength} !== ` +
            //                 `${(this as CounterPassThroughStream).bytesReceived}`);
            //         }
            //     })
            //     .on("error", function f() {
            //         debug("CounterPassThroughStream ERROR: " +
            //             (this as CounterPassThroughStream).id);
            //     })
            //     .on("pipe", function f() {
            //         debug("CounterPassThroughStream PIPE: " +
            //             (this as CounterPassThroughStream).id);
            //     })
            //     .on("unpipe", function f() {
            //         debug("CounterPassThroughStream UNPIPE: " +
            //             (this as CounterPassThroughStream).id);
            //     })
            //     .on("drain", function f() {
            //         // debug("CounterPassThroughStream DRAIN: " +
            //         //     (this as CounterPassThroughStream).id);
            //     });
            // destStream = counterStream;
        }

        const l = link.Properties.Encrypted.OriginalLength ?
            link.Properties.Encrypted.OriginalLength : plainTextSize;

        if (isPartialByteRangeRequest) {
            const rangeStream = new RangeStream(partialByteBegin, partialByteEnd, l);
            destStream.pipe(rangeStream);
            destStream = rangeStream;
            // l = partialByteLength;
        }

        const sal: IStreamAndLength = {
            length: l,
            reset: async () => {
                const resetedStream = await stream.reset();
                return this.transformStream(
                    publication, link,
                    resetedStream,
                    isPartialByteRangeRequest,
                    partialByteBegin, partialByteEnd);
            },
            stream: destStream,
        };
        return Promise.resolve(sal);
    }

    protected async getDecryptedSizeStream(
        _publication: Publication, _link: Link,
        stream: IStreamAndLength): Promise<ICryptoInfo> {

        // debug("LCP getDecryptedSizeStream() stream.length: " + stream.length);

        // debug("LCP getDecryptedSizeStream() AES_BLOCK_SIZE: " + AES_BLOCK_SIZE);

        // CipherText = IV + PlainText + BLOCK - (PlainText MOD BLOCK)
        // overflow: (PlainText MOD BLOCK) === PlainText - (floor(PlainText / BLOCK) * BLOCK)
        // thus: CipherText = IV + BLOCK * (floor(PlainText / BLOCK) + 1)

        // IV = AES_BLOCK_SIZE (first block in cyphertext)
        // + at least one block
        // (last one in cyphertext is either full 16-bytes random W3C padding
        // in case plaintext is exactly multiple of block size,
        // or partial cypher + padding)
        const TWO_AES_BLOCK_SIZE = 2 * AES_BLOCK_SIZE;
        if (stream.length < TWO_AES_BLOCK_SIZE) {
            return Promise.reject("crypto err");
        }
        const readPos = stream.length - TWO_AES_BLOCK_SIZE;

        const rangeStream = new RangeStream(readPos, readPos + TWO_AES_BLOCK_SIZE - 1, stream.length);
        stream.stream.pipe(rangeStream);
        let buff: Buffer | undefined;
        try {
            buff = await streamToBufferPromise(rangeStream);
        } catch (err) {
            console.log(err);
            return Promise.reject("crypto err");
        }

        // debug("LCP getDecryptedSizeStream() buff.length: " + buff.length);

        // // debug(buff.toString("hex"));
        // for (let i = 0; i < buff.length; i++) {
        //     const b = buff[i];
        //     if (i === AES_BLOCK_SIZE) {
        //         debug("____");
        //     }
        //     debug(b);
        // }

        return this.getDecryptedSizeBuffer_(stream.length, buff);
    }

    protected innerDecrypt(data: Buffer, padding: boolean): Buffer {
        // debug("LCP innerDecrypt() data.length: " + data.length);
        // debug("LCP innerDecrypt() padding: " + padding);

        const buffIV = data.slice(0, AES_BLOCK_SIZE);
        // debug("LCP innerDecrypt() buffIV.length: " + buffIV.length);

        // TODO: keep buffer to avoid costly string conversion?
        const iv = buffIV.toString("binary");

        const buffToDecrypt = data.slice(AES_BLOCK_SIZE);
        // debug("LCP innerDecrypt() buffToDecrypt: " + buffToDecrypt.length);

        // TODO: keep buffer to avoid costly string conversion?
        const strToDecrypt = buffToDecrypt.toString("binary");
        const toDecrypt =
            forge.util.createBuffer(strToDecrypt, "binary");

        const aesCbcDecipher = (forge as any).cipher.createDecipher("AES-CBC", this.contentKey);
        aesCbcDecipher.start({ iv, additionalData_: "binary-encoded string" });
        aesCbcDecipher.update(toDecrypt);

        function unpadFunc() { return false; }
        // const res =
        aesCbcDecipher.finish(padding ? undefined : unpadFunc);
        // debug(res);

        const decryptedZipData = aesCbcDecipher.output.bytes();

        // debug(forge.util.bytesToHex(decryptedZipData));
        // debug(decryptedZipData.toHex());

        const buff = new Buffer(decryptedZipData, "binary");

        // debug("LCP innerDecrypt() buff.length: " + buff.length);

        return buff;
    }

    protected async getDecryptedSizeBuffer_(totalByteLength: number, buff: Buffer): Promise<ICryptoInfo> {

        // debug("LCP getDecryptedSizeBuffer_() totalByteLength: " + totalByteLength);

        // debug("LCP getDecryptedSizeBuffer_() buff.length: " + buff.length);

        const newBuff = this.innerDecrypt(buff, true);

        // debug("LCP getDecryptedSizeBuffer_() newBuff.length (innerDecrypt): " + newBuff.length);

        // newBuff.length === 0
        // when last second block is all padding,
        // otherwise newBuff.length === overflow encrypted bytes,
        // number between [1, AES_BLOCK_SIZE[
        const nPaddingBytes = AES_BLOCK_SIZE - newBuff.length;
        // debugx("LCP getDecryptedSizeBuffer_() nPaddingBytes: " + nPaddingBytes);

        const size = totalByteLength - AES_BLOCK_SIZE - nPaddingBytes;

        // debug("LCP getDecryptedSizeBuffer_() size: " + size);

        const res: ICryptoInfo = {
            length: size,
            padding: nPaddingBytes,
        };

        return Promise.resolve(res);
    }

    protected UpdateLCP(publication: Publication, lcpPassHash: string): string | undefined {

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

    // cc-shared-culture/EPUB/audio/asharedculture_soundtrack.mp3
    // 3265152 bytes
    // 3 MB
    // 204072 * 16 BLOCKS (inc IV)
    // 3265152 MOD 16 = 0
    // IV 16
    // PAD 16, full extra block (random)
    // + 32 = 3265184 total cypher-text

    // cc-shared-culture/EPUB/video/shared-culture.mp4
    // 21784780 bytes
    // 21 MB
    // 1361548.75 * 16 BLOCKS (inc IV)
    // 21784780 MOD 16 = 12 (0.75 * 16)
    // IV 16
    // PAD 4 (12 cypher-text bytes in last block)
    // + 20 = 21784800 total cypher-text

    // cc-shared-culture/EPUB/video/shared-culture.webm
    // 8330669 bytes
    // 8 MB
    // 520666.8125 * 16 BLOCKS (inc IV)
    // 8330669 MOD 16 = 13 (0.8125 * 16)
    // IV 16
    // PAD 3 (13 cypher-text bytes in last block)
    // + 19 = 8330688 total cypher-text
