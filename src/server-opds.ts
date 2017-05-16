import * as debug_ from "debug";
// import * as path from "path";
// import * as querystring from "querystring";
import * as util from "util";

import * as express from "express";
import * as morgan from "morgan";
import * as request from "request";
import * as xmldom from "xmldom";

import { OPDS } from "./parser/opds/opds";
import { streamToBufferPromise } from "./parser/zip";
import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";
import { XML } from "./xml-js-mapper";
// import { encodeURIComponent_RFC3986 } from "./utils";

const debug = debug_("r2:server:opds");

export function serverOPDS(_server: Server, topRouter: express.Router) {

    const routerUrl = express.Router({ strict: false });
    routerUrl.use(morgan("combined"));

    routerUrl.use(trailingSlashRedirect);

    routerUrl.get("", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '/opds/' +` +
            ` document.getElementById("url").value;` +
            `location.href = url;}</script>`;
        html += "</head>";

        html += "<body><h1>Publication OPDS</h1>";

        html += `<form onsubmit="go();return false;">` +
            `<input type="text" name="url" id="url" size="80">` +
            `<input type="submit" value="Go!"></form>`;

        html += "</body></html>";

        res.status(200).send(html);
    });

    routerUrl.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as any).urlEncoded = value;
        next();
    });

    routerUrl.get("/:urlEncoded(*)", (req: express.Request, res: express.Response) => {

        if (!req.params.urlEncoded) {
            req.params.urlEncoded = (req as any).urlEncoded;
        }

        let urlDecoded = req.params.urlEncoded;
        if (urlDecoded.substr(-1) === "/") {
            urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
        }
        debug(urlDecoded);
        request.get({
            headers: {},
            method: "GET",
            uri: urlDecoded,
        }).
            on("response", async (response: request.RequestResponse) => {

                const responseData = await streamToBufferPromise(response);
                const responseStr = responseData.toString("utf8");
                const responseXml = new xmldom.DOMParser().parseFromString(responseStr);
                const opds = XML.deserialize<OPDS>(responseXml, OPDS);
                opds.URL = urlDecoded;

                // breakLength: 100  maxArrayLength: undefined
                console.log(util.inspect(opds,
                    { showHidden: false, depth: 1000, colors: true, customInspect: true }));

                // debug(res.headers);
                // debug(res.headers["content-type"]);
                // debug(`HTTP response content-range: ${res.headers["content-range"]}`);
                // debug(`HTTP response content-length: ${res.headers["content-length"]}`);

                // streamToBufferPromise(res).then((buffer) => {
                //     // debug(`streamToBufferPromise: ${buffer.length}`);
                // }).catch((err) => {
                //     debug(err);
                // });

                // const urlDecodedBase64 = new Buffer(urlDecoded).toString("base64");
                // const redirect = req.originalUrl.substr(0, req.originalUrl.indexOf("/url/"))
                //     + "/pub/" + urlDecodedBase64 + "/";
                // debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
                // res.redirect(301, redirect);

                let html = "<html><head>";
                html += "</head>";
                html += "<body><h1>" + urlDecoded + "</h1>";
                html += "<h2>" + opds.Title + "</h2>";
                html += "<img src='" + opds.Icon + "' alt='' />";
                if (opds.Updated) {
                    html += "<h3>" + opds.Updated.toUTCString() + "</h3>";
                    html += "<h3>" + opds.Updated.toDateString() + "</h3>";
                    html += "<h3>" + opds.Updated.toISOString() + "</h3>";
                    html += "<h3>" + opds.Updated.toTimeString() + "</h3>";
                }

                if (opds.Links && opds.Links.length) {
                    html += "<p>";
                    opds.Links.forEach((link) => {
                        if (link.Type && link.Type.indexOf("opds-catalog") >= 0) {
                            html += "<a href='./" + link.Href
                                + "'>" + link.Href + "</a> (" + link.Title
                                + ") [" + link.Rel + "]<br/>";
                        }
                    });
                    html += "</p>";
                }

                if (opds.Entries && opds.Entries.length) {
                    opds.Entries.forEach((entry) => {
                        html += "<hr/>";
                        html += "<div>";
                        html += "<h3>" + entry.Title + "</h3>";
                        if (entry.Summary) {
                            if (entry.SummaryType === "text") {
                                html += "<strong>" + entry.Summary + "</strong>";
                            } else if (entry.SummaryType === "text") {
                                html += "<div>" + entry.Summary + "</div>";
                            }
                        }
                        if (entry.Content) {
                            if (entry.ContentType === "text") {
                                html += "<strong>" + entry.Content + "</strong>";
                            } else if (entry.ContentType === "text") {
                                html += "<div>" + entry.Content + "</div>";
                            }
                        }
                        if (entry.Links && entry.Links.length) {
                            let image: string | undefined;
                            let imageThumbnail: string | undefined;
                            let epub: string | undefined;
                            entry.Links.forEach((link) => {
                                if (link.Type === "application/epub+zip") {
                                    epub = link.Href;
                                }
                                if (link.Rel === "http://opds-spec.org/image") {
                                    image = link.Href;
                                }
                                if (link.Rel === "http://opds-spec.org/image/thumbnail") {
                                    imageThumbnail = link.Href;
                                }

                                if (link.Type && link.Type.indexOf("opds-catalog") >= 0) {
                                    html += "<a href='./" + link.Href
                                        + "'>" + link.Href + "</a> (" + link.Title
                                        + ") [" + link.Rel + "]<br/>";
                                }
                            });
                            if (imageThumbnail) {
                                if (image) {
                                    html += "<a href='" + image + "'><img src='"
                                        + imageThumbnail + "' alt='' /></a><br/>";
                                } else {
                                    html += "<img src='" + imageThumbnail + "' alt='' /><br/>";
                                }
                            } else if (image) {
                                html += "<img src='" + image + "' alt='' /><br/>";
                            }
                            if (epub) {
                                html += "<strong><a href='../url/" + epub + "'>" + epub + "</a></strong>";
                            }
                        }
                        html += "</div>";
                    });
                }

                html += "</body></html>";

                res.status(200).send(html);
            }).
            on("error", (err: any) => {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                    + err + "</p></body></html>");
            });
    });

    topRouter.use("/opds", routerUrl);
}
