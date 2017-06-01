import * as forge from "node-forge";
// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { LCP } from "../parser/epub/lcp";
import { IInternal } from "./internal";
import { MediaOverlayNode } from "./media-overlay";
import { Metadata } from "./metadata";
import { IPublicationCollection } from "./publication-collection";
import { Link } from "./publication-link";

@JsonObject()
export class Publication {

    @JsonProperty("@context")
    @JsonElementType(String)
    public Context: string[];

    @JsonProperty("metadata")
    public Metadata: Metadata;

    @JsonProperty("links")
    @JsonElementType(Link)
    public Links: Link[];

    @JsonProperty("spine")
    @JsonElementType(Link)
    public Spine: Link[];

    @JsonProperty("resources")
    @JsonElementType(Link)
    public Resources: Link[];

    @JsonProperty("toc")
    @JsonElementType(Link)
    public TOC: Link[];

    @JsonProperty("page-list")
    @JsonElementType(Link)
    public PageList: Link[];

    @JsonProperty("landmarks")
    @JsonElementType(Link)
    public Landmarks: Link[];

    @JsonProperty("loi")
    @JsonElementType(Link)
    public LOI: Link[];

    @JsonProperty("loa")
    @JsonElementType(Link)
    public LOA: Link[];

    @JsonProperty("lov")
    @JsonElementType(Link)
    public LOV: Link[];

    @JsonProperty("lot")
    @JsonElementType(Link)
    public LOT: Link[];

    // OPDS2
    @JsonProperty("images")
    @JsonElementType(Link)
    public Images: Link[];

    public OtherLinks: Link[];
    public OtherCollections: IPublicationCollection[];

    public LCP: LCP;

    public Internal: IInternal[];

    public UpdateLCP(lcpPassHash: string): string | undefined {

        if (!this.LCP) {
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
            && this.LCP.Encryption.UserKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#sha256"
            && this.LCP.Encryption.Profile === "http://readium.org/lcp/basic-profile"
            && this.LCP.Encryption.ContentKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc") {

            try {
                // publication.AddToInternal("lcp_id", lcp.ID);
                // publication.AddToInternal("lcp_content_key_algorithm", lcp.Encryption.ContentKey.Algorithm);
                // publication.AddToInternal("lcp_user_hint", lcp.Encryption.UserKey.TextHint);

                const keyCheck = new Buffer(this.LCP.Encryption.UserKey.KeyCheck, "base64").toString("binary");
                // const keyCheck_ = forge.util.decode64(lcp.Encryption.UserKey.KeyCheck);
                // if (keyCheck !== keyCheck_) {
                //     console.log(`ERROR LCP.Encryption.UserKey.KeyCheck base64: ${keyCheck} !== ${keyCheck_}`);
                // }
                // publication.AddToInternal("lcp_user_key_check", keyCheck);
                // console.log("---LCP Encryption.UserKey.KeyCheck BASE64 decoded (forge BYTES TO HEX): "
                //     + forge.util.bytesToHex(keyCheck));

                const encryptedLicenseID = keyCheck;

                const AES_BLOCK_SIZE = 16;
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

                if (this.LCP.ID === aesCbcDecipher.output.toString()) {
                    const encryptedContentKey =
                        new Buffer(this.LCP.Encryption.ContentKey.EncryptedValue, "base64").toString("binary");

                    const iv2 = encryptedContentKey.substring(0, AES_BLOCK_SIZE);
                    const toDecrypt2 =
                        forge.util.createBuffer(encryptedContentKey.substring(AES_BLOCK_SIZE), "binary");
                    // const toDecrypt = aesCbcCipher.output;
                    const aesCbcDecipher2 = (forge as any).cipher.createDecipher("AES-CBC", userKey);
                    aesCbcDecipher2.start({ iv: iv2, additionalData_: "binary-encoded string" });
                    aesCbcDecipher2.update(toDecrypt2);
                    aesCbcDecipher2.finish();

                    const contentKey = aesCbcDecipher2.output.bytes();
                    this.AddToInternal("lcp_content_key", contentKey);

                    return contentKey;
                }
            } catch (err) {
                console.log("LCP error! " + err);
            }
        }

        return undefined;
    }

