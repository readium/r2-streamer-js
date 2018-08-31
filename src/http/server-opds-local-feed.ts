// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as path from "path";

import { OPDSLink } from "@opds/opds2/opds2-link";
import { isHTTP } from "@utils/http/UrlUtils";
import { sortObject, traverseJsonObjects } from "@utils/JsonUtils";
import * as css2json from "css2json";
import * as debug_ from "debug";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import { JSON as TAJSON } from "ta-json";

import { jsonSchemaValidate } from "../utils/json-schema-validate";
import { IRequestPayloadExtension, IRequestQueryParams, _jsonPath, _show } from "./request-ext";
import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

const debug = debug_("r2:streamer#http/server-opds-local-feed");

// tslint:disable-next-line:variable-name
export const serverOPDS_local_feed_PATH = "/opds2-local-feed";
// tslint:disable-next-line:variable-name
export const serverOPDS_local_feed_PATH_ = "/publications.json";
export function serverOPDS_local_feed(server: Server, topRouter: express.Application) {

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

    // tslint:disable-next-line:variable-name
    const routerOPDS_local_feed = express.Router({ strict: false });
    // routerOPDS2.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerOPDS_local_feed.get(["/", "/" + _show + "/:" + _jsonPath + "?"],
        (req: express.Request, res: express.Response) => {

            const reqparams = req.params as IRequestPayloadExtension;

            const isShow = req.url.indexOf("/show") >= 0 || (req.query as IRequestQueryParams).show;
            if (!reqparams.jsonPath && (req.query as IRequestQueryParams).show) {
                reqparams.jsonPath = (req.query as IRequestQueryParams).show;
            }

            const isCanonical = (req.query as IRequestQueryParams).canonical &&
                (req.query as IRequestQueryParams).canonical === "true";

            const isSecureHttp = req.secure ||
                req.protocol === "https" ||
                req.get("X-Forwarded-Proto") === "https"
                // (req.headers.host && req.headers.host.indexOf("now.sh") >= 0) ||
                // (req.hostname && req.hostname.indexOf("now.sh") >= 0)
                ;

            const rootUrl = (isSecureHttp ? "https://" : "http://")
                + req.headers.host;
            const selfURL = rootUrl + serverOPDS_local_feed_PATH + serverOPDS_local_feed_PATH_;

            const feed = server.publicationsOPDS();
            if (!feed) {
                const err = "Publications OPDS2 feed not available yet, try again later.";
                debug(err);
                res.status(503).send("<html><body><p>Resource temporarily unavailable</p><p>"
                    + err + "</p></body></html>");
                return;
            }

            if (!feed.findFirstLinkByRel("self")) {
                feed.Links = [];
                const selfLink = new OPDSLink();
                selfLink.Href = selfURL;
                selfLink.TypeLink = "application/opds+json";
                selfLink.AddRel("self");
                feed.Links.push(selfLink);
            }

            function absoluteURL(href: string): string {
                return rootUrl + "/pub/" + href;
            }

            function absolutizeURLs(jsonObj: any) {
                traverseJsonObjects(jsonObj,
                    (obj) => {
                        if (obj.href && typeof obj.href === "string") {

                            if (!isHTTP(obj.href)) {
                                // obj.href_ = obj.href;
                                obj.href = absoluteURL(obj.href);
                            }

                            if (isShow &&
                                obj.type === "application/webpub+json" &&
                                obj.rel === "http://opds-spec.org/acquisition" &&
                                (obj.href as string).endsWith("/manifest.json")) {
                                    obj.href += "/show";
                            }
                        }
                    });
            }

            if (isShow) {
                let objToSerialize: any = null;

                if (reqparams.jsonPath) {
                    switch (reqparams.jsonPath) {

                        case "all": {
                            objToSerialize = feed;
                            break;
                        }
                        case "metadata": {
                            objToSerialize = feed.Metadata;
                            break;
                        }
                        case "links": {
                            objToSerialize = feed.Links;
                            break;
                        }
                        case "publications": {
                            objToSerialize = feed.Publications;
                            break;
                        }
                        default: {
                            objToSerialize = null;
                        }
                    }
                } else {
                    objToSerialize = feed;
                }

                if (!objToSerialize) {
                    objToSerialize = {};
                }

                const jsonObj = TAJSON.serialize(objToSerialize);

                let validationStr: string | undefined;
                const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
                if (doValidate) {

                    // // tslint:disable-next-line:no-string-literal
                    // if (jsonObj["@context"] && typeof jsonObj["@context"] === "string") {
                    //     jsonObj["@context"] = [ jsonObj["@context"] ];
                    // }

                    // // tslint:disable-next-line:no-string-literal
                    // jsonObj["@context"] = jsonObj["@context"][0];

                    const jsonSchemasRootpath = path.join(process.cwd(), "misc/json-schema/opds");
                    const jsonSchemasNames = [
                        "feed", // must be first!
                        "acquisition-object",
                        "feed-metadata",
                        "link",
                        "properties",
                        "publication",
                        "../webpub-manifest/subcollection",
                        "../webpub-manifest/metadata",
                        "../webpub-manifest/link",
                        "../webpub-manifest/contributor",
                        "../webpub-manifest/contributor-object",
                    ];

                    validationStr = jsonSchemaValidate(jsonSchemasRootpath, "opds", jsonSchemasNames, jsonObj);
                }

                absolutizeURLs(jsonObj);

                // const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

                // // breakLength: 100  maxArrayLength: undefined
                // const dumpStr = util.inspect(objToSerialize,
                //     { showHidden: false, depth: 1000, colors: false, customInspect: true });

                const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

                // const regex = new RegExp(">" + rootUrl + "/([^<]+</a>)", "g");
                // jsonPretty = jsonPretty.replace(regex, ">$1");
                // jsonPretty = jsonPretty.replace(/>publications.json<\/a>/, ">" + rootUrl + "/publications.json</a>");

                res.status(200).send("<html><body>" +
                    "<h1>OPDS2 JSON feed</h1>" +
                    "<hr><p><pre>" + jsonPretty + "</pre></p>" +
                    // tslint:disable-next-line:max-line-length
                    (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
                    // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                    // "<p><pre>" + dumpStr + "</pre></p>" +
                    "</body></html>");
            } else {
                server.setResponseCORS(res);
                res.set("Content-Type", "application/opds+json; charset=utf-8");

                const publicationsJsonObj = TAJSON.serialize(feed);

                absolutizeURLs(publicationsJsonObj);

                const publicationsJsonStr = isCanonical ?
                    global.JSON.stringify(sortObject(publicationsJsonObj), null, "") :
                    global.JSON.stringify(publicationsJsonObj, null, "  ");

                const checkSum = crypto.createHash("sha256");
                checkSum.update(publicationsJsonStr);
                const hash = checkSum.digest("hex");

                const match = req.header("If-None-Match");
                if (match === hash) {
                    debug("opds2 publications.json cache");
                    res.status(304); // StatusNotModified
                    res.end();
                    return;
                }

                res.setHeader("ETag", hash);
                // res.setHeader("Cache-Control", "public,max-age=86400");

                res.status(200).send(publicationsJsonStr);
            }
        });

    // tslint:disable-next-line:variable-name
    const routerOPDS_local_feed_ = express.Router({ strict: false });
    // routerOPDS2_.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerOPDS_local_feed_.use(trailingSlashRedirect);

    routerOPDS_local_feed_.get("/", (req: express.Request, res: express.Response) => {

        const i = req.originalUrl.indexOf("?");

        let pathWithoutQuery = req.originalUrl;
        if (i >= 0) {
            pathWithoutQuery = pathWithoutQuery.substr(0, i);
        }

        let redirect = pathWithoutQuery +
            // (pathWithoutQuery.substr(-1) === "/" ? "" : "/") +
            serverOPDS_local_feed_PATH_ + "/show";
        redirect = redirect.replace("//", "/");
        if (i >= 0) {
            redirect += req.originalUrl.substr(i);
        }

        // No need for CORS with "show" URL redirect
        // server.setResponseCORS(res);

        debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
        res.redirect(301, redirect);
    });

    routerOPDS_local_feed_.use(serverOPDS_local_feed_PATH_, routerOPDS_local_feed);

    topRouter.use(serverOPDS_local_feed_PATH, routerOPDS_local_feed_);
}
