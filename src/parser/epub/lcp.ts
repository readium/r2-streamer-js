import * as bind from "bindings";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import * as debug_ from "debug";
// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
} from "ta-json";

import { DUMMY_CRL } from "./lcp-certificate";
import { Encryption } from "./lcp-encryption";
import { Link } from "./lcp-link";
import { Rights } from "./lcp-rights";
import { Signature } from "./lcp-signature";
import { User } from "./lcp-user";

const AES_BLOCK_SIZE = 16;

const debug = debug_("r2:publication:lcp");

let LCP_NATIVE_PLUGIN_PATH = path.join(process.cwd(), "LCP", "lcp.node");
export function setLcpNativePluginPath(filepath: string): boolean {
    LCP_NATIVE_PLUGIN_PATH = filepath;
    debug(LCP_NATIVE_PLUGIN_PATH);

    const exists = fs.existsSync(LCP_NATIVE_PLUGIN_PATH);
    debug("LCP NATIVE PLUGIN: " + (exists ? "OKAY" : "MISSING"));
    return exists;
}

@JsonObject()
export class LCP {
    @JsonProperty("id")
    public ID: string;

    @JsonProperty("provider")
    public Provider: string;

    @JsonProperty("issued")
    public Issued: Date;

    @JsonProperty("updated")
    public Updated: Date;

    @JsonProperty("encryption")
    public Encryption: Encryption;

    @JsonProperty("rights")
    public Rights: Rights;

    @JsonProperty("user")
    public User: User;

    @JsonProperty("signature")
    public Signature: Signature;

    @JsonProperty("links")
    @JsonElementType(Link)
    public Links: Link[];

    public ZipPath: string;
    public JsonSource: string;

    public LSDJson: any;

    // JS impl
    public ContentKey: Buffer | undefined;

    // Native impl
    private _usesNativeNodePlugin: boolean | undefined = undefined;
    private _lcpNative: any | undefined;
    private _lcpContext: any | undefined;

    private userPassphraseHex: string | undefined;

    public isNativeNodePlugin(): boolean {
        this.init();
        return this._usesNativeNodePlugin as boolean;
    }

    public isReady(): boolean {
        if (this.isNativeNodePlugin()) {
            return typeof this._lcpContext !== "undefined";
        }
        return typeof this.ContentKey !== "undefined";
    }

    public init() {

        if (typeof this._usesNativeNodePlugin !== "undefined") {
            return;
        }

        this.ContentKey = undefined;
        this._lcpContext = undefined;

        if (fs.existsSync(LCP_NATIVE_PLUGIN_PATH)) {
            debug("LCP _usesNativeNodePlugin");
            const filePath = path.dirname(LCP_NATIVE_PLUGIN_PATH);
            const fileName = path.basename(LCP_NATIVE_PLUGIN_PATH);
            debug(filePath);
            debug(fileName);
            this._usesNativeNodePlugin = true;
            this._lcpNative = bind({
                bindings: fileName,
                module_root: filePath,
                try: [[
                    "module_root",
                    "bindings",
                ]],
            });
        } else {
            debug("LCP JS impl");
            this._usesNativeNodePlugin = false;
            this._lcpNative = undefined;
        }
    }

    public async decrypt(encryptedContent: Buffer): Promise<Buffer> {
        // this.init();
        if (!this.isNativeNodePlugin()) {
            return Promise.reject("direct decrypt buffer only for native plugin");
        }
        if (!this._lcpContext) {
            return Promise.reject("LCP context not initialized (needs setUserPassphrase)");
        }

        return new Promise<Buffer>((resolve, reject) => {

            this._lcpNative.decrypt(
                this._lcpContext,
                encryptedContent,
                (er: any, decryptedContent: any) => {
                    if (er) {
                        debug(er);
                        reject(er);
                        return;
                    }
                    const padding = decryptedContent[decryptedContent.length - 1];
                    // debug(padding);
                    // const buff = Buffer.from(
                    //     decryptedContent,
                    //     0,
                    //     decryptedContent.length - padding);
                    const buff = decryptedContent.slice(0, decryptedContent.length - padding);
                    resolve(buff);
                },
            );
        });
    }

