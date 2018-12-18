// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";

import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { parseRangeHeader } from "@r2-utils-js/_utils/http/RangeUtils";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
import * as debug_ from "debug";
import * as express from "express";
import * as mime from "mime-types";

import { IRequestPayloadExtension, IRequestQueryParams, _asset, _pathBase64 } from "./request-ext";
import { Server } from "./server";

// import { CounterPassThroughStream } from "@r2-utils-js/_utils/stream/CounterPassThroughStream";

const debug = debug_("r2:streamer#http/server-assets");

export function serverAssets(server: Server, routerPathBase64: express.Router) {

    // let streamCounter = 0;

    const routerAssets = express.Router({ strict: false });
    // routerAssets.use(morgan("combined"), { stream: { write: (msg: any) => debug(msg) } }));

    routerAssets.get("/",
        async (req: express.Request, res: express.Response) => {

            const reqparams = req.params as IRequestPayloadExtension;

            if (!reqparams.pathBase64) {
                reqparams.pathBase64 = (req as IRequestPayloadExtension).pathBase64;
            }
            if (!reqparams.asset) {
                reqparams.asset = (req as IRequestPayloadExtension).asset;
            }
            if (!reqparams.lcpPass64) {
                reqparams.lcpPass64 = (req as IRequestPayloadExtension).lcpPass64;
            }

            const isShow = (req.query as IRequestQueryParams).show;

            // debug(req.method);
            const isHead = req.method.toLowerCase() === "head";
            if (isHead) {
                debug("HEAD !!!!!!!!!!!!!!!!!!!");
            }

            // reqparams.pathBase64 is already decoded!
            // const decoded = decodeURIComponent(reqparams.pathBase64);
            const pathBase64Str = new Buffer(reqparams.pathBase64, "base64").toString("utf8");

            // const fileName = path.basename(pathBase64Str);
            // const ext = path.extname(fileName).toLowerCase();

            let publication: Publication;
            try {
                publication = await server.loadOrGetCachedPublication(pathBase64Str);
            } catch (err) {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }

            // dumpPublication(publication);

            const zipInternal = publication.findFromInternal("zip");
            if (!zipInternal) {
                const err = "No publication zip!";
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }
            const zip = zipInternal.Value as IZip;

            const pathInZip = reqparams.asset;

            if (!zip.hasEntry(pathInZip)) {
                const err = "Asset not in zip! " + pathInZip;
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }

            let link: Link | undefined;

            if ((publication.Resources || publication.Spine)
                && pathInZip.indexOf("META-INF/") !== 0
                && !pathInZip.endsWith(".opf")) {

                const relativePath = pathInZip;

                if (publication.Resources) {
                    link = publication.Resources.find((l) => {
                        if (l.Href === relativePath) {
                            return true;
                        }
                        return false;
                    });
                }
                if (!link) {
                    if (publication.Spine) {
                        link = publication.Spine.find((l) => {
                            if (l.Href === relativePath) {
                                return true;
                            }
                            return false;
                        });
                    }
                }
                if (!link) {
                    const err = "Asset not declared in publication spine/resources!" + relativePath;
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
            }

            if (server.isSecured() && !link &&
                (pathInZip.indexOf("META-INF/") === 0 || pathInZip.endsWith(".opf"))
            ) {
                res.status(200).send("<html><body></body></html>");
                return;
            }

            let mediaType = mime.lookup(pathInZip);
            if (link && link.TypeLink) {
                mediaType = link.TypeLink;
            }

            const isText = (typeof mediaType === "string") && (
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
            const isObfuscatedFont = isEncrypted && link &&
                (link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC"
                    || link.Properties.Encrypted.Algorithm === "http://www.idpf.org/2008/embedding");

            const isPartialByteRangeRequest = ((req.headers && req.headers.range) ? true : false);

            // if (isEncrypted && isPartialByteRangeRequest) {
            //     const err = "Encrypted video/audio not supported (HTTP 206 partial request byte range)";
            //     debug(err);
            //     res.status(500).send("<html><body><p>Internal Server Error</p><p>"
            //         + err + "</p></body></html>");
            //     return;
            // }

            let partialByteBegin = 0; // inclusive boundaries
            let partialByteEnd = -1;
            let partialByteLength = 0;
            if (isPartialByteRangeRequest) {
                debug(req.headers.range);
                const ranges = parseRangeHeader(req.headers.range);
                // debug(ranges);

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

            // debug(`${pathInZip} >> ${partialByteBegin}-${partialByteEnd}`);
            let zipStream_: IStreamAndLength;
            try {
                zipStream_ = isPartialByteRangeRequest && !isEncrypted ?
                    await zip.entryStreamRangePromise(pathInZip, partialByteBegin, partialByteEnd) :
                    await zip.entryStreamPromise(pathInZip);
            } catch (err) {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }

            const doTransform = !isEncrypted || (isObfuscatedFont || !server.disableDecryption);

            if (doTransform && link) {

                let transformFail = false;
                let transformedStream: IStreamAndLength;
                try {
                    transformedStream = await Transformers.tryStream(
                        publication, link,
                        zipStream_,
                        isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
                } catch (err) {
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
                if (transformedStream) {
                    if (transformedStream !== zipStream_) {
                        debug("Asset transformed ok: " + link.Href);
                    }
                    zipStream_ = transformedStream; // can be unchanged
                } else {
                    transformFail = true;
                }

                if (transformFail) {
                    const err = "Transform fail (encryption scheme not supported?)";
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
            }

            if (partialByteEnd < 0) {
                partialByteEnd = zipStream_.length - 1;
            }

            partialByteLength = isPartialByteRangeRequest ?
                partialByteEnd - partialByteBegin + 1 :
                zipStream_.length;

            if (isShow) {
                let zipData: Buffer;
                try {
                    zipData = await streamToBufferPromise(zipStream_.stream);
                } catch (err) {
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
                if (zipData) {
                    debug("CHECK: " + zipStream_.length + " ==> " + zipData.length);
                }
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

                return;
            }

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
                const rangeHeader = `bytes ${partialByteBegin}-${partialByteEnd}/${zipStream_.length}`;
                // debug("+++> " + rangeHeader + " (( " + partialByteLength);
                res.setHeader("Content-Range", rangeHeader);
                res.status(206);
            } else {
                res.setHeader("Content-Length", `${zipStream_.length}`);
                // debug("---> " + zipStream_.length);
                res.status(200);
            }

            if (isHead) {
                res.end();
                // } else if (zipStream_.length === 2) {
                //     debug("===> BUFFER SEND (short stream)");
                //     let zipData: Buffer;
                //     try {
                //         zipData = await streamToBufferPromise(zipStream_.stream);
                //     } catch (err) {
                //         debug(err);
                //         res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                //             + err + "</p></body></html>");
                //         return;
                //     }
                //     if (zipData) {
                //         debug("CHECK: " + zipStream_.length + " ==> " + zipData.length);
                //     }
                //     res.send(zipStream_.stream);
            } else {
                // debug("===> STREAM PIPE");

                // const counterStream = new CounterPassThroughStream(++streamCounter);

                zipStream_.stream
                    // .on("finish", () => {
                    //     debug("ZIP FINISH " + counterStream.id);
                    // })
                    // .on("end", () => {
                    //     debug("ZIP END " + counterStream.id);
                    // })
                    // .on("close", () => {
                    //     debug("ZIP CLOSE " + counterStream.id);
                    // })
                    // .on("error", () => {
                    //     debug("ZIP ERROR " + counterStream.id);
                    // })
                    // .on("pipe", () => {
                    //     debug("ZIP PIPE " + counterStream.id);
                    // })
                    // .on("unpipe", () => {
                    //     debug("ZIP UNPIPE " + counterStream.id);
                    // })
                    // .on("drain", () => {
                    //     debug("ZIP DRAIN " + counterStream.id);
                    // })
                    // .pipe(counterStream)
                    // .on("progress", function f() {
                    //     debug("CounterPassThroughStream PROGRESS: " +
                    //         (this as CounterPassThroughStream).id +
                    //         " -- " + (this as CounterPassThroughStream).bytesReceived);
                    // })
                    // .on("end", function f() {
                    //     debug("CounterPassThroughStream END: " +
                    //         (this as CounterPassThroughStream).id);
                    // })
                    // .on("close", function f() {
                    //     debug("CounterPassThroughStream CLOSE: " +
                    //         (this as CounterPassThroughStream).id);
                    // })
                    // .once("finish", function f() {
                    //     debug("CounterPassThroughStream FINISH: " +
                    //         (this as CounterPassThroughStream).id +
                    //         " -- " + (this as CounterPassThroughStream).bytesReceived);
                    // })
                    // .on("error", function f() {
                    //     debug("CounterPassThroughStream ERROR: " +
                    //         (this as CounterPassThroughStream).id);
                    // })
                    // .on("pipe", function f() {
                    //     debug("CounterPassThroughStream PIPE: " +
                    //         (this as CounterPassThroughStream).id);
                    // })
                    // .on("unpipe", function f() {
                    //     debug("CounterPassThroughStream UNPIPE: " +
                    //         (this as CounterPassThroughStream).id);
                    // })
                    // // .on("drain", function f() {
                    // //     debug("CounterPassThroughStream DRAIN: " +
                    // //         (this as CounterPassThroughStream).id);
                    // // })
                    .pipe(res)
                    // .on("finish", () => {
                    //     debug("RES FINISH " + counterStream.id);
                    // })
                    // .on("end", () => {
                    //     debug("RES END " + counterStream.id);
                    // })
                    .on("close", () => {
                        // debug("RES CLOSE " + counterStream.id);

                        res.end();

                        // counterStream.unpipe(res);
                        // counterStream.end();
                        // if (zipStream_) {
                        //     zipStream_.stream.unpipe(counterStream);
                        // }

                        // zipStream.close();
                    })
                    // .on("error", () => {
                    //     debug("RES ERROR " + counterStream.id);
                    // })
                    // .on("pipe", () => {
                    //     debug("RES PIPE " + counterStream.id);
                    // })
                    // .on("unpipe", () => {
                    //     debug("RES UNPIPE " + counterStream.id);
                    // })
                    // .on("drain", () => {
                    //     debug("RES DRAIN " + counterStream.id);
                    // })
                    ;
            }
        });

    routerPathBase64.param("asset", (req, _res, next, value, _name) => {
        (req as IRequestPayloadExtension).asset = value;
        next();
    });

    routerPathBase64.use("/:" + _pathBase64 + "/:" + _asset + "(*)", routerAssets);
}
