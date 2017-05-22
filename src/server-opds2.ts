import * as crypto from "crypto";
import * as debug_ from "debug";

import * as css2json from "css2json";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import { JSON as TAJSON } from "ta-json";

import { Link } from "./models/publication-link";
import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";
import { isHTTP, sortObject } from "./utils";

const debug = debug_("r2:server:opds2");

export function serverOPDS2(server: Server, topRouter: express.Router) {

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

    const routerOPDS2 = express.Router({ strict: false });
    // routerOPDS2.use(morgan("combined"));

    routerOPDS2.get(["/", "/show/:jsonPath?"],
        (req: express.Request, res: express.Response) => {

            const isSecureHttp = req.secure ||
                req.protocol === "https" ||
                req.get("X-Forwarded-Proto") === "https"
                // (req.headers.host && req.headers.host.indexOf("now.sh") >= 0) ||
                // (req.hostname && req.hostname.indexOf("now.sh") >= 0)
                ;

            const rootUrl = (isSecureHttp ? "https://" : "http://")
                + req.headers.host;
            const selfURL = rootUrl + "/opds2/publications.json";

            const publications = server.publicationsOPDS();
            if (!publications) {
                const err = "Publications OPDS2 feed not available yet, try again later.";
                debug(err);
                res.status(503).send("<html><body><p>Resource temporarily unavailable</p><p>"
                    + err + "</p></body></html>");
                return;
            }

            if (!publications.Links || !publications.Links.find((link) => {
                return link.Rel && link.Rel.indexOf("self") >= 0;
            })) {
                publications.Links = Array<Link>();
                const selfLink = new Link();
                selfLink.Href = selfURL;
                selfLink.TypeLink = "application/opds+json";
                selfLink.AddRel("self");
                publications.Links.push(selfLink);
            }

            function absoluteURL(href: string): string {
                return rootUrl + "/pub/" + href;
            }

            function absolutizeURLs(jsonObj: any) {
                traverseJsonObjects(jsonObj,
                    (obj) => {
                        if (obj.href && typeof obj.href === "string"
                            && !isHTTP(obj.href)) {
                            obj.href_ = obj.href;
                            obj.href = absoluteURL(obj.href);
                        }
                    });
            }

            if (req.url.indexOf("/show") >= 0) {
                let objToSerialize: any = null;

                if (req.params.jsonPath) {
                    switch (req.params.jsonPath) {

                        case "all": {
                            objToSerialize = publications;
                            break;
                        }
                        case "metadata": {
                            objToSerialize = publications.Metadata;
                            break;
                        }
                        case "links": {
                            objToSerialize = publications.Links;
                            break;
                        }
                        case "publications": {
                            objToSerialize = publications.Publications;
                            break;
                        }
                        default: {
                            objToSerialize = null;
                        }
                    }
                } else {
                    objToSerialize = publications;
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

                res.status(200).send("<html><body>" +
                    "<h1>OPDS2 JSON feed</h1>" +
                    "<hr><p><pre>" + jsonPretty + "</pre></p>" +
                    // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                    // "<p><pre>" + dumpStr + "</pre></p>" +
                    "</body></html>");
            } else {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.set("Content-Type", "application/opds+json; charset=utf-8");

                const publicationsJsonObj = TAJSON.serialize(publications);

                absolutizeURLs(publicationsJsonObj);

                const publicationsJsonStr = global.JSON.stringify(sortObject(publicationsJsonObj), null, "");

                const checkSum = crypto.createHash("sha256");
                checkSum.update(publicationsJsonStr);
                const hash = checkSum.digest("hex");

                const match = req.header("If-None-Match");
                if (match === hash) {
                    debug("publications.json cache");
                    res.status(304); // StatusNotModified
                    return;
                }

                res.setHeader("ETag", hash);

                // res.setHeader("Cache-Control", "public,max-age=86400");

                res.status(200).send(publicationsJsonStr);
            }
        });

    const routerOPDS2_ = express.Router({ strict: false });
    // routerOPDS2_.use(morgan("combined"));

    routerOPDS2_.use(trailingSlashRedirect);

    routerOPDS2_.get("/", (req: express.Request, res: express.Response) => {

        const i = req.originalUrl.indexOf("?");

        let pathWithoutQuery = req.originalUrl;
        if (i >= 0) {
            pathWithoutQuery = pathWithoutQuery.substr(0, i);
        }

        let redirect = pathWithoutQuery +
            (pathWithoutQuery.substr(-1) === "/" ? "" : "/") +
            "publications.json/show";
        if (i >= 0) {
            redirect += req.originalUrl.substr(i);
        }

        debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
        res.redirect(301, redirect);
    });

    routerOPDS2_.use("/publications.json", routerOPDS2);

    topRouter.use("/opds2", routerOPDS2_);
}

function traverseJsonObjects(obj: any, func: (item: any) => void) {
    func(obj);

    if (obj instanceof Array) {
        obj.forEach((item) => {
            if (item) {
                traverseJsonObjects(item, func);
            }
        });
    } else if (typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
            if (obj.hasOwnProperty(key) && obj[key]) {
                traverseJsonObjects(obj[key], func);
            }
        });
    }
}
