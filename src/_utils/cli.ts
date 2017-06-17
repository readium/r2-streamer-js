import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { CbzParsePromise } from "@parser/cbz";
import { EpubParsePromise } from "@parser/epub";

import { Publication } from "@models/publication";

console.log("process.cwd():");
console.log(process.cwd());

console.log("__dirname: ");
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

// tslint:disable-next-line:no-floating-promises
(async () => {

    if (ext === ".epub") {

        let publication: Publication | undefined;
        try {
            publication = await EpubParsePromise(filePath);
        } catch (err) {
            console.log("== EpubParser: reject");
            console.log(err);
            return;
        }
        console.log("== EpubParser: resolve: " + publication.Links);
        // dumpPublication(publication);

    } else if (ext === ".cbz") {

        let publication: Publication | undefined;
        try {
            publication = await CbzParsePromise(filePath);
        } catch (err) {
            console.log("== CbzParser: reject");
            console.log(err);
            return;
        }
        // if (!publication) {
        //     console.log("== CbzParser: nil resolve");
        //     return;
        // }

        console.log("== CbzParser: resolve");
        dumpPublication(publication);
    }
})();

export function dumpPublication(publication: Publication) {

    console.log("#### RAW OBJECT:");

    // breakLength: 100  maxArrayLength: undefined
    console.log(util.inspect(publication,
        { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    // console.log("#### RAW JSON:");
    // const publicationJsonObj = JSON.serialize(publication);
    // console.log(publicationJsonObj);

    // console.log("#### PRETTY JSON:");
    // const publicationJsonStr = global.JSON.stringify(publicationJsonObj, null, "  ");
    // console.log(publicationJsonStr);

    // console.log("#### CANONICAL JSON:");
    // const publicationJsonStrCanonical = JSON.stringify(sortObject(publicationJsonObj));
    // console.log(publicationJsonStrCanonical);
}
