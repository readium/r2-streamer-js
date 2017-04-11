import { JSON } from "ta-json";

import * as express from "express";

import * as mime from "mime-types";

import * as morgan from "morgan";

import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import * as url from "url";

import * as crypto from "crypto";

import { EpubParser } from "./parser/epub";

import { Publication } from "./models/publication";

import { dumpPublication, processEPUB, sortObject } from "./cli";
import { Link } from "./models/publication-link";

console.log("process.cwd():");
console.log(process.cwd());

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

let filePath = args[0];
if (!filePath) {
    console.log("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}

filePath = filePath.trim();
console.log(filePath);
if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, filePath);
    console.log(filePath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), filePath);
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            console.log("FILEPATH DOES NOT EXIST.");
            process.exit(1);
        }
    }
}

const fileName = path.basename(filePath);
const ext = path.extname(fileName).toLowerCase();

const server = express();
const port = process.env.PORT || 3000;

const filePathBase64 = new Buffer(filePath).toString("base64");

const urlBook = "./pub/" + filePathBase64 + "/manifest.json";
const urlBookShowAll = urlBook + "/show/all";

server.get("/", (req: express.Request, res: express.Response) => {
    res.status(200).send("<html><body><p>OK</p><p><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></p></body></html>");
});

const routerMediaOverlays = express.Router();
// routerMediaOverlays.use(morgan("combined"));

