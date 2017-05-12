import * as crypto from "crypto";
import * as util from "util";

import * as express from "express";
import { JSON } from "ta-json";

import { EpubParser } from "./parser/epub";
import { sortObject } from "./utils";

export function serverMediaOverlays(routerPathBase64: express.Router) {

    const routerMediaOverlays = express.Router({ strict: false });
    // routerMediaOverlays.use(morgan("combined"));

    routerMediaOverlays.get(["", "/show/:" + EpubParser.mediaOverlayURLParam + "?"],
        (req: express.Request, res: express.Response) => {

            if (!req.params.pathBase64) {
                req.params.pathBase64 = (req as any).pathBase64;
            }

            const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

            EpubParser.load(pathBase64Str)
                .then((publication) => {
                    console.log("== EpubParser: resolve");
                    // dumpPublication(publication);

                    const isShow = req.url.indexOf("/show") >= 0;

                    let objToSerialize: any = null;

                    const resource = isShow ? req.params[EpubParser.mediaOverlayURLParam] :
                        req.query[EpubParser.mediaOverlayURLParam];
                    if (resource && resource !== "all") {
                        objToSerialize = publication.FindMediaOverlayByHref(resource);
                    } else {
                        objToSerialize = publication.FindAllMediaOverlay();
                    }

                    if (!objToSerialize) {
                        objToSerialize = [];
                    }

                    let jsonObj = JSON.serialize(objToSerialize);
                    jsonObj = { "media-overlay": jsonObj };

                    if (isShow) {
                        const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

                        // breakLength: 100  maxArrayLength: undefined
                        const dumpStr = util.inspect(objToSerialize,
                            { showHidden: false, depth: 1000, colors: false, customInspect: true });

                        res.status(200).send("<html><body>" +
                            "<h2>" + pathBase64Str + "</h2>" +
                            "<p><pre>" + jsonStr + "</pre></p>" +
                            "<p><pre>" + dumpStr + "</pre></p>" +
                            "</body></html>");
                    } else {
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        res.set("Content-Type", "application/vnd.readium.mo+json; charset=utf-8");

                        const jsonStr = global.JSON.stringify(sortObject(jsonObj), null, "");

                        const checkSum = crypto.createHash("sha256");
                        checkSum.update(jsonStr);
                        const hash = checkSum.digest("hex");

                        const match = req.header("If-None-Match");
                        if (match === hash) {
                            res.status(304); // StatusNotModified
                            return;
                        }

                        res.setHeader("ETag", hash);
                        res.status(200).send(jsonStr);
                    }
                }).catch((err) => {
                    console.log("== EpubParser: reject");
                    console.log(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                });
        });

    routerPathBase64.use("/:pathBase64/" + EpubParser.mediaOverlayURLPath, routerMediaOverlays);
}
