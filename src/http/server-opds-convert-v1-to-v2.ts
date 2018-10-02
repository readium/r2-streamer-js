// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";

import { convertOpds1ToOpds2 } from "@opds/converter";
import { OPDS } from "@opds/opds1/opds";
import { OPDSFeed } from "@opds/opds2/opds2";
import { encodeURIComponent_RFC3986, ensureAbsolute, isHTTP } from "@utils/http/UrlUtils";
import { traverseJsonObjects } from "@utils/JsonUtils";
import { streamToBufferPromise } from "@utils/stream/BufferUtils";
import { XML } from "@utils/xml-js-mapper";
import * as css2json from "css2json";
import * as debug_ from "debug";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import * as morgan from "morgan";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { JSON as TAJSON } from "ta-json-x";
import * as xmldom from "xmldom";

import { jsonSchemaValidate } from "../utils/json-schema-validate";
import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

const debug = debug_("r2:streamer#http/server-opds-convert-v1-to-v2");

// tslint:disable-next-line:variable-name
export const serverOPDS_convert_v1_to_v2_PATH = "/opds-v1-v2-convert";
export function serverOPDS_convert_v1_to_v2(_server: Server, topRouter: express.Application) {

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
    const routerOPDS_convert_v1_to_v2 = express.Router({ strict: false });
    routerOPDS_convert_v1_to_v2.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerOPDS_convert_v1_to_v2.use(trailingSlashRedirect);

    routerOPDS_convert_v1_to_v2.get("/", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
            `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
            `return "%" + c.charCodeAt(0).toString(16); }); }` +
            `function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '${serverOPDS_convert_v1_to_v2_PATH}/' +` +
            ` encodeURIComponent_RFC3986(document.getElementById("url").value);` +
            `location.href = url;}</script>`;
        html += "</head>";

        html += "<body><h1>OPDS 1 -> 2 converter</h1>";

        html += `<form onsubmit="go();return false;">` +
            `<input type="text" name="url" id="url" size="80">` +
            `<input type="submit" value="Go!"></form>`;

        html += "</body></html>";

        res.status(200).send(html);
    });

    routerOPDS_convert_v1_to_v2.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as IRequestPayloadExtension).urlEncoded = value;
        next();
    });

    routerOPDS_convert_v1_to_v2.get("/:" + _urlEncoded + "(*)",
        async (req: express.Request, res: express.Response) => {

        const reqparams = req.params as IRequestPayloadExtension;

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

            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }

            let responseData: Buffer;
            try {
                responseData = await streamToBufferPromise(response);
            } catch (err) {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            }
            const responseStr = responseData.toString("utf8");
            const responseXml = new xmldom.DOMParser().parseFromString(responseStr);
            // debug(responseXml);
            if (!responseXml || !responseXml.documentElement) {
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + "XML parse fail" + "</p></body></html>");
                return;
            }
            const isEntry = responseXml.documentElement.localName === "entry";
            let opds1: OPDS | undefined;
            // let opdsEntry: Entry | undefined;
            let opds2: OPDSFeed | undefined;
            if (isEntry) {
                // opdsEntry = XML.deserialize<Entry>(responseXml, Entry);

                const err = "OPDS Entry as top-level feed, not supported.";
                debug(err);

                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
                return;
            } else {
                opds1 = XML.deserialize<OPDS>(responseXml, OPDS);

                try {
                    opds2 = convertOpds1ToOpds2(opds1);
                    // debug(opds2);

                    // // breakLength: 100  maxArrayLength: undefined
                    // console.log(util.inspect(opds2,
                    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                } catch (err) {
                    debug("OPDS 1 -> 2 conversion FAILED");
                    debug(err);

                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }
            }

            const funk = (obj: any) => {
                if ((obj.href && typeof obj.href === "string") ||
                    (obj.Href && typeof obj.Href === "string")) {

                    let fullHref = obj.href ? obj.href as string : obj.Href as string;

                    const notFull = !isHTTP(fullHref);
                    if (notFull) {
                        fullHref = ensureAbsolute(urlDecoded, fullHref);
                    }

                    if ((obj.type && obj.type.indexOf("application/atom+xml") >= 0) ||
                        (obj.Type && obj.Type.indexOf("application/atom+xml") >= 0)) {
                        obj.__href__ = rootUrl + req.originalUrl.substr(0,
                            req.originalUrl.indexOf(serverOPDS_convert_v1_to_v2_PATH + "/")) +
                            serverOPDS_convert_v1_to_v2_PATH + "/" + encodeURIComponent_RFC3986(fullHref);
                    } else if (notFull) {
                        obj.__href__ = fullHref;
                    }
                }
            };

            const jsonObjOPDS1 = TAJSON.serialize(opds1);
            traverseJsonObjects(jsonObjOPDS1, funk);

            const jsonObjOPDS2 = TAJSON.serialize(opds2);

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

                validationStr = jsonSchemaValidate(jsonSchemasRootpath, "opds", jsonSchemasNames, jsonObjOPDS2);
            }

            traverseJsonObjects(jsonObjOPDS2, funk);

            const css = css2json(jsonStyle);
            const jsonPrettyOPDS1 = jsonMarkup(jsonObjOPDS1, css);
            const jsonPrettyOPDS2 = jsonMarkup(jsonObjOPDS2, css);

            res.status(200).send("<html><body>" +
                "<h1>OPDS2 JSON feed (converted from OPDS1 XML/ATOM)</h1>" +
                "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
                "<hr>" +
                "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"90%\" " +
                "style=\"table-layout:fixed;width:90%\">" +
                "<thead><tr><th>OPDS1</th><th>OPDS2</th></tr></thead>" +
                "<tbody><tr>" +
                "<td valign=\"top\" width=\"50%\">" +
                "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
                jsonPrettyOPDS1 + "</div></td>" +
                "<td valign=\"top\" width=\"50%\">" +
                "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
                jsonPrettyOPDS2 + "</div></td>" +
                "</tbody></tr>" +
                "</table>" +
                // tslint:disable-next-line:max-line-length
                (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
                // "<p><pre>" + jsonPretty + "</pre></p>" +
                // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                // "<p><pre>" + dumpStr + "</pre></p>" +
                "</body></html>");
        };

        // No response streaming! :(
        // https://github.com/request/request-promise/issues/90
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.get({
                headers: {},
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
                    headers: {},
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

    topRouter.use(serverOPDS_convert_v1_to_v2_PATH, routerOPDS_convert_v1_to_v2);
}
