import * as util from "util";

import { timeStrToSeconds } from "@models/media-overlay";
import { Metadata } from "@models/metadata";
import { Contributor } from "@models/metadata-contributor";
import { IStringMap } from "@models/metadata-multilang";
import { test } from "ava";
import * as debug_ from "debug";
import { JSON as TAJSON } from "ta-json";

const debug = debug_("r2:test");

function inspect(obj: any) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    // breakLength: 100  maxArrayLength: undefined
    console.log(util.inspect(obj,
        { showHidden: false, depth: 1000, colors: true, customInspect: true }));
}

function log(obj: any) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    console.log(obj);
}

async function fn() {
    return Promise.resolve("foo");
}

test("dummy async test", async (t) => {
    debug("test ASYNC");
    t.is(await fn(), "foo");
});

test("SMIL clock values", (t) => {
    t.plan(16);

    t.is(timeStrToSeconds("12.345"), 12.345);
    t.is(timeStrToSeconds("2345ms"), 2.345);
    t.is(timeStrToSeconds("345ms"), 0.345);
    t.is(timeStrToSeconds("7.75h"), 27900);
    t.is(timeStrToSeconds("76.2s"), 76.2);
    t.is(timeStrToSeconds("00:56.78"), 56.78);
    t.is(timeStrToSeconds("09:58"), 598);
    t.is(timeStrToSeconds("09.5:58"), 628);
    t.is(timeStrToSeconds("0:00:04"), 4);
    t.is(timeStrToSeconds("0:05:01.2"), 301.2);
    t.is(timeStrToSeconds("124:59:36"), 449976);
    t.is(timeStrToSeconds("5:34:31.396"), 20071.396);
    t.is(timeStrToSeconds("5:34.5:31.396"), 20101.396);

    t.is(timeStrToSeconds("7.5z"), 7.5);
    t.is(timeStrToSeconds("4:5:34:31.396"), 0);
    t.is(timeStrToSeconds(""), 0);
});

const titleStr = "str1";
const titleStr2 = "str2";
const titleLang = "lang1";
const titleLang2 = "lang2";
const titleLangStr: IStringMap = {};
titleLangStr[titleLang] = titleStr;
titleLangStr[titleLang2] = titleStr2;
const titleLangStr2: IStringMap = {};
titleLangStr2[titleLang] = titleStr2;
titleLangStr2[titleLang2] = titleStr;

const contName1 = "theName1";
const contRole1 = "theRole1";
const cont1 = new Contributor();
cont1.Name = contName1;
cont1.Role = contRole1;
const contName2 = "theName2";
const contRole2 = "theRole2";
const cont2 = new Contributor();
cont2.Name = contName2;
cont2.Role = contRole2;

test("JSON SERIALIZE: Metadata.Title => string", (t) => {

    const md1 = new Metadata();
    md1.Title = titleStr;
    inspect(md1);

    const json1 = TAJSON.serialize(md1);
    const jsonStr1 = global.JSON.stringify(json1, null, "");
    log(jsonStr1);

    t.is(typeof json1.title, "string");

    t.is(json1.title, titleStr);
});

test("JSON SERIALIZE: Metadata.Title => string-lang", (t) => {

    const md2 = new Metadata();
    md2.Title = titleLangStr;
    inspect(md2);

    const json2 = TAJSON.serialize(md2);
    const jsonStr2 = global.JSON.stringify(json2, null, "");
    log(jsonStr2);

    t.is(typeof json2.title, "object");
    t.is(typeof json2.title[titleLang], "string");
    t.is(typeof json2.title[titleLang2], "string");

    t.is(json2.title[titleLang], titleStr);
    t.is(json2.title[titleLang2], titleStr2);
});

// test("JSON SERIALIZE: Metadata.Title => string[]", (t) => {

//     const md5 = new Metadata();
//     md5.Title = [titleStr, titleStr2];
//     inspect(md5);

//     const json5 = TAJSON.serialize(md5);
//     const jsonStr5 = global.JSON.stringify(json5, null, "");
//     log(jsonStr5);

//     t.is(json5.title[0], titleStr);
//     t.is(json5.title[1], titleStr2);
// });

// test("JSON SERIALIZE: Metadata.Title => string-lang[]", (t) => {

//     const md7 = new Metadata();
//     md7.Title = [titleLangStr, titleLangStr2];
//     inspect(md7);

//     const json7 = TAJSON.serialize(md7);
//     const jsonStr7 = global.JSON.stringify(json7, null, "");
//     log(jsonStr7);

//     t.is(json7.title[0][titleLang], titleStr);
//     t.is(json7.title[0][titleLang2], titleStr2);
//     t.is(json7.title[1][titleLang], titleStr2);
//     t.is(json7.title[1][titleLang2], titleStr);
// });

test("JSON DESERIALIZE: Metadata.Title => string", (t) => {

    const json3: any = {};
    json3.title = titleStr;
    const jsonStr3 = global.JSON.stringify(json3, null, "");
    log(jsonStr3);
    const md3: Metadata = TAJSON.deserialize<Metadata>(json3, Metadata);
    inspect(md3);

    t.is(typeof md3.Title, "string");
    // t.is(md3.Title instanceof String, true); not 'new String()'
    t.is(md3.Title instanceof Object, false);

    t.is(md3.Title, titleStr);
});

