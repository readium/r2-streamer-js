import * as path from "path";

import { Metadata } from "@models/metadata";
import { IStringMap } from "@models/metadata-multilang";
import { OPDSPublicationMetadata } from "@opds/opds2/opds2-publicationMetadata";
import { test } from "ava";
import { JSON as TAJSON } from "ta-json";

import { setLcpNativePluginPath } from "@parser/epub/lcp";
import { initGlobals } from "../src/init-globals";
import {
    checkType_Object,
    checkType_String,
    inspect,
    logJSON,
} from "./helpers";

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP", "lcp.node"));

// ==========================

const titleStr1 = "str1";
const titleStr2 = "str2";
const titleLang1 = "lang1";
const titleLang2 = "lang2";
const titleLangStr1: IStringMap = {};
titleLangStr1[titleLang1] = titleStr1;
titleLangStr1[titleLang2] = titleStr2;
const titleLangStr2: IStringMap = {};
titleLangStr2[titleLang1] = titleStr2;
titleLangStr2[titleLang2] = titleStr1;

// ==========================

test("JSON SERIALIZE: OPDSPublicationMetadata.Title => string", (t) => {

    const md = new OPDSPublicationMetadata();
    md.Title = titleStr1;
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_String(t, json.title);
    t.is(json.title, titleStr1);
});

test("JSON SERIALIZE: OPDSPublicationMetadata.Title => string-lang", (t) => {

    const md = new OPDSPublicationMetadata();
    md.Title = titleLangStr1;
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_Object(t, json.title);

    checkType_String(t, json.title[titleLang1]);
    t.is(json.title[titleLang1], titleStr1);

    checkType_String(t, json.title[titleLang2]);
    t.is(json.title[titleLang2], titleStr2);
});

test("JSON DESERIALIZE: OPDSPublicationMetadata.Title => string", (t) => {

    const json: any = {};
    json.title = titleStr1;
    logJSON(json);

    const md: OPDSPublicationMetadata = TAJSON.deserialize<OPDSPublicationMetadata>(json, OPDSPublicationMetadata);
    inspect(md);

    checkType_String(t, md.Title);
    t.is(md.Title, titleStr1);
});

test("JSON DESERIALIZE: OPDSPublicationMetadata.Title => string-lang", (t) => {

    const json: any = {};
    json.title = titleLangStr1;
    logJSON(json);

    const md: OPDSPublicationMetadata = TAJSON.deserialize<OPDSPublicationMetadata>(json, OPDSPublicationMetadata);
    inspect(md);

    checkType_Object(t, md.Title);

    checkType_String(t, (md.Title as IStringMap)[titleLang1]);
    t.is((md.Title as IStringMap)[titleLang1], titleStr1);

    checkType_String(t, (md.Title as IStringMap)[titleLang2]);
    t.is((md.Title as IStringMap)[titleLang2], titleStr2);
});

// ==========================

test("JSON SERIALIZE: Metadata.Title => string", (t) => {

    const md = new Metadata();
    md.Title = titleStr1;
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_String(t, json.title);
    t.is(json.title, titleStr1);
});

test("JSON SERIALIZE: Metadata.Title => string-lang", (t) => {

    const md = new Metadata();
    md.Title = titleLangStr1;
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_Object(t, json.title);

    checkType_String(t, json.title[titleLang1]);
    t.is(json.title[titleLang1], titleStr1);

    checkType_String(t, json.title[titleLang2]);
    t.is(json.title[titleLang2], titleStr2);
});

test("JSON DESERIALIZE: Metadata.Title => string", (t) => {

    const json: any = {};
    json.title = titleStr1;
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_String(t, md.Title);
    t.is(md.Title, titleStr1);
});

test("JSON DESERIALIZE: Metadata.Title => string-lang", (t) => {

    const json: any = {};
    json.title = titleLangStr1;
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Object(t, md.Title);

    checkType_String(t, (md.Title as IStringMap)[titleLang1]);
    t.is((md.Title as IStringMap)[titleLang1], titleStr1);

    checkType_String(t, (md.Title as IStringMap)[titleLang2]);
    t.is((md.Title as IStringMap)[titleLang2], titleStr2);
});