routerMediaOverlays.get(["", "/show/:" + EpubParser.mediaOverlayURLParam + "?"],
    (req: express.Request, res: express.Response) => {

        if (!req.params.pathBase64) {
            req.params.pathBase64 = (req as any).pathBase64;
        }

        const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

        processEPUB(filePath)
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

const routerManifestJson = express.Router();
// routerManifestJson.use(morgan("combined"));

routerManifestJson.get(["/", "/show/:jsonPath?"],
    (req: express.Request, res: express.Response) => {

        if (!req.params.pathBase64) {
            req.params.pathBase64 = (req as any).pathBase64;
        }

        const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

        processEPUB(filePath)
            .then((publication) => {
                console.log("== EpubParser: resolve");
                // dumpPublication(publication);

                // console.log(req.url); // path local to this router
                // console.log(req.baseUrl); // path local to above this router
                // console.log(req.originalUrl); // full path (req.baseUrl + req.url)
                // url.parse(req.originalUrl, false).host
                // req.headers.host has port, not req.hostname

                const rootUrl = "http://" + req.headers.host + "/pub/" + req.params.pathBase64;
                const manifestURL = rootUrl + "/manifest.json";
                publication.AddLink("application/webpub+json", ["self"], manifestURL, false);

                let hasMO = false;
                if (publication.Spine) {
                    const link = publication.Spine.find((l) => {
                        if (l.Properties && l.Properties.MediaOverlay) {
                            return true;
                        }
                        return false;
                    });
                    if (link) {
                        hasMO = true;
                    }
                }
                if (hasMO) {
                    const moURL = rootUrl + "/" + EpubParser.mediaOverlayURLPath +
                        "?" + EpubParser.mediaOverlayURLParam + "={path}";
                    publication.AddLink("application/vnd.readium.mo+json", ["media-overlay"], moURL, true);
                }
                if (req.url.indexOf("/show") >= 0) {
                    let objToSerialize: any = null;

                    if (req.params.jsonPath) {
                        switch (req.params.jsonPath) {

                            case "all": {
                                objToSerialize = publication;
                                break;
                            }
                            case "cover": {
                                objToSerialize = publication.GetCover();
                                break;
                            }
                            case "mediaoverlays": {
                                objToSerialize = publication.FindAllMediaOverlay();
                                break;
                            }
                            case "spine": {
                                objToSerialize = publication.Spine;
                                break;
                            }
                            case "pagelist": {
                                objToSerialize = publication.PageList;
                                break;
                            }
                            case "landmarks": {
                                objToSerialize = publication.Landmarks;
                                break;
                            }
                            case "links": {
                                objToSerialize = publication.Links;
                                break;
                            }
                            case "resources": {
                                objToSerialize = publication.Resources;
                                break;
                            }
                            case "toc": {
                                objToSerialize = publication.TOC;
                                break;
                            }
                            case "metadata": {
                                objToSerialize = publication.Metadata;
                                break;
                            }
                            default: {
                                objToSerialize = null;
                            }
                        }
                    } else {
                        objToSerialize = publication;
                    }

                    if (!objToSerialize) {
                        objToSerialize = {};
                    }

                    const jsonObj = JSON.serialize(objToSerialize);
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
                    res.set("Content-Type", "application/webpub+json; charset=utf-8");

                    const publicationJsonObj = JSON.serialize(publication);
                    const publicationJsonStr = global.JSON.stringify(sortObject(publicationJsonObj), null, "");

                    const checkSum = crypto.createHash("sha256");
                    checkSum.update(publicationJsonStr);
                    const hash = checkSum.digest("hex");

                    const match = req.header("If-None-Match");
                    if (match === hash) {
                        res.status(304); // StatusNotModified
                        return;
                    }

                    res.setHeader("ETag", hash);

                    const links = publication.GetPreFetchResources();
                    if (links && links.length) {
                        let prefetch = "";
                        links.forEach((l) => {
                            prefetch += "<" + l.Href + ">;" + "rel=prefetch,";
                        });

                        res.setHeader("Link", prefetch);
                    }

                    // res.setHeader("Cache-Control", "public,max-age=86400");

                    res.status(200).send(publicationJsonStr);
                }
            }).catch((err) => {
                console.log("== EpubParser: reject");
                console.log(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            });
    });

const routerAssets = express.Router();
// routerAssets.use(morgan("combined"));

routerAssets.get("/",
    (req: express.Request, res: express.Response) => {

        if (!req.params.pathBase64) {
            req.params.pathBase64 = (req as any).pathBase64;
        }
        if (!req.params.asset) {
            req.params.asset = (req as any).asset;
        }

        const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

        processEPUB(filePath)
            .then((publication) => {
                console.log("== EpubParser: resolve");
                // dumpPublication(publication);

                if (!publication.Internal) {
                    const err = "No publication internals!";
                    console.log(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                    return;
                }

                const zipInternal = publication.Internal.find((i) => {
                    if (i.Name === "zip") {
                        return true;
                    }
                    return false;
                });
                if (!zipInternal) {
                    const err = "No publication zip!";
                    console.log(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                    return;
                }
                const zip = zipInternal.Value;

                const opfInternal = publication.Internal.find((i) => {
                    if (i.Name === "rootfile") {
                        return true;
                    }
                    return false;
                });
                const rootfilePath = opfInternal ? opfInternal.Value as string : "EPUB/package.opf";

                let pathInZip = req.params.asset;

                if (Object.keys(zip.entries()).indexOf(pathInZip) < 0) {
                    // FIRST FAIL ...
                    // let's try to adjust the path, make it relative to the OPF package
                    // (support for legacy incorrect implementation)
                    pathInZip = path.join(path.dirname(rootfilePath), pathInZip);
                }

                if (Object.keys(zip.entries()).indexOf(pathInZip) < 0) {
                    const err = "Asset not in zip!";
                    console.log(err);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                    return;
                }

                let link: Link | undefined;

                if (pathInZip.indexOf("META-INF/") !== 0
                    && !pathInZip.endsWith(".opf")
                    && publication.Resources) {

                    const relativePath = path.relative(path.dirname(rootfilePath), pathInZip);

                    link = publication.Resources.find((l) => {
                        if (l.Href === relativePath) {
                            return true;
                        }
                        return false;
                    });
                    if (!link) {
                        link = publication.Spine.find((l) => {
                            if (l.Href === relativePath) {
                                return true;
                            }
                            return false;
                        });
                    }
                    if (!link) {
                        const err = "Asset not declared in publication spine/resources!";
                        console.log(err);
                        res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                            + err + "</p></body></html>");
                        return;
                    }
                }

                const mediaType = mime.lookup(pathInZip);
                const isText = mediaType && (
                    mediaType.indexOf("text/") === 0 ||
                    mediaType.indexOf("application/xhtml") === 0 ||
                    mediaType.indexOf("application/xml") === 0 ||
                    mediaType.indexOf("application/json") === 0 ||
                    mediaType.indexOf("application/svg") === 0 ||
                    mediaType.indexOf("application/smil") === 0 ||
                    mediaType.indexOf("+json") > 0 ||
                    mediaType.indexOf("+smil") > 0 ||
                    mediaType.indexOf("+svg") > 0 ||
                    mediaType.indexOf("+xhtml") > 0 ||
                    mediaType.indexOf("+xml") > 0);

                let zipData = zip.entryDataSync(pathInZip) as Buffer;

                if (link && link.Properties && link.Properties.Encrypted) {
                    if (link.Properties.Encrypted.Algorithm === "http://www.idpf.org/2008/embedding") {

                        let pubID = publication.Metadata.Identifier;
                        pubID = pubID.replace(/\s/g, "");

                        const checkSum = crypto.createHash("sha1");
                        checkSum.update(pubID);
                        // const hash = checkSum.digest("hex");
                        // console.log(hash);
                        const key = checkSum.digest();

                        const prefixLength = 1040;
                        const zipDataPrefix = zipData.slice(0, prefixLength);

                        for (let i = 0; i < prefixLength; i++) {
                            /* tslint:disable:no-bitwise */
                            zipDataPrefix[i] = zipDataPrefix[i] ^ (key[i % key.length]);
                        }

                        const zipDataRemainder = zipData.slice(prefixLength);
                        zipData = Buffer.concat([zipDataPrefix, zipDataRemainder]);

                    } else if (link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC") {

                        let pubID = publication.Metadata.Identifier;
                        pubID = pubID.replace("urn:uuid:", "");
                        pubID = pubID.replace(/-/g, "");
                        pubID = pubID.replace(/\s/g, "");

                        const key = [];
                        for (let i = 0; i < 16; i++) {
                            const byteHex = pubID.substr(i * 2, 2);
                            const byteNumer = parseInt(byteHex, 16);
                            key.push(byteNumer);
                        }

                        const prefixLength = 1024;
                        const zipDataPrefix = zipData.slice(0, prefixLength);

                        for (let i = 0; i < prefixLength; i++) {
                            /* tslint:disable:no-bitwise */
                            zipDataPrefix[i] = zipDataPrefix[i] ^ (key[i % key.length]);
                        }

                        const zipDataRemainder = zipData.slice(prefixLength);
                        zipData = Buffer.concat([zipDataPrefix, zipDataRemainder]);

                    } else if (link.Properties.Encrypted.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc") {
                        // TODO LCP userKey --> contentKey
                    }
                }

                if (req.query.show) {
                    res.status(200).send("<html><body>" +
                        "<h2>" + pathBase64Str + "</h2>" +
                        "<h3>" + mediaType + "</h3>" +
                        (isText ?
                            ("<p><pre>" +
                                zipData.toString("utf8").replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    .replace(/"/g, "&quot;")
                                    .replace(/'/g, "&apos;") +
                                "</pre></p>")
                            : "<p>BINARY</p>"
                        ) + "</body></html>");
                } else {
                    res.setHeader("Access-Control-Allow-Origin", "*");

                    res.setHeader("Cache-Control", "public,max-age=86400");

                    // res.set("Content-Type", mediaType);
                    res.type(mediaType);

                    if (isText) {
                        res.status(200).send(zipData.toString("utf8"));
                    } else {
                        res.status(200).end(zipData, "binary");
                    }
                }
            }).catch((err) => {
                console.log("== EpubParser: reject");
                console.log(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
            });
    });

const routerPathBase64 = express.Router();
routerPathBase64.use(morgan("combined"));

routerPathBase64.param("pathBase64", (req, res, next, value, name) => {
    if (value === filePathBase64) {
        (req as any).pathBase64 = value;
        next();
    } else {
        res.status(403).send("<html><body><p>Forbidden</p><p>INVALID parameter: <code>"
            + req.params.pathBase64 + "</code></p></body></html>");
        // next(new Error("INVALID file param"));
    }
});

routerPathBase64.param("asset", (req, res, next, value, name) => {
    (req as any).asset = value;
    next();
});

routerPathBase64.use("/:pathBase64/manifest.json", routerManifestJson);
routerPathBase64.use("/:pathBase64/" + EpubParser.mediaOverlayURLPath, routerMediaOverlays);
routerPathBase64.use("/:pathBase64/:asset(*)", routerAssets);
routerPathBase64.get("/:pathBase64", (req: express.Request, res: express.Response) => {
    res.status(200).send("<html><body><p>OK</p><p><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></p></body></html>");
});

server.use("/pub", routerPathBase64);

server.listen(port, () => {
    console.log("http://localhost:" + port);
    console.log(urlBook);
});