test("JSON DESERIALIZE: Metadata.Title => string-lang", (t) => {

    const json4: any = {};
    json4.title = titleLangStr;
    const jsonStr4 = global.JSON.stringify(json4, null, "");
    log(jsonStr4);
    const md4: Metadata = TAJSON.deserialize<Metadata>(json4, Metadata);
    inspect(md4);

    t.is(typeof md4.Title, "object");
    t.is(md4.Title instanceof Object, true);

    t.is((md4.Title as IStringMap)[titleLang], titleStr);
    t.is((md4.Title as IStringMap)[titleLang2], titleStr2);
});

// test("JSON DESERIALIZE: Metadata.Title => string[]", (t) => {

//     const json6: any = {};
//     json6.title = [titleStr, titleStr2];
//     const jsonStr6 = global.JSON.stringify(json6, null, "");
//     log(jsonStr6);
//     const md6: Metadata = TAJSON.deserialize<Metadata>(json6, Metadata);
//     inspect(md6);

//     t.is((md6.Title as string[])[0], titleStr);
//     t.is((md6.Title as string[])[1], titleStr2);
// });

// test("JSON DESERIALIZE: Metadata.Title => string-lang[]", (t) => {

//     const json8: any = {};
//     json8.title = [titleLangStr, titleLangStr2];
//     const jsonStr8 = global.JSON.stringify(json8, null, "");
//     log(jsonStr8);
//     const md8: Metadata = TAJSON.deserialize<Metadata>(json8, Metadata);
//     inspect(md8);

//     t.is((md8.Title as IStringMap[])[0][titleLang], titleStr);
//     t.is((md8.Title as IStringMap[])[0][titleLang2], titleStr2);
//     t.is((md8.Title as IStringMap[])[1][titleLang], titleStr2);
//     t.is((md8.Title as IStringMap[])[1][titleLang2], titleStr);
// });

test("JSON SERIALIZE: Metadata.Imprint => Contributor[]", (t) => {

    const md1 = new Metadata();
    md1.Imprint = [];
    md1.Imprint.push(cont1);
    md1.Imprint.push(cont2);
    inspect(md1);

    const json1 = TAJSON.serialize(md1);
    const jsonStr1 = global.JSON.stringify(json1, null, "");
    log(jsonStr1);

    t.is(typeof json1.imprint, "object");
    t.is(json1.imprint instanceof Array, true);

    t.is(typeof json1.imprint[0], "object");
    t.is(json1.imprint[0] instanceof Object, true);

    t.is(typeof json1.imprint[0].name, "string");
    t.is(typeof json1.imprint[0].role, "string");

    t.is(json1.imprint[0].name, contName1);
    t.is(json1.imprint[0].role, contRole1);

    t.is(typeof json1.imprint[1], "object");
    t.is(json1.imprint[1] instanceof Object, true);

    t.is(typeof json1.imprint[1].name, "string");
    t.is(typeof json1.imprint[1].role, "string");

    t.is(json1.imprint[1].name, contName2);
    t.is(json1.imprint[1].role, contRole2);
});

test("JSON SERIALIZE: Metadata.Imprint => Contributor", (t) => {

    const md2 = new Metadata();
    md2.Imprint = cont1;
    inspect(md2);

    const json2 = TAJSON.serialize(md2);
    const jsonStr2 = global.JSON.stringify(json2, null, "");
    log(jsonStr2);

    t.is(typeof json2.imprint, "object");
    t.is(json2.imprint instanceof Object, true);

    t.is(typeof json2.imprint.name, "string");
    t.is(typeof json2.imprint.role, "string");

    t.is(json2.imprint.name, contName1);
    t.is(json2.imprint.role, contRole1);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor[]", (t) => {

    const json3: any = {};
    json3.imprint = [{ name: contName1, role: contRole1 }, { name: contName2, role: contRole2 }];
    const jsonStr3 = global.JSON.stringify(json3, null, "");
    log(jsonStr3);
    const md3: Metadata = TAJSON.deserialize<Metadata>(json3, Metadata);
    inspect(md3);

    t.is((md3.Imprint as Contributor[])[0] instanceof Contributor, true);
    t.is((md3.Imprint as Contributor[])[0].constructor, Contributor);
    t.is(typeof (md3.Imprint as Contributor[])[0], "object");

    t.is((md3.Imprint as Contributor[])[0].Name, contName1);
    t.is((md3.Imprint as Contributor[])[0].Role, contRole1);

    t.is((md3.Imprint as Contributor[])[1] instanceof Contributor, true);
    t.is((md3.Imprint as Contributor[])[1].constructor, Contributor);
    t.is(typeof (md3.Imprint as Contributor[])[1], "object");

    t.is((md3.Imprint as Contributor[])[1].Name, contName2);
    t.is((md3.Imprint as Contributor[])[1].Role, contRole2);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor", (t) => {

    const json4: any = {};
    json4.imprint = { name: contName1, role: contRole1 };
    const jsonStr4 = global.JSON.stringify(json4, null, "");
    log(jsonStr4);
    const md4: Metadata = TAJSON.deserialize<Metadata>(json4, Metadata);
    inspect(md4);

    t.is(md4.Imprint instanceof Contributor, true);
    t.is(md4.Imprint.constructor, Contributor);
    t.is(typeof md4.Imprint, "object");

    t.is((md4.Imprint as Contributor).Name, contName1);
    t.is((md4.Imprint as Contributor).Role, contRole1);
});
