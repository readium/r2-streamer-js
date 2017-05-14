import * as crypto from "crypto";
import * as debug_ from "debug";
import * as path from "path";
import * as util from "util";

import * as express from "express";
import { JSON } from "ta-json";

import { EpubParsePromise, mediaOverlayURLParam, mediaOverlayURLPath } from "./parser/epub";
import { Server } from "./server";
import { sortObject } from "./utils";

const debug = debug_("r2:server:mediaoverlays");

export function serverMediaOverlays(server: Server, routerPathBase64: express.Router) {

    const routerMediaOverlays = express.Router({ strict: false });
    // routerMediaOverlays.use(morgan("combined"));

    routerMediaOverlays.get(["", "/show/:" + mediaOverlayURLParam + "?"],
        async (req: express.Request, res: express.Response) => {

            if (!req.params.pathBase64) {
                req.params.pathBase64 = (req as any).pathBase64;
            }

            const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

            let publication = server.cachedPublication(pathBase64Str);
            if (!publication) {
                publication = await EpubParsePromise(pathBase64Str);
                server.cachePublication(pathBase64Str, publication);
            }
            // dumpPublication(publication);

            const isShow = req.url.indexOf("/show") >= 0;

            const opfInternal = publication.Internal.find((i) => {
                if (i.Name === "rootfile") {
                    return true;
                }
                return false;
            });
            const rootfilePath = opfInternal ? opfInternal.Value as string : undefined;

            let objToSerialize: any = null;

            let resource = isShow ? req.params[mediaOverlayURLParam] :
                req.query[mediaOverlayURLParam];
            if (resource && resource !== "all") {
                objToSerialize = publication.FindMediaOverlayByHref(resource);

                if (rootfilePath && !objToSerialize) {
                    resource = path.relative(path.dirname(rootfilePath), resource)
                        .replace(/\\/g, "/");

                    objToSerialize = publication.FindMediaOverlayByHref(resource);
                }
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
