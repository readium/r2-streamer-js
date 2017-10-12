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
import { JSON as TAJSON } from "ta-json";
import * as xmldom from "xmldom";

import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

const debug = debug_("r2:server:opds");

export function serverOPDS12(_server: Server, topRouter: express.Application) {

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

    const routerOPDS12 = express.Router({ strict: false });
    routerOPDS12.use(morgan("combined"));

    routerOPDS12.use(trailingSlashRedirect);

    routerOPDS12.get("/", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
            `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
            `return "%" + c.charCodeAt(0).toString(16); }); }` +
            `function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '/opds12/' +` +
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

    routerOPDS12.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as any).urlEncoded = value;
        next();
    });

    routerOPDS12.get("/:urlEncoded(*)", async (req: express.Request, res: express.Response) => {

        if (!req.params.urlEncoded) {
            req.params.urlEncoded = (req as any).urlEncoded;
        }

        const urlDecoded = req.params.urlEncoded;
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
            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }

            let responseData: Buffer | undefined;
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
                if ((obj.href && typeof obj.href === "string"
                    && obj.type && obj.type.indexOf("application/atom+xml") >= 0) ||
                    (obj.Href && typeof obj.Href === "string"
                        && obj.Type && obj.Type.indexOf("application/atom+xml") >= 0)
                ) {
                    let fullHref = obj.href ? obj.href as string : obj.Href as string;
                    if (!isHTTP(fullHref)) {
                        fullHref = ensureAbsolute(urlDecoded, fullHref);
                    }
                    obj.__href__ = rootUrl +
                        req.originalUrl.substr(0, req.originalUrl.indexOf("/opds12/")) +
                        "/opds12/" + encodeURIComponent_RFC3986(fullHref);
                }
            };

            const jsonObjOPDS1 = TAJSON.serialize(opds1);
            traverseJsonObjects(jsonObjOPDS1, funk);

            const jsonObjOPDS2 = TAJSON.serialize(opds2);
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
            let response: requestPromise.FullResponse | undefined;
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

            // To please the TypeScript compiler :(
            response = response as requestPromise.FullResponse;
            await success(response);
        }
    });

    topRouter.use("/opds12", routerOPDS12);
}
