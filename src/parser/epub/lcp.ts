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

    // JS impl
    public ContentKey: Buffer | undefined;

    // Native impl
    private _usesNativeNodePlugin: boolean | undefined = undefined;
    private _lcpNative: any | undefined;
    private _lcpContext: any | undefined;

    private userPassphraseHex: string | undefined;

    public isNativeNodePlugin() {
        this.init();
        return _usesNativeNodePlugin;
    }

    public init() {

        this.ContentKey = undefined;
        this._lcpContext = undefined;

        if (typeof this._usesNativeNodePlugin !== "undefined") {
            return;
        }

        const lcpNodeFilePath = path.join(process.cwd(), "LCP/lcp.node");
        console.log(lcpNodeFilePath);

        if (fs.existsSync(lcpNodeFilePath)) {
            console.log("LCP _usesNativeNodePlugin");
            this._usesNativeNodePlugin = true;
            this._lcpNative = bind({
                bindings: "lcp.node",
                try: [[
                "module_root",
                "LCP",
                "bindings",
                ]],
            });
        } else {
            console.log("LCP JS impl");
            this._usesNativeNodePlugin = false;
            this._lcpNative = undefined;
        }
    }

    public async setUserPassphrase(pass: string): Promise<boolean> {

        this.init();

        this.userPassphraseHex = pass;

        const check = this.Encryption.Profile === "http://readium.org/lcp/basic-profile"
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
                this._lcpNative.createContext(
                    this.JsonSource,
                    this.userPassphraseHex,
                    DUMMY_CRL,
                    (erro: any, context: any) => {
                        if (erro) {
                            debug(erro);
                            resolve(false);
                            return;
                        }

                        debug(context);

                        this._lcpNative.findOneValidPassphrase(
                            this.JsonSource,
                            [this.userPassphraseHex],
                            (err: any, validHashedPassphrase: any) => {
                                debug(err, validHashedPassphrase, this.userPassphraseHex);
                                if (err) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            },
                        );

                        // this._lcpNative.decrypt(context, encryptedContent, (err, decryptedContent) => {
                        // });
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
            //     console.log(`ERROR LCP.Encryption.UserKey.KeyCheck base64: ${keyCheck} !== ${keyCheck_}`);
            // }
            // publication.AddToInternal("lcp_user_key_check", keyCheck);
            // console.log("---LCP Encryption.UserKey.KeyCheck BASE64 decoded (forge BYTES TO HEX): "
            //     + forge.util.bytesToHex(keyCheck));

            const encryptedLicenseID = keyCheck;

            // const iv = encryptedLicenseID.substring(0, AES_BLOCK_SIZE);
            const iv = encryptedLicenseID.slice(0, AES_BLOCK_SIZE);

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

            // // console.log("=============== LCP DECYPHER");
            // // // breakLength: 100  maxArrayLength: undefined
            // // console.log(util.inspect(aesCbcDecipher.output,
            // //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
            // // console.log(aesCbcDecipher.output.bytes());
            // // console.log(aesCbcDecipher.output.toHex());
            // // // console.log(aesCbcDecipher.output.toString());
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
            //     // console.log("---LCP user key == passphrase + SHA256 digest HEX: "
            //     //     + digest.toHex() + " // " + userKey.length);
            // }
        }

        return true;
        // return Promise.resolve(true);
    }
}
