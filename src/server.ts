import { JSON } from "ta-json";

import * as express from "express";

import * as morgan from "morgan";

import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { dumpPublication, processEPUB, sortObject } from "./cli";

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
const port = 3000;

const filePathBase64 = new Buffer(filePath).toString("base64");

const urlRoot = "http://localhost:" + port + "/pub/";
const urlBook = urlRoot + filePathBase64 + "/manifest.json";
const urlBookShowAll = urlBook + "/show/all";

server.get("/", (req: express.Request, res: express.Response) => {
    res.status(200).send("<html><body><p>OK</p><p><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></p></body></html>");
});

const routerManifestJson = express.Router();
// routerManifestJson.use(morgan("combined"));

routerManifestJson.get(["/", "/show/:jsonPath?"],
    (req: express.Request, res: express.Response) => {

        console.log("€€€€€€€€€€€€€€€€€€€€€€€€€€€€€");
        console.log(req.url);

        console.log(req.params);
        if (!req.params.pathBase64) {
            req.params.pathBase64 = (req as any).pathBase64;
        }
        console.log(req.params);
        console.log("€€€€€€€€€€€€€€€€€€€€€€€€€€€€€");

        const path = new Buffer(req.params.pathBase64, "base64").toString("utf8");

        processEPUB(filePath)
            .then((publication) => {
                console.log("== EpubParser: resolve");
                // dumpPublication(publication);

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

                    res.status(200).send("<html><body>" +
                        "<h2>" + path + "</h2>" +
                        "<p><pre>" + jsonStr + "</pre></p>" +
                        "</body></html>");
                } else {
                    const publicationJsonObj = JSON.serialize(publication);
                    const publicationJsonStr = global.JSON.stringify(sortObject(publicationJsonObj), null, "");
                    res.type("json").send(publicationJsonStr);
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

routerPathBase64.use("/:pathBase64/manifest.json", routerManifestJson);
routerPathBase64.get("/:pathBase64", (req: express.Request, res: express.Response) => {
    res.status(200).send("<html><body><p>OK</p><p><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></p></body></html>");
});

server.use("/pub", routerPathBase64);

server.listen(port, () => {
    console.log(urlRoot);
    console.log(urlBook);
});
