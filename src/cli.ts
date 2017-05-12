import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { Publication } from "./models/publication";
import { CbzParser } from "./parser/cbz";
import { EpubParser } from "./parser/epub";

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

if (ext === ".epub") {

    EpubParser.load(filePath)
        .then((publication) => {
            console.log("== EpubParser: resolve");
            dumpPublication(publication);
        }).catch((err) => {
            console.log("== EpubParser: reject");
            console.log(err);
        });

} else if (ext === ".cbz") {

    CbzParser.load(filePath)
        .then((publication) => {
            console.log("== CbzParser: resolve");
            dumpPublication(publication);
        }).catch((err) => {
            console.log("== CbzParser: reject");
            console.log(err);
        });
}

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

// console.log("~~~~~~~~~~~~~~~");

// const meta1 = new Metadata();
// meta1.RDFType = "test single";
// meta1.Title = "title OK";

// const meta1JsonObj = JSON.serialize(meta1);
// const meta1JsonStr = JSON.stringify(sortObject(meta1JsonObj));
// console.log(meta1JsonStr);

// const meta1Reversed = JSON.deserialize<Metadata>(meta1JsonObj, Metadata);
// console.log(meta1Reversed);

// console.log("===============");

// const meta2 = new Metadata();
// meta2.RDFType = "test multiple";
// meta2.Title = {} as IStringMap;
// meta2.Title["fr-FR"] = "title FR";
// meta2.Title["en-US"] = "title EN";

// const meta2JsonObj = JSON.serialize(meta2);
// const meta2JsonStr = JSON.stringify(sortObject(meta2JsonObj));
// console.log(meta2JsonStr);

// const meta2Reversed = JSON.deserialize<Metadata>(meta2JsonObj, Metadata);
// console.log(meta2Reversed);

// console.log("===============");
// console.log("===============");

// let mo1 = new MediaOverlayNode();

// mo1.Audio = "test.mp3";

// mo1.Role = Array<string>(2);
// mo1.Role[0] = "role1";
// mo1.Role.push("role3");
// mo1.Role[1] = "role2";
// mo1.Role.push("role4");

// let mo2 = new MediaOverlayNode();
// mo2.Text = "Tz";

// mo1.Children = Array<MediaOverlayNode>();
// mo1.Children.push(mo2);

// let json = JSON.serialize(mo1);
// console.log(json);

// let jsonString = global.JSON.stringify(json);
// console.log(jsonString);

// let jsonObject = global.JSON.parse(jsonString);
// console.log(jsonObject);

// console.log("---------------");

// let mo4 = JSON.deserialize<MediaOverlayNode>(json, MediaOverlayNode, { runConstructor: true });
// console.log(mo4 instanceof MediaOverlayNode);
// console.log(mo4);
// // console.log(mo4.info);

// console.log("~~~~~~~~~~~~~~~");

// // let jsonStr = JSON.stringify(mo1);
// // console.log(jsonStr);

// // console.log("---------------");

// // let mo3 = JSON.parse<MediaOverlayNode>(jsonStr, MediaOverlayNode, { runConstructor: true });
// // console.log(mo3 instanceof MediaOverlayNode);
// // console.log(mo3);
// // // console.log(mo3.info);

// // console.log("---------------");
