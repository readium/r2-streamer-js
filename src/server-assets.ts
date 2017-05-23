import * as crypto from "crypto";
import * as debug_ from "debug";
import * as path from "path";

import * as express from "express";
import * as mime from "mime-types";

import { parseRangeHeader } from "./_utils/http/RangeUtils";
import { streamToBufferPromise } from "./_utils/stream/BufferUtils";
import { IStreamAndLength, IZip } from "./_utils/zip/zip";
import { Link } from "./models/publication-link";
import { CbzParsePromise } from "./parser/cbz";
import { EpubParsePromise } from "./parser/epub";
import { Server } from "./server";

const debug = debug_("r2:server:assets");

export function serverAssets(server: Server, routerPathBase64: express.Router) {

    const routerAssets = express.Router({ strict: false });
    // routerAssets.use(morgan("combined"));

    routerAssets.get("/",
        async (req: express.Request, res: express.Response) => {

            if (!req.params.pathBase64) {
                req.params.pathBase64 = (req as any).pathBase64;
            }
            if (!req.params.asset) {
                req.params.asset = (req as any).asset;
            }

            // debug(req.method);
            const isHead = req.method.toLowerCase() === "head";
            if (isHead) {
                console.log("!!!!!!!!!!!!!!!!!!!");
            }

            const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

            let publication = server.cachedPublication(pathBase64Str);
            if (!publication) {

                const fileName = path.basename(pathBase64Str);
                const ext = path.extname(fileName).toLowerCase();

                try {
                    publication = ext === ".epub" ?
                        await EpubParsePromise(pathBase64Str) :
                        await CbzParsePromise(pathBase64Str);
                } catch (err) {
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }

                server.cachePublication(pathBase64Str, publication);
            }
            // dumpPublication(publication);

            if (!publication.Internal) {
                const err = "No publication internals!";
                debug(err);
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
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }
            const zip = zipInternal.Value as IZip;

            const pathInZip = req.params.asset;

            if (!zip.hasEntry(pathInZip)) {
                const err = "Asset not in zip! " + pathInZip;
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
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

            // const isVideoAudio = mediaType && (
            //     mediaType.indexOf("audio/") === 0 ||
            //     mediaType.indexOf("video/") === 0);
            // if (isVideoAudio) {
            //     debug(req.headers);
            // }

            let link: Link | undefined;

            if (publication.Resources
                && pathInZip.indexOf("META-INF/") !== 0
                && !pathInZip.endsWith(".opf")) {

                const relativePath = pathInZip;

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
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
            }

            const isEncrypted = link && link.Properties && link.Properties.Encrypted;

            const isPartialByteRangeRequest = req.headers &&
                req.headers.range; // && req.headers.range !== "bytes=0-";

            if (isEncrypted && isPartialByteRangeRequest) {
                const err = "Encrypted video/audio not supported (HTTP 206 partial request byte range)";
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }

            let partialByteBegin = -1; // inclusive boundaries
            let partialByteEnd = -1;
            if (isPartialByteRangeRequest) {
                const ranges = parseRangeHeader(req.headers.range);

                if (ranges && ranges.length) {
                    if (ranges.length > 1) {
                        const err = "Too many HTTP ranges: " + req.headers.range;
                        debug(err);
                        res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                            + err + "</p></body></html>");
                        return;
                    }
                    partialByteBegin = ranges[0].begin;
                    partialByteEnd = ranges[0].end;

                    if (partialByteBegin < 0) {
                        partialByteBegin = 0;
                    }
                }
            }

            if (partialByteBegin === 0 && partialByteEnd < 0) {
                // TODO: build partial HTTP 206 for "0-" range?
                // (instead of streaming the entire resource data into the response)
            }

            // debug(`${pathInZip} >> ${partialByteBegin}-${partialByteEnd}`);
            let zipStream_: IStreamAndLength | undefined;
            try {
                zipStream_ = isPartialByteRangeRequest ?
                    await zip.entryStreamRangePromise(pathInZip, partialByteBegin, partialByteEnd) :
                    await zip.entryStreamPromise(pathInZip);
            } catch (err) {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }
            const zipStream = zipStream_.stream;
            const totalByteLength = zipStream_.length;
            // debug(`${totalByteLength} total stream bytes`);

            if (partialByteEnd < 0) {
                partialByteEnd = totalByteLength - 1;
            }

            const partialByteLength = isPartialByteRangeRequest ?
                partialByteEnd - partialByteBegin + 1 :
                totalByteLength;

            let zipData: Buffer | undefined;
            if (!isHead && (isEncrypted || (req.query.show && isText))) {
                try {
                    zipData = await streamToBufferPromise(zipStream);
                } catch (err) {
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
                // debug(`${zipData.length} buffer bytes`);
            }

            // TODO: isHead for encrypted Content-Length
            if (zipData && isEncrypted && link) {
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

                    const err = "LCP encryption not supported.";
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
            }

            if (req.query.show) {
                res.status(200).send("<html><body>" +
                    "<h1>" + path.basename(pathBase64Str) + "</h1>" +
                    "<h2>" + mediaType + "</h2>" +
                    ((isText && zipData) ?
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

                if (mediaType) {
                    res.set("Content-Type", mediaType);
                    // res.type(mediaType);
                }

                res.setHeader("Accept-Ranges", "bytes");

                if (isPartialByteRangeRequest) {
                    // res.setHeader("Connection", "close");
                    // res.setHeader("Transfer-Encoding", "chunked");
                    res.setHeader("Content-Length", `${partialByteLength}`);
                    const rangeHeader = `bytes ${partialByteBegin}-${partialByteEnd}/${totalByteLength}`;
                    // debug("+++>" + rangeHeader);
                    res.setHeader("Content-Range", rangeHeader);
                    res.status(206);
                } else {
                    res.setHeader("Content-Length", `${totalByteLength}`);
                    res.status(200);
                }

                if (isHead) {
                    res.end();
                } else {
                    if (zipData) {
                        res.send(zipData);

                        // if (isText) {
                        //     res.send(zipData.toString("utf8"));
                        // } else {
                        //     res.end(zipData, "binary");
                        // }
                    } else {
                        zipStream.pipe(res);
                    }
                }
            }
        });

    routerPathBase64.param("asset", (req, _res, next, value, _name) => {
        (req as any).asset = value;
        next();
    });

    routerPathBase64.use("/:pathBase64/:asset(*)", routerAssets);
}
