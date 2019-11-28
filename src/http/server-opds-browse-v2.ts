// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as css2json from "css2json";
import * as debug_ from "debug";
import * as DotProp from "dot-prop";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import * as morgan from "morgan";
import * as path from "path";
import * as request from "request";
import * as requestPromise from "request-promise-native";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import {
    encodeURIComponent_RFC3986, ensureAbsolute, isHTTP,
} from "@r2-utils-js/_utils/http/UrlUtils";
import { traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

import { jsonSchemaValidate } from "../utils/json-schema-validate";
import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
import { Server } from "./server";
import { serverOPDS_convert_v1_to_v2_PATH } from "./server-opds-convert-v1-to-v2";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

const debug = debug_("r2:streamer#http/server-opds-browse-v2");

// tslint:disable-next-line:variable-name
export const serverOPDS_browse_v2_PATH = "/opds-v2-browse";

// tslint:disable-next-line:variable-name
export const serverOPDS_dataUrl_PATH = "/data-url";

export function serverOPDS_browse_v2(_server: Server, topRouter: express.Application) {

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
    const routerOPDS_browse_v2 = express.Router({ strict: false });
    routerOPDS_browse_v2.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerOPDS_browse_v2.use(trailingSlashRedirect);

    routerOPDS_browse_v2.get("/", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
            `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
            `return "%" + c.charCodeAt(0).toString(16); }); }` +
            `function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '${serverOPDS_browse_v2_PATH}/' +` +
            ` encodeURIComponent_RFC3986(document.getElementById("url").value);` +
            `location.href = url;}</script>`;
        html += "</head>";

        html += "<body><h1>OPDS feed browser</h1>";

        html += `<form onsubmit="go();return false;">` +
            `<input type="text" name="url" id="url" size="80">` +
            `<input type="submit" value="Go!"></form>`;

        html += "</body></html>";

        res.status(200).send(html);
    });

    routerOPDS_browse_v2.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as IRequestPayloadExtension).urlEncoded = value;
        next();
    });

    routerOPDS_browse_v2.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

        const reqparams = (req as IRequestPayloadExtension).params;

        if (!reqparams.urlEncoded) {
            reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
        }

        const urlDecoded = reqparams.urlEncoded;
        // if (urlDecoded.substr(-1) === "/") {
        //     urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
        // }
        debug(urlDecoded);

        const isSecureHttp = req.secure ||
            req.protocol === "https" ||
            req.get("X-Forwarded-Proto") === "https"
            // (req.headers.host && req.headers.host.indexOf("now.sh") >= 0) ||
            // (req.hostname && req.hostname.indexOf("now.sh") >= 0)
            ;
        const rootUrl = (isSecureHttp ? "https://" : "http://")
            + req.headers.host;

        const failure = (err: any) => {
            debug(err);
            res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                + err + "</p></body></html>");
        };

        const success = async (response: request.RequestResponse) => {

            // Object.keys(response.headers).forEach((header: string) => {
            //     debug(header + " => " + response.headers[header]);
            // });

            const isAuthStatusCode = response.statusCode === 401;
            const isBadStatusCode = response.statusCode && (response.statusCode < 200 || response.statusCode >= 300);
            if (!isAuthStatusCode && isBadStatusCode) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }

            let responseData: Buffer;
            try {
                responseData = await streamToBufferPromise(response);
            } catch (err) {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + (isAuthStatusCode ? " (Auth 401)" : "") + "</p></body></html>");
                return;
            }
            const responseStr = responseData.toString("utf8");
            const responseJson = JSON.parse(responseStr);

            const isPublication = !responseJson.publications &&
                !responseJson.navigation &&
                !responseJson.groups &&
                !responseJson.catalogs &&
                responseJson.metadata;
            const isAuth = !isPublication && responseJson.authentication;

            const opds2Feed: OPDSPublication | OPDSFeed | OPDSAuthenticationDoc =
                // tslint:disable-next-line: max-line-length
                isPublication ? TaJsonDeserialize<OPDSPublication>(responseJson, OPDSPublication) : // "application/opds-publication+json"
                // tslint:disable-next-line: max-line-length
                (isAuth ? TaJsonDeserialize<OPDSAuthenticationDoc>(responseJson, OPDSAuthenticationDoc) : // "application/vnd.opds.authentication.v1.0+json"
                TaJsonDeserialize<OPDSFeed>(responseJson, OPDSFeed)); // "application/opds+json"

            const opds2FeedJson = TaJsonSerialize(opds2Feed);

            let validationStr: string | undefined;
            const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
            if (doValidate) {

                const jsonSchemasRootpath = path.join(process.cwd(), "misc", "json-schema");
                const jsonSchemasNames = [
                    "opds/publication",
                    "opds/acquisition-object",
                    "opds/feed-metadata",
                    "opds/properties",
                    "webpub-manifest/publication",
                    "webpub-manifest/contributor-object",
                    "webpub-manifest/contributor",
                    "webpub-manifest/link",
                    "webpub-manifest/metadata",
                    "webpub-manifest/subcollection",
                    "webpub-manifest/properties",
                    "webpub-manifest/subject",
                    "webpub-manifest/subject-object",
                    "webpub-manifest/extensions/epub/metadata",
                    "webpub-manifest/extensions/epub/subcollections",
                    "webpub-manifest/extensions/epub/properties",
                ];
                if (isAuth) {
                    jsonSchemasNames.unshift("opds/authentication"); // must be first!
                } else if (!isPublication) {
                    jsonSchemasNames.unshift("opds/feed"); // must be first!
                }
                // debug(jsonSchemasNames);

                const validationErrors =
                    jsonSchemaValidate(jsonSchemasRootpath, jsonSchemasNames, opds2FeedJson);
                if (validationErrors) {
                    validationStr = "";

                    for (const err of validationErrors) {

                        debug("JSON Schema validation FAIL.");
                        debug(err);

                        if (isPublication) {
                            const val = DotProp.get(opds2FeedJson, err.jsonPath);
                            const valueStr = (typeof val === "string") ?
                                `${val}` :
                                ((val instanceof Array || typeof val === "object") ?
                                `${JSON.stringify(val)}` :
                                    "");
                            debug(valueStr);

                            const title = DotProp.get(opds2FeedJson, "metadata.title");
                            debug(title);

                            validationStr +=
                            // tslint:disable-next-line:max-line-length
                            `\n"${title}"\n\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
                        } else {
                            const val = DotProp.get(opds2FeedJson, err.jsonPath);
                            const valueStr = (typeof val === "string") ?
                                `${val}` :
                                ((val instanceof Array || typeof val === "object") ?
                                `${JSON.stringify(val)}` :
                                    "");
                            debug(valueStr);

                            let title = "";
                            let pubIndex = "";
                            if (/^publications\.[0-9]+/.test(err.jsonPath)) {
                                const jsonPubTitlePath =
                                    err.jsonPath.replace(/^(publications\.[0-9]+).*/, "$1.metadata.title");
                                debug(jsonPubTitlePath);
                                title = DotProp.get(opds2FeedJson, jsonPubTitlePath);
                                debug(title);

                                pubIndex = err.jsonPath.replace(/^publications\.([0-9]+).*/, "$1");
                                debug(pubIndex);
                            }

                            validationStr +=
                            // tslint:disable-next-line:max-line-length
                            `\n___________INDEX___________ #${pubIndex} "${title}"\n\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
                        }
                    }
                }
            }

            const funk = (obj: any) => {
                if ((obj.href && typeof obj.href === "string") ||
                    (obj.Href && typeof obj.Href === "string")) {

                    let fullHref = obj.href ? obj.href as string : obj.Href as string;

                    const isDataUrl = /^data:/.test(fullHref);
                    const isMailUrl = /^mailto:/.test(fullHref);
                    const notFull = !isDataUrl && !isMailUrl && !isHTTP(fullHref);
                    if (notFull) {
                        fullHref = ensureAbsolute(urlDecoded, fullHref);
                    }

                    if ((obj.type && obj.type.indexOf("opds") >= 0 && obj.type.indexOf("json") >= 0) ||
                        (obj.Type && obj.Type.indexOf("opds") >= 0 && obj.Type.indexOf("json") >= 0)) {

                        obj.__href__ = rootUrl + req.originalUrl.substr(0,
                            req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
                            serverOPDS_browse_v2_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

                    } else if ((obj.type && obj.type.indexOf("application/atom+xml") >= 0) ||
                        (obj.Type && obj.Type.indexOf("application/atom+xml") >= 0)) {

                        obj.__href__ = rootUrl + req.originalUrl.substr(0,
                            req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
                            serverOPDS_convert_v1_to_v2_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

                    } else if (isDataUrl) {
                        // obj.href = obj.href.substr(0, 100) + "(...)";
                        // obj.__href__ = rootUrl + req.originalUrl.substr(0,
                        //     req.originalUrl.indexOf(serverOPDS_browse_v2_PATH + "/")) +
                        //     serverOPDS_dataUrl_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

                    } else if (notFull && !isMailUrl) {
                        obj.__href__ = fullHref;
                    }
                }
            };
            traverseJsonObjects(opds2FeedJson, funk);

            const css = css2json(jsonStyle);
            let jsonPrettyOPDS2 = jsonMarkup(opds2FeedJson, css);
            // tslint:disable-next-line: max-line-length
            jsonPrettyOPDS2 = jsonPrettyOPDS2.replace(/>"data:image\/(.*)"</g, "><a href=\"data:image/$1\" target=\"_BLANK\"><img style=\"max-width: 100px;\" src=\"data:image/$1\"></a><");

            res.status(200).send("<html><body>" +
                "<h1>OPDS2 JSON " +
                (isPublication ? "entry" : (isAuth ? "authentication" : "feed")) +
                " (OPDS2) " + (isAuthStatusCode ? " [HTTP 401]" : "") + "</h1>" +
                "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
                "<hr>" +
                "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
                jsonPrettyOPDS2 + "</div>" +
                // tslint:disable-next-line:max-line-length
                (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
                // "<p><pre>" + jsonPretty + "</pre></p>" +
                // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                // "<p><pre>" + dumpStr + "</pre></p>" +
                "</body></html>");
        };

        const headers = {
            "Accept": "application/json,application/xml",
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
            "User-Agent": "READIUM2",
        };

        // No response streaming! :(
        // https://github.com/request/request-promise/issues/90
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.get({
                headers,
                method: "GET",
                uri: urlDecoded,
            })
                .on("response", success)
                .on("error", failure);
        } else {
            let response: requestPromise.FullResponse;
            try {
                // tslint:disable-next-line:await-promise no-floating-promises
                response = await requestPromise({
                    headers,
                    method: "GET",
                    resolveWithFullResponse: true,
                    uri: urlDecoded,
                });
            } catch (err) {
                failure(err);
                return;
            }

            await success(response);
        }
    });

    topRouter.use(serverOPDS_browse_v2_PATH, routerOPDS_browse_v2);

    // tslint:disable-next-line:variable-name
    const routerOPDS_dataUrl = express.Router({ strict: false });
    routerOPDS_dataUrl.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerOPDS_dataUrl.use(trailingSlashRedirect);

    routerOPDS_dataUrl.get("/", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
            `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
            `return "%" + c.charCodeAt(0).toString(16); }); }` +
            `function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '${serverOPDS_dataUrl_PATH}/' +` +
            ` encodeURIComponent_RFC3986(document.getElementById("url").value);` +
            `location.href = url;}</script>`;
        html += "</head>";

        html += "<body><h1>data URL viewer</h1>";

        html += `<form onsubmit="go();return false;">` +
            `<input type="text" name="url" id="url" size="80">` +
            `<input type="submit" value="Go!"></form>`;

        html += "</body></html>";

        res.status(200).send(html);
    });

    routerOPDS_dataUrl.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as IRequestPayloadExtension).urlEncoded = value;
        next();
    });

    routerOPDS_dataUrl.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

        const reqparams = (req as IRequestPayloadExtension).params;

        if (!reqparams.urlEncoded) {
            reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
        }

        const urlDecoded = reqparams.urlEncoded;
        // if (urlDecoded.substr(-1) === "/") {
        //     urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
        // }
        debug(urlDecoded);

        res.status(200).send("<html><body>" +
            "<h1>DATA URL</h1>" +
            "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
            "<hr>" +
            "<img src=\"" + urlDecoded + "\" />" +
            "</body></html>");
    });

    topRouter.use(serverOPDS_dataUrl_PATH, routerOPDS_dataUrl);
}
