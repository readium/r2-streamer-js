import * as crypto from "crypto";
import * as path from "path";

import * as express from "express";
import * as mime from "mime-types";

import { Link } from "./models/publication-link";
import { EpubParser } from "./parser/epub";

export function serverAssets(routerPathBase64: express.Router) {

    const routerAssets = express.Router({ strict: false });
    // routerAssets.use(morgan("combined"));

    routerAssets.get("/",
        (req: express.Request, res: express.Response) => {

            if (!req.params.pathBase64) {
                req.params.pathBase64 = (req as any).pathBase64;
            }
            if (!req.params.asset) {
                req.params.asset = (req as any).asset;
            }

            const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

            EpubParser.load(pathBase64Str)
                .then((publication) => {
                    console.log("== EpubParser: resolve");
                    // dumpPublication(publication);

                    if (!publication.Internal) {
                        const err = "No publication internals!";
                        console.log(err);
                        res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                            + err + "</p></body></html>");
                        return;
                    }

                    const zipInternal = publication.Internal.find((i) => {
                        if (i.Name === "zip") {
                            return true;
                        }
                        return false;
                    });
                    if (!zipInternal) {
                        const err = "No publication zip!";
                        console.log(err);
                        res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                            + err + "</p></body></html>");
                        return;
                    }
                    const zip = zipInternal.Value;

                    const opfInternal = publication.Internal.find((i) => {
                        if (i.Name === "rootfile") {
                            return true;
                        }
                        return false;
                    });
                    const rootfilePath = opfInternal ? opfInternal.Value as string : "EPUB/package.opf";

                    let pathInZip = req.params.asset;

                    if (Object.keys(zip.entries()).indexOf(pathInZip) < 0) {
                        // FIRST FAIL ...
                        // let's try to adjust the path, make it relative to the OPF package
                        // (support for legacy incorrect implementation)
                        pathInZip = path.join(path.dirname(rootfilePath), pathInZip)
                            .replace(/\\/g, "/");
                    }

                    if (Object.keys(zip.entries()).indexOf(pathInZip) < 0) {
                        const err = "Asset not in zip!";
                        console.log(err);
                        res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                            + err + "</p></body></html>");
                        return;
                    }

                    let link: Link | undefined;

                    if (pathInZip.indexOf("META-INF/") !== 0
                        && !pathInZip.endsWith(".opf")
                        && publication.Resources) {

                        const relativePath = path.relative(path.dirname(rootfilePath), pathInZip)
                            .replace(/\\/g, "/");

                        link = publication.Resources.find((l) => {
                            if (l.Href === relativePath) {
                                return true;
                            }
                            return false;
                        });
                        if (!link) {
                            link = publication.Spine.find((l) => {
                                if (l.Href === relativePath) {
                                    return true;
                                }
                                return false;
                            });
                        }
                        if (!link) {
                            const err = "Asset not declared in publication spine/resources!";
                            console.log(err);
                            res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                                + err + "</p></body></html>");
                            return;
                        }
                    }

                    const mediaType = mime.lookup(pathInZip);
                    const isText = mediaType && (
                        mediaType.indexOf("text/") === 0 ||
                        mediaType.indexOf("application/xhtml") === 0 ||
                        mediaType.indexOf("application/xml") === 0 ||
                        mediaType.indexOf("application/json") === 0 ||
                        mediaType.indexOf("application/svg") === 0 ||
                        mediaType.indexOf("application/smil") === 0 ||
                        mediaType.indexOf("+json") > 0 ||
                        mediaType.indexOf("+smil") > 0 ||
                        mediaType.indexOf("+svg") > 0 ||
                        mediaType.indexOf("+xhtml") > 0 ||
                        mediaType.indexOf("+xml") > 0);

                    let zipData = zip.entryDataSync(pathInZip) as Buffer;

                    if (link && link.Properties && link.Properties.Encrypted) {
                        if (link.Properties.Encrypted.Algorithm === "http://www.idpf.org/2008/embedding") {

                            let pubID = publication.Metadata.Identifier;
                            pubID = pubID.replace(/\s/g, "");

                            const checkSum = crypto.createHash("sha1");
                            checkSum.update(pubID);
                            // const hash = checkSum.digest("hex");
                            // console.log(hash);
                            const key = checkSum.digest();

                            const prefixLength = 1040;
                            const zipDataPrefix = zipData.slice(0, prefixLength);

                            for (let i = 0; i < prefixLength; i++) {
                                /* tslint:disable:no-bitwise */
                                zipDataPrefix[i] = zipDataPrefix[i] ^ (key[i % key.length]);
                            }

                            const zipDataRemainder = zipData.slice(prefixLength);
                            zipData = Buffer.concat([zipDataPrefix, zipDataRemainder]);

                        } else if (link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC") {

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
                            const zipDataPrefix = zipData.slice(0, prefixLength);

                            for (let i = 0; i < prefixLength; i++) {
                                /* tslint:disable:no-bitwise */
                                zipDataPrefix[i] = zipDataPrefix[i] ^ (key[i % key.length]);
                            }

                            const zipDataRemainder = zipData.slice(prefixLength);
                            zipData = Buffer.concat([zipDataPrefix, zipDataRemainder]);

                        } else if (link.Properties.Encrypted.Algorithm
                            === "http://www.w3.org/2001/04/xmlenc#aes256-cbc") {
                            // TODO LCP userKey --> contentKey
                        }
                    }

                    if (req.query.show) {
                        res.status(200).send("<html><body>" +
                            "<h2>" + pathBase64Str + "</h2>" +
                            "<h3>" + mediaType + "</h3>" +
                            (isText ?
                                ("<p><pre>" +
                                    zipData.toString("utf8").replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .replace(/"/g, "&quot;")
                                        .replace(/'/g, "&apos;") +
                                    "</pre></p>")
                                : "<p>BINARY</p>"
                            ) + "</body></html>");
                    } else {
                        res.setHeader("Access-Control-Allow-Origin", "*");

                        res.setHeader("Cache-Control", "public,max-age=86400");

                        // res.set("Content-Type", mediaType);
                        res.type(mediaType);

                        if (isText) {
                            res.status(200).send(zipData.toString("utf8"));
                        } else {
                            res.status(200).end(zipData, "binary");
                        }
                    }
                }).catch((err) => {
                    console.log("== EpubParser: reject");
                    console.log(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                });
        });

    routerPathBase64.param("asset", (req, _res, next, value, _name) => {
        (req as any).asset = value;
        next();
    });

    routerPathBase64.use("/:pathBase64/:asset(*)", routerAssets);
}