    public async setUserPassphrase(pass: string): Promise<boolean> {
        this.init();

        this.userPassphraseHex = pass;
        // debug(this.userPassphraseHex);
        if (!this.userPassphraseHex) {
            return false;
        }

        const check = (this.Encryption.Profile === "http://readium.org/lcp/basic-profile"
            || this.Encryption.Profile === "http://readium.org/lcp/profile-1.0")
            && this.Encryption.UserKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#sha256"
            && this.Encryption.ContentKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc"
            ;
        if (!check) {
            debug("Incorrect LCP fields.");
            debug(this.Encryption.Profile);
            debug(this.Encryption.ContentKey.Algorithm);
            debug(this.Encryption.UserKey.Algorithm);

            return false;
            // return Promise.resolve(false);
        }

        if (this._usesNativeNodePlugin) {

            return new Promise<boolean>((resolve, _reject) => {

                this._lcpNative.findOneValidPassphrase(
                    this.JsonSource,
                    [this.userPassphraseHex],
                    (err: any, validHashedPassphrase: any) => {
                        if (err) {
                            debug(err);
                            resolve(false);
                        } else {
                            // debug(validHashedPassphrase);
                            // resolve(true);

                            this._lcpNative.createContext(
                                this.JsonSource,
                                validHashedPassphrase,
                                DUMMY_CRL,
                                (erro: any, context: any) => {
                                    if (erro) {
                                        debug(erro);
                                        resolve(false);
                                        return;
                                    }

                                    // debug(context);
                                    this._lcpContext = context;

                                    // const userKey = new Buffer(this.userPassphraseHex as string, "hex");
                                    // const buff = new Buffer(context.encryptedContentKey, "hex");
                                    // const iv = buff.slice(0, AES_BLOCK_SIZE);
                                    // const encrypted = buff.slice(AES_BLOCK_SIZE);
                                    // const decryptStream = crypto.createDecipheriv("aes-256-cbc",
                                    //     userKey,
                                    //     iv);
                                    // decryptStream.setAutoPadding(false);
                                    // const decryptedContent = decryptStream.update(encrypted);
                                    // const nPadding = decryptedContent[decryptedContent.length - 1];
                                    // const size = decryptedContent.length - nPadding;
                                    // this.ContentKey = decryptedContent.slice(0, size); // .toString("binary");

                                    // this._lcpNative.decrypt(
                                    //     context,
                                    //     buff,
                                    //     (er: any, decryptedContent: any) => {
                                    //         if (er) {
                                    //             debug(er);
                                    //             resolve(false);
                                    //             return;
                                    //         }
                                    //         const padding = decryptedContent[decryptedContent.length - 1];
                                    //         this.ContentKey = Buffer.from(
                                    //             decryptedContent,
                                    //             0,
                                    //             decryptedContent.length - padding);
                                    //         resolve(true);
                                    //     },
                                    // );

                                    resolve(true);
                                },
                            );
                        }
                    },
                );
            });
        } else {
            // const userKey = forge.util.hexToBytes(passPhrase);
            const userKey = new Buffer(this.userPassphraseHex, "hex");

            const keyCheck = new Buffer(this.Encryption.UserKey.KeyCheck, "base64");
            // .toString("binary");

            // const keyCheck_ = forge.util.decode64(lcp.Encryption.UserKey.KeyCheck);
            // if (keyCheck !== keyCheck_) {
            //     debug(`ERROR LCP.Encryption.UserKey.KeyCheck base64: ${keyCheck} !== ${keyCheck_}`);
            // }
            // publication.AddToInternal("lcp_user_key_check", keyCheck);
            // debug("---LCP Encryption.UserKey.KeyCheck BASE64 decoded (forge BYTES TO HEX): "
            //     + forge.util.bytesToHex(keyCheck));

            const encryptedLicenseID = keyCheck;

            // const iv = encryptedLicenseID.substring(0, AES_BLOCK_SIZE);
            const iv = encryptedLicenseID.slice(0, AES_BLOCK_SIZE);

            // debug("=============== LCP ID");
            // debug(lcp.ID);
            // const lcpIDbuff = forge.util.createBuffer(lcp.ID, "utf8");
            // debug(lcpIDbuff.toHex());
            // debug(lcpIDbuff.toString());
            // debug(lcpIDbuff.bytes());

            // const aesCbcCipher = (forge as any).cipher.createCipher("AES-CBC", userKey);
            // aesCbcCipher.start({ iv, additionalData_: "binary-encoded string" });
            // aesCbcCipher.update(lcpIDbuff);
            // aesCbcCipher.finish();
            // debug("=============== LCP CYPHER");
            // // breakLength: 100  maxArrayLength: undefined
            // console.log(util.inspect(aesCbcCipher.output,
            //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
            // debug(aesCbcCipher.output.bytes());
            // debug(aesCbcCipher.output.toHex());
            // // debug(aesCbcCipher.output.toString());

            const encrypted = encryptedLicenseID.slice(AES_BLOCK_SIZE);

            const decrypteds: Buffer[] = [];
            const decryptStream = crypto.createDecipheriv("aes-256-cbc",
                userKey,
                iv);
            decryptStream.setAutoPadding(false);
            const buff1 = decryptStream.update(encrypted);
            // debug(buff1.toString("hex"));
            if (buff1) {
                decrypteds.push(buff1);
            }
            const buff2 = decryptStream.final();
            // debug(buff2.toString("hex"));
            if (buff2) {
                decrypteds.push(buff2);
            }
            const decrypted = Buffer.concat(decrypteds);

            const nPaddingBytes = decrypted[decrypted.length - 1];
            const size = encrypted.length - nPaddingBytes;

            const decryptedOut = decrypted.slice(0, size).toString("utf8");

            // const encrypted = encryptedLicenseID.substring(AES_BLOCK_SIZE);
            // const toDecrypt = forge.util.createBuffer(encrypted, "binary");
            // // const toDecrypt = aesCbcCipher.output;
            // const aesCbcDecipher = (forge as any).cipher.createDecipher("AES-CBC", userKey);
            // aesCbcDecipher.start({ iv, additionalData_: "binary-encoded string" });
            // aesCbcDecipher.update(toDecrypt);
            // aesCbcDecipher.finish();

            // // debug("=============== LCP DECYPHER");
            // // // breakLength: 100  maxArrayLength: undefined
            // // console.log(util.inspect(aesCbcDecipher.output,
            // //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
            // // debug(aesCbcDecipher.output.bytes());
            // // debug(aesCbcDecipher.output.toHex());
            // // // debug(aesCbcDecipher.output.toString());
            // const decryptedOut = aesCbcDecipher.output.toString();

            if (this.ID !== decryptedOut) {
                debug("Failed LCP ID check.");

                return false;
                // return Promise.resolve(false);
            }

            const encryptedContentKey =
                new Buffer(this.Encryption.ContentKey.EncryptedValue, "base64");
            // .toString("binary");

            // const iv2 = encryptedContentKey.substring(0, AES_BLOCK_SIZE);
            const iv2 = encryptedContentKey.slice(0, AES_BLOCK_SIZE);

            const encrypted2 = encryptedContentKey.slice(AES_BLOCK_SIZE);

            const decrypteds2: Buffer[] = [];
            const decryptStream2 = crypto.createDecipheriv("aes-256-cbc",
                userKey,
                iv2);
            decryptStream2.setAutoPadding(false);
            const buff1_ = decryptStream2.update(encrypted2);
            // debug(buff1.toString("hex"));
            if (buff1_) {
                decrypteds2.push(buff1_);
            }
            const buff2_ = decryptStream2.final();
            // debug(buff2.toString("hex"));
            if (buff2_) {
                decrypteds2.push(buff2_);
            }
            const decrypted2 = Buffer.concat(decrypteds2);

            const nPaddingBytes2 = decrypted2[decrypted2.length - 1];
            const size2 = encrypted2.length - nPaddingBytes2;

            this.ContentKey = decrypted2.slice(0, size2); // .toString("binary");

            // const encrypted2 = encryptedContentKey.substring(AES_BLOCK_SIZE);
            // const toDecrypt2 =
            //     forge.util.createBuffer(encrypted2, "binary");
            // // const toDecrypt = aesCbcCipher.output;
            // const aesCbcDecipher2 = (forge as any).cipher.createDecipher("AES-CBC", userKey);
            // aesCbcDecipher2.start({ iv: iv2, additionalData_: "binary-encoded string" });
            // aesCbcDecipher2.update(toDecrypt2);
            // aesCbcDecipher2.finish();
            // const contentKey = new Buffer(aesCbcDecipher2.output.bytes());

            // let userKey: string | undefined;
            // const lcpPass = this.findFromInternal("lcp_user_pass_hash");

            // if (lcpPass) {
            //     userKey = lcpPass.Value; // basic profile: user passphrase SHA256 hash digest
            // } else {
            //     const userPassPhrase = "dan"; // testing with my own WasteLand sample (LCP basic profile)
            //     const sha256 = forge.md.sha256.create();
            //     sha256.update(userPassPhrase, "utf8");
            //     const digest = sha256.digest();
            //     userKey = digest.bytes(); // 32 bytes => AES-256 key
            //     // publication.AddToInternal("lcp_user_key", userKey);
            //     // debug("---LCP user key == passphrase + SHA256 digest HEX: "
            //     //     + digest.toHex() + " // " + userKey.length);
            // }
        }

        return true;
        // return Promise.resolve(true);
    }
}
