import * as path from "path";

import { Entry } from "@opds/opds1/opds-entry";
import { OPDSPublicationMetadata } from "@opds/opds2/opds2-publicationMetadata";
import { XML } from "@utils/xml-js-mapper";
import { test } from "ava";
import { JSON as TAJSON } from "ta-json";
import * as xmldom from "xmldom";

import { setLcpNativePluginPath } from "@parser/epub/lcp";
import { initGlobals } from "../src/init-globals";
import {
    checkDate,
    checkType,
    checkType_String,
    inspect,
    logJSON,
} from "./helpers";

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP", "lcp.node"));

// ==========================

const date = new Date();
// 31st December (0-based index) 2000
date.setUTCFullYear(2000, 11, 31);
// 23 hours, 59 minutes, 59 seconds, 999 milliseconds
date.setUTCHours(23, 59, 59, 999);

const dateSTR = "2000-12-31T23:59:59.999Z";

// ==========================

test("JSON SERIALIZE: OPDSPublicationMetadata.Modified => Date", (t) => {

    const md = new OPDSPublicationMetadata();
    md.Modified = date;
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_String(t, json.modified);
    t.is(json.modified, dateSTR);
});

// ==========================

test("JSON DESERIALIZE: OPDSPublicationMetadata.Modified => Date", (t) => {

    const json: any = {};
    json.modified = dateSTR;
    logJSON(json);

    const md: OPDSPublicationMetadata = TAJSON.deserialize<OPDSPublicationMetadata>(json, OPDSPublicationMetadata);
    inspect(md);

    checkType(t, md.Modified, Date);
    checkDate(t, md.Modified, date);
});

// ==========================

// SERIALIZATION not implemented in xml-js-mapper!
// test("XML SERIALIZE: OPDS Entry.Updated => Date", (t) => {

//     const e = new Entry();
//     e.Updated = date;
//     inspect(e);

//     const xml = XML.serialize(e);
//     logXML(xml);

//     const xmlProp = xml.select("atom:updated/text()");
//     checkType_String(t, xmlProp);
//     t.is(xmlProp, dateSTR);
// });

// ==========================

test("XML DESERIALIZE: OPDS Entry.Updated => Date", (t) => {

    const xmlStr =
        `<entry xmlns="http://opds-spec.org/2010/catalog" xmlns:atom="http://www.w3.org/2005/Atom">
            <atom:updated>${dateSTR}</atom:updated>
        </entry>`;
    console.log(xmlStr);

    const xml = new xmldom.DOMParser().parseFromString(xmlStr);
    const md: Entry = XML.deserialize<Entry>(xml, Entry);
    inspect(md);

    checkType(t, md.Updated, Date);
    checkDate(t, md.Updated, date);
});
