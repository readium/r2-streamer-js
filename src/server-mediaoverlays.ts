import * as crypto from "crypto";
import * as debug_ from "debug";
import * as path from "path";
import * as util from "util";

import * as express from "express";
import { JSON as TAJSON } from "ta-json";

import { sortObject } from "./_utils/JsonUtils";
import { CbzParsePromise } from "./parser/cbz";
import { EpubParsePromise, mediaOverlayURLParam, mediaOverlayURLPath } from "./parser/epub";
import { Server } from "./server";

const debug = debug_("r2:server:mediaoverlays");

export function serverMediaOverlays(server: Server, routerPathBase64: express.Router) {

    const routerMediaOverlays = express.Router({ strict: false });
    // routerMediaOverlays.use(morgan("combined"));

    routerMediaOverlays.get(["/", "/show/:" + mediaOverlayURLParam + "?"],
        async (req: express.Request, res: express.Response) => {

            if (!req.params.pathBase64) {
                req.params.pathBase64 = (req as any).pathBase64;
            }

            const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

            let publication = server.cachedPublication(pathBase64Str);
            if (!publication) {

                const fileName = path.basename(pathBase64Str);
                const ext = path.extname(fileName).toLowerCase();

                try {
                    publication = ext === ".epub" ?
                        await EpubParsePromise(pathBase64Str) :
                        await CbzParsePromise(pathBase64Str);
                } catch (err) {
                    debug(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }

                server.cachePublication(pathBase64Str, publication);
            }
            // dumpPublication(publication);

            const isShow = req.url.indexOf("/show") >= 0;

            let objToSerialize: any = null;

            const resource = isShow ? req.params[mediaOverlayURLParam] :
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
                const jsonStr = global.JSON.stringify(jsonObj, null, "    ");

                // breakLength: 100  maxArrayLength: undefined
                const dumpStr = util.inspect(objToSerialize,
                    { showHidden: false, depth: 1000, colors: false, customInspect: true });

                res.status(200).send("<html><body>" +
                    "<h1>" + path.basename(pathBase64Str) + "</h1>" +
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
                    debug("smil cache");
                    res.status(304); // StatusNotModified
                    return;
                }

                res.setHeader("ETag", hash);
                res.status(200).send(jsonStr);
            }
        });

    routerPathBase64.use("/:pathBase64/" + mediaOverlayURLPath, routerMediaOverlays);
}
