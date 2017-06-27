import * as path from "path";

import { Link } from "@models/publication-link";
import { PublicationParsePromise } from "@parser/publication-parser";
import { Transformers } from "@transform/transformer";
import { parseRangeHeader } from "@utils/http/RangeUtils";
import { streamToBufferPromise } from "@utils/stream/BufferUtils";
import { IStreamAndLength, IZip } from "@utils/zip/zip";
import * as debug_ from "debug";
import * as express from "express";
import * as mime from "mime-types";

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
            if (!req.params.lcpPass64) {
                req.params.lcpPass64 = (req as any).lcpPass64;
            }

            const isShow = req.query.show;

            // debug(req.method);
            const isHead = req.method.toLowerCase() === "head";
            if (isHead) {
                console.log("HEAD !!!!!!!!!!!!!!!!!!!");
            }

            const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

            let publication = server.cachedPublication(pathBase64Str);
            if (!publication) {

                // const fileName = path.basename(pathBase64Str);
                // const ext = path.extname(fileName).toLowerCase();

                try {
                    publication = await PublicationParsePromise(pathBase64Str);
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

            let mediaType = mime.lookup(pathInZip);
            if (link && link.TypeLink) {
                mediaType = link.TypeLink;
            }

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
            if (!isHead && (isEncrypted || (isShow && isText))) {
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

                if (req.params.lcpPass64) {
                    const lcpPass = new Buffer(req.params.lcpPass64, "base64").toString("utf8");
                    publication.AddToInternal("lcp_content_key", lcpPass);
                }

                const transformedData = Transformers.try(publication, link, zipData);
                if (transformedData) {
                    zipData = transformedData;
                } else {
                    const err = "Encryption scheme not supported.";
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
            }

            if (isShow) {
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
                server.setResponseCORS(res);
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
