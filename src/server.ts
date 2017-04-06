import { JSON } from "ta-json";

import * as express from "express";

import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { dumpPublication, processEPUB } from "./cli";

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

const urlRoot = "http://localhost:" + port + "/";
const urlBook = urlRoot + filePathBase64 + "/manifest.json";

server.get("/", (req: express.Request, res: express.Response) => {
    res.status(200).send("<html><body><p>OK</p><p><a href='" + urlBook + "'>" + urlBook + "</a></p></body></html>");
});

server.get("/:pathBase64/manifest.json", (req: express.Request, res: express.Response) => {
    if (req.params.pathBase64 !== filePathBase64) {
        res.status(403).send("<html><body><p>Forbidden</p><p>INVALID parameter: "
            + req.params.pathBase64 + "</p></body></html>");
        return;
    }
    const path = new Buffer(req.params.pathBase64, "base64").toString("utf8");

    processEPUB(filePath)
        .then((publication) => {
            console.log("== EpubParser: resolve");
            dumpPublication(publication);

            const publicationJsonObj = JSON.serialize(publication);
            const publicationJsonStr = global.JSON.stringify(publicationJsonObj, null, "    ");

            res.status(200).send("<html><body><p>OK</p><p>"
                + req.params.pathBase64 + "</p><p>" + path + "</p><p><pre>"
                + publicationJsonStr + "</pre></p></body></html>");
        }).catch((err) => {
            console.log("== EpubParser: reject");
            console.log(err);
            res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
        });
});

server.listen(port, () => {
    console.log(urlRoot);
    console.log(urlBook);
});
