import * as crypto from "crypto";
import * as path from "path";

import { mediaOverlayURLParam, mediaOverlayURLPath } from "@parser/epub";
import { PublicationParsePromise } from "@parser/publication-parser";
import { encodeURIComponent_RFC3986, isHTTP } from "@utils/http/UrlUtils";
import { sortObject, traverseJsonObjects } from "@utils/JsonUtils";
import * as css2json from "css2json";
import * as debug_ from "debug";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import { JSON as TAJSON } from "ta-json";

import { Server } from "./server";

const debug = debug_("r2:server:mediaoverlays");

export function serverMediaOverlays(server: Server, routerPathBase64: express.Router) {

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

    const routerMediaOverlays = express.Router({ strict: false });
    // routerMediaOverlays.use(morgan("combined"));

    routerMediaOverlays.get(["/", "/show/:" + mediaOverlayURLParam + "?"],
        async (req: express.Request, res: express.Response) => {

            if (!req.params.pathBase64) {
                req.params.pathBase64 = (req as any).pathBase64;
            }
            if (!req.params.lcpPass64) {
                req.params.lcpPass64 = (req as any).lcpPass64;
            }

            const isShow = req.url.indexOf("/show") >= 0 || req.query.show;

            // debug(req.method);
            const isHead = req.method.toLowerCase() === "head";
            if (isHead) {
                console.log("HEAD !!!!!!!!!!!!!!!!!!!");
            }

            const isCanonical = req.query.canonical && req.query.canonical === "true";

            const isSecureHttp = req.secure ||
                req.protocol === "https" ||
                req.get("X-Forwarded-Proto") === "https"
                // (req.headers.host && req.headers.host.indexOf("now.sh") >= 0) ||
                // (req.hostname && req.hostname.indexOf("now.sh") >= 0)
                ;

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

            const rootUrl = (isSecureHttp ? "https://" : "http://")
                + req.headers.host + "/pub/"
                + (req.params.lcpPass64 ?
                    (server.lcpBeginToken + encodeURIComponent_RFC3986(req.params.lcpPass64) + server.lcpEndToken) :
                    "")
                + encodeURIComponent_RFC3986(req.params.pathBase64);

            function absoluteURL(href: string): string {
                return rootUrl + "/" + href;
            }

            function absolutizeURLs(jsonObj: any) {
                traverseJsonObjects(jsonObj,
                    (obj) => {
                        if (obj.text && typeof obj.text === "string"
                            && !isHTTP(obj.text)) {
                            // obj.text_ = obj.text;
                            obj.text = absoluteURL(obj.text);
                        }

                        if (obj.audio && typeof obj.audio === "string"
                            && !isHTTP(obj.audio)) {
                            // obj.audio_ = obj.audio;
                            obj.audio = absoluteURL(obj.audio);
                        }
                    });
            }

            let objToSerialize: any = null;

            const resource = isShow ?
                (req.query.show ? req.query.show : req.params[mediaOverlayURLParam]) :
                req.query[mediaOverlayURLParam];
            if (resource && resource !== "all") {
                objToSerialize = publication.FindMediaOverlayByHref(resource);
            } else {
                objToSerialize = publication.FindAllMediaOverlay();
            }

            if (!objToSerialize) {
                objToSerialize = [];
            }

            let jsonObj = TAJSON.serialize(objToSerialize);
            jsonObj = { "media-overlay": jsonObj };

            if (isShow) {
                absolutizeURLs(jsonObj);

                // const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

                // // breakLength: 100  maxArrayLength: undefined
                // const dumpStr = util.inspect(objToSerialize,
                //     { showHidden: false, depth: 1000, colors: false, customInspect: true });

                const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

                res.status(200).send("<html><body>" +
                    "<h1>" + path.basename(pathBase64Str) + "</h1>" +
                    "<p><pre>" + jsonPretty + "</pre></p>" +
                    // "<p><pre>" + jsonStr + "</pre></p>" +
                    // "<p><pre>" + dumpStr + "</pre></p>" +
                    "</body></html>");
            } else {
                // absolutizeURLs(jsonObj);

                server.setResponseCORS(res);
                res.set("Content-Type", "application/vnd.readium.mo+json; charset=utf-8");

                const jsonStr = isCanonical ?
                    global.JSON.stringify(sortObject(jsonObj), null, "") :
                    global.JSON.stringify(jsonObj, null, "  ");

                const checkSum = crypto.createHash("sha256");
                checkSum.update(jsonStr);
                const hash = checkSum.digest("hex");

                const match = req.header("If-None-Match");
                if (match === hash) {
                    debug("smil cache");
                    res.status(304); // StatusNotModified
                    res.end();
                    return;
                }

                res.setHeader("ETag", hash);
                res.status(200);

                if (isHead) {
                    res.end();
                } else {
                    res.send(jsonStr);
                }
            }
        });

    routerPathBase64.use("/:pathBase64/" + mediaOverlayURLPath, routerMediaOverlays);
}