    public findFromInternal(key: string): IInternal | undefined {
        if (this.Internal) {
            const found = this.Internal.find((internal) => {
                return internal.Name === key;
            });
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    public AddToInternal(key: string, value: any) {
        if (!this.Internal) {
            this.Internal = Array<IInternal>();
        }

        const internal: IInternal = { Name: key, Value: value };

        this.Internal.push(internal);
    }

    // public findLinKByHref(href: string): Link | undefined {
    //     if (this.Spine) {
    //         const ll = this.Spine.find((link) => {
    //             if (link.Href && href.indexOf(link.Href) >= 0) {
    //                 return true;
    //             }
    //             return false;
    //         });
    //         if (ll) {
    //             return ll;
    //         }
    //     }
    //     return undefined;
    // }

    public GetCover(): Link | undefined {
        return this.searchLinkByRel("cover");
    }

    public GetNavDoc(): Link | undefined {
        return this.searchLinkByRel("contents");
    }

    public searchLinkByRel(rel: string): Link | undefined {
        if (this.Resources) {
            const ll = this.Resources.find((link) => {
                if (link.Rel) {
                    const rr = link.Rel.find((r) => {
                        if (r === rel) {
                            return true;
                        }
                        return false;
                    });
                    if (rr) {
                        return true;
                    }
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        if (this.Spine) {
            const ll = this.Spine.find((link) => {
                if (link.Rel) {
                    const rr = link.Rel.find((r) => {
                        if (r === rel) {
                            return true;
                        }
                        return false;
                    });
                    if (rr) {
                        return true;
                    }
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        if (this.Links) {
            const ll = this.Links.find((link) => {
                if (link.Rel) {
                    const rr = link.Rel.find((r) => {
                        if (r === rel) {
                            return true;
                        }
                        return false;
                    });
                    if (rr) {
                        return true;
                    }
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        return undefined;
    }

    public AddLink(typeLink: string, rel: string[], url: string, templated: boolean) {
        const link = new Link();
        link.Rel = rel;
        link.Href = url;
        link.TypeLink = typeLink;

        link.Templated = templated;

        if (!this.Links) {
            this.Links = Array<Link>();
        }
        this.Links.push(link);
    }

    public FindAllMediaOverlay(): MediaOverlayNode[] {
        const mos = Array<MediaOverlayNode>();

        if (this.Spine) {
            this.Spine.forEach((link) => {
                if (link.MediaOverlays) {
                    link.MediaOverlays.forEach((mo) => {
                        mos.push(mo);
                    });
                }
            });
        }

        return mos;
    }

    public FindMediaOverlayByHref(href: string): MediaOverlayNode[] {
        const mos = Array<MediaOverlayNode>();

        if (this.Spine) {
            this.Spine.forEach((link) => {
                if (link.MediaOverlays && link.Href.indexOf(href) >= 0) {
                    link.MediaOverlays.forEach((mo) => {
                        mos.push(mo);
                    });
                }
            });
        }

        return mos;
    }

    public GetPreFetchResources(): Link[] {
        const links = Array<Link>();

        if (this.Resources) {
            const mediaTypes = ["text/css", "application/vnd.ms-opentype", "text/javascript"];

            this.Resources.forEach((link) => {
                mediaTypes.forEach((mediaType) => {
                    if (link.TypeLink === mediaType) {
                        links.push(link);
                    }
                });
            });
        }

        return links;
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("Publication.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("Publication.Links is not set!");
        }
        if (!this.Spine) {
            console.log("Publication.Spine is not set!");
        }
    }
}
