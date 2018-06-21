// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as path from "path";

import { Publication } from "@models/publication";
import {
    getAllMediaOverlays,
    mediaOverlayURLParam,
    mediaOverlayURLPath,
} from "@parser/epub";
import { encodeURIComponent_RFC3986, isHTTP } from "@utils/http/UrlUtils";
import { sortObject, traverseJsonObjects } from "@utils/JsonUtils";
import * as css2json from "css2json";
import * as debug_ from "debug";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import { JSON as TAJSON } from "ta-json";

import {
    IRequestPayloadExtension,
    IRequestQueryParams,
    _jsonPath,
    _pathBase64,
    _show,
} from "./request-ext";
import { Server } from "./server";

const debug = debug_("r2:streamer#http/server-manifestjson");

export function serverManifestJson(server: Server, routerPathBase64: express.Router) {

    // https://github.com/mafintosh/json-markup/blob/master/style.css
    const jsonStyle = `
.json-markup {
    line-height: 17px;
    font-size: 13px;
    font-family: monospace;
    white-space: pre;
}
.json-markup-key {
    font-weight: bold;
}
.json-markup-bool {
    color: firebrick;
}
.json-markup-string {
    color: green;
}
.json-markup-null {
    color: gray;
}
.json-markup-number {
    color: blue;
}
`;

    const routerManifestJson = express.Router({ strict: false });
    // routerManifestJson.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerManifestJson.get(["/", "/" + _show + "/:" + _jsonPath + "?"],
        async (req: express.Request, res: express.Response) => {

            const reqparams = req.params as IRequestPayloadExtension;

            if (!reqparams.pathBase64) {
                reqparams.pathBase64 = (req as IRequestPayloadExtension).pathBase64;
            }
            if (!reqparams.lcpPass64) {
                reqparams.lcpPass64 = (req as IRequestPayloadExtension).lcpPass64;
            }

            const isShow = req.url.indexOf("/show") >= 0 || (req.query as IRequestQueryParams).show;
            if (!reqparams.jsonPath && (req.query as IRequestQueryParams).show) {
                reqparams.jsonPath = (req.query as IRequestQueryParams).show;
            }

            // debug(req.method);
            const isHead = req.method.toLowerCase() === "head";
            if (isHead) {
                debug("HEAD !!!!!!!!!!!!!!!!!!!");
            }

            const isCanonical = (req.query as IRequestQueryParams).canonical &&
                (req.query as IRequestQueryParams).canonical === "true";

            const isSecureHttp = req.secure ||
                req.protocol === "https" ||
                req.get("X-Forwarded-Proto") === "https"
                // (req.headers.host && req.headers.host.indexOf("now.sh") >= 0) ||
                // (req.hostname && req.hostname.indexOf("now.sh") >= 0)
                ;

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

            if (reqparams.lcpPass64 && !server.disableDecryption) {
                const lcpPass = new Buffer(reqparams.lcpPass64, "base64").toString("utf8");
                if (publication.LCP) {
                    try {
                        await publication.LCP.tryUserKeys([lcpPass]); // hex
                    } catch (err) {
                        debug(err);
                        const errMsg = "FAIL publication.LCP.tryUserKeys(): " + err;
                        debug(errMsg);
                        res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                            + errMsg + "</p></body></html>");
                        return;
                    }
                }
            }

            // debug(req.url); // path local to this router
            // debug(req.baseUrl); // path local to above this router
            // debug(req.originalUrl); // full path (req.baseUrl + req.url)
            // url.parse(req.originalUrl, false).host
            // req.headers.host has port, not req.hostname

            const rootUrl = (isSecureHttp ? "https://" : "http://")
                + req.headers.host + "/pub/"
                + (reqparams.lcpPass64 ?
                    (server.lcpBeginToken + encodeURIComponent_RFC3986(reqparams.lcpPass64) + server.lcpEndToken) :
                    "")
                + encodeURIComponent_RFC3986(reqparams.pathBase64);
            const manifestURL = rootUrl + "/" + "manifest.json";

            const selfLink = publication.searchLinkByRel("self");
            if (!selfLink) {
                publication.AddLink("application/webpub+json", ["self"], manifestURL, false);
            }

            function absoluteURL(href: string): string {
                return rootUrl + "/" + href;
            }

            function absolutizeURLs(jsonObj: any) {
                traverseJsonObjects(jsonObj,
                    (obj) => {
                        if (obj.href && typeof obj.href === "string"
                            && !isHTTP(obj.href)) {
                            // obj.href_ = obj.href;
                            obj.href = absoluteURL(obj.href);
                        }

                        if (obj["media-overlay"] && typeof obj["media-overlay"] === "string"
                            && !isHTTP(obj["media-overlay"])) {
                            // obj["media-overlay_"] = obj["media-overlay"];
                            obj["media-overlay"] = absoluteURL(obj["media-overlay"]);
                        }
                    });
            }

            let hasMO = false;
            if (publication.Spine) {
                const link = publication.Spine.find((l) => {
                    if (l.Properties && l.Properties.MediaOverlay) {
                        return true;
                    }
                    return false;
                });
                if (link) {
                    hasMO = true;
                }
            }
            if (hasMO) {
                const moLink = publication.searchLinkByRel("media-overlay");
                if (!moLink) {
                    const moURL = // rootUrl + "/" +
                        mediaOverlayURLPath +
                        "?" + mediaOverlayURLParam + "={path}";
                    publication.AddLink("application/vnd.readium.mo+json", ["media-overlay"], moURL, true);
                }
            }

            let coverImage: string | undefined;
            const coverLink = publication.GetCover();
            if (coverLink) {
                coverImage = coverLink.Href;
                if (coverImage && !isHTTP(coverImage)) {
                    coverImage = absoluteURL(coverImage);
                }
            }

            if (isShow) {
                let objToSerialize: any = null;

                if (reqparams.jsonPath) {
                    switch (reqparams.jsonPath) {

                        case "all": {
                            objToSerialize = publication;
                            break;
                        }
                        case "cover": {
                            objToSerialize = publication.GetCover();
                            break;
                        }
                        case "mediaoverlays": {
                            try {
                                objToSerialize = await getAllMediaOverlays(publication);
                            } catch (err) {
                                debug(err);
                                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                                    + err + "</p></body></html>");
                                return;
                            }
                            break;
                        }
                        case "spine": {
                            objToSerialize = publication.Spine;
                            break;
                        }
                        case "pagelist": {
                            objToSerialize = publication.PageList;
                            break;
                        }
                        case "landmarks": {
                            objToSerialize = publication.Landmarks;
                            break;
                        }
                        case "links": {
                            objToSerialize = publication.Links;
                            break;
                        }
                        case "resources": {
                            objToSerialize = publication.Resources;
                            break;
                        }
                        case "toc": {
                            objToSerialize = publication.TOC;
                            break;
                        }
                        case "metadata": {
                            objToSerialize = publication.Metadata;
                            break;
                        }
                        default: {
                            objToSerialize = null;
                        }
                    }
                } else {
                    objToSerialize = publication;
                }

                if (!objToSerialize) {
                    objToSerialize = {};
                }

                const jsonObj = TAJSON.serialize(objToSerialize);

                absolutizeURLs(jsonObj);

                // const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

                // // breakLength: 100  maxArrayLength: undefined
                // const dumpStr = util.inspect(objToSerialize,
                //     { showHidden: false, depth: 1000, colors: false, customInspect: true });

                const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

                res.status(200).send("<html>" +
                    "<head><script type=\"application/ld+json\" href=\"" +
                    manifestURL +
                    "\"></script></head>" +
                    "<body>" +
                    "<h1>" + path.basename(pathBase64Str) + "</h1>" +
                    (coverImage ? "<img src=\"" + coverImage + "\" alt=\"\"/>" : "") +
                    "<hr><p><pre>" + jsonPretty + "</pre></p>" +
                    // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                    // "<p><pre>" + dumpStr + "</pre></p>" +
                    "</body></html>");
            } else {
                server.setResponseCORS(res);
                res.set("Content-Type", "application/webpub+json; charset=utf-8");

                const publicationJsonObj = TAJSON.serialize(publication);

                // absolutizeURLs(publicationJsonObj);

                if (isCanonical) {
                    if (publicationJsonObj.links) {
                        delete publicationJsonObj.links;
                    }
                }

                const publicationJsonStr = isCanonical ?
                    global.JSON.stringify(sortObject(publicationJsonObj), null, "") :
                    global.JSON.stringify(publicationJsonObj, null, "  ");

                const checkSum = crypto.createHash("sha256");
                checkSum.update(publicationJsonStr);
                const hash = checkSum.digest("hex");

                const match = req.header("If-None-Match");
                if (match === hash) {
                    debug("manifest.json cache");
                    res.status(304); // StatusNotModified
                    res.end();
                    return;
                }

                res.setHeader("ETag", hash);
                // res.setHeader("Cache-Control", "public,max-age=86400");

                const links = publication.GetPreFetchResources();
                if (links && links.length) {
                    let prefetch = "";
                    links.forEach((l) => {
                        const href = absoluteURL(l.Href);
                        prefetch += "<" + href + ">;" + "rel=prefetch,";
                    });

                    res.setHeader("Link", prefetch);
                }

                res.status(200);

                if (isHead) {
                    res.end();
                } else {
                    res.send(publicationJsonStr);
                }
            }
        });

    routerPathBase64.use("/:" + _pathBase64 + "/manifest.json", routerManifestJson);
}
