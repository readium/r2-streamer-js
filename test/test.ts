import * as util from "util";

import { timeStrToSeconds } from "@models/media-overlay";
import { Metadata } from "@models/metadata";
import { Contributor } from "@models/metadata-contributor";
import { IStringMap } from "@models/metadata-multilang";
import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { OPDSFeed } from "@opds/opds2/opds2";
import { OPDSLink } from "@opds/opds2/opds2-link";
import { OPDSPublicationMetadata } from "@opds/opds2/opds2-publicationMetadata";
import { traverseJsonObjects } from "@utils/JsonUtils";
import { TestContext, test } from "ava";
import * as debug_ from "debug";
import { JSON as TAJSON } from "ta-json";

const debug = debug_("r2:test");

// ==========================

function inspect(obj: any) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    // breakLength: 100  maxArrayLength: undefined
    console.log(util.inspect(obj,
        { showHidden: false, depth: 1000, colors: true, customInspect: true }));
}

function log(str: string) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    console.log(str);
}

function logJSON(json: any) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    const jsonStr = global.JSON.stringify(json, null, "");
    log(jsonStr);
}

// ==========================

// import { FunctionType } from "@utils/xml-js-mapper";
// tslint:disable-next-line:ban-types
function checkType(t: TestContext, obj: any, clazz: Function) {
    t.is(typeof obj, "object"); // obj.constructor.name
    t.true(obj instanceof clazz);
    t.is(obj.constructor, clazz);
}

function checkType_String(t: TestContext, obj: any) {
    t.is(typeof obj, "string");
    t.false(obj instanceof String);
    t.false(obj instanceof Object);
    t.is(obj.constructor, String);
}

function checkType_Array(t: TestContext, obj: any) {
    t.is(typeof obj, "object");
    t.true(obj instanceof Array);
    t.true(obj instanceof Object);
    t.is(obj.constructor, Array);
}

function checkType_Object(t: TestContext, obj: any) {
    checkType(t, obj, Object);
}

// ==========================

async function fn() {
    return Promise.resolve("foo");
}
test("dummy async test", async (t) => {
    debug("test ASYNC");
    t.is(await fn(), "foo");
});

// ==========================

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

// ==========================

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

// ==========================

test("JSON SERIALIZE: Metadata.Imprint => Contributor[]", (t) => {

    const md = new Metadata();
    md.Imprint = [];
    md.Imprint.push(cont1);
    md.Imprint.push(cont2);
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_Array(t, json.imprint);
    t.is(json.imprint.length, 2);

    checkType_Object(t, json.imprint[0]);

    checkType_String(t, json.imprint[0].name);
    t.is(json.imprint[0].name, contName1);

    checkType_String(t, json.imprint[0].role);
    t.is(json.imprint[0].role, contRole1);

    checkType_Object(t, json.imprint[1]);

    checkType_String(t, json.imprint[1].name);
    t.is(json.imprint[1].name, contName2);

    checkType_String(t, json.imprint[1].role);
    t.is(json.imprint[1].role, contRole2);
});

test.failing("JSON SERIALIZE: Metadata.Imprint => Contributor[1]", (t) => {

    const md = new Metadata();
    md.Imprint = [cont1];
    inspect(md);

    const json = TAJSON.serialize(md);
    // TODO FIXME This is a HACK!
    // (normalizes single-item array to the item value itself)
    if (!json) {
        traverseJsonObjects(json,
            (obj, parent, keyInParent) => {
                if (parent && obj instanceof Array && obj.length === 1) {
                    parent[keyInParent] = obj[0];
                }
            });
    }
    logJSON(json);

    checkType_Object(t, json.imprint);

    checkType_String(t, json.imprint.name);
    t.is(json.imprint.name, contName1);

    checkType_String(t, json.imprint.role);
    t.is(json.imprint.role, contRole1);
});

test("JSON SERIALIZE: Metadata.Imprint => Contributor", (t) => {

    const md = new Metadata();
    md.Imprint = cont1;
    inspect(md);

    const json = TAJSON.serialize(md);
    logJSON(json);

    checkType_Object(t, json.imprint);

    checkType_String(t, json.imprint.name);
    t.is(json.imprint.name, contName1);

    checkType_String(t, json.imprint.role);
    t.is(json.imprint.role, contRole1);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor[]", (t) => {

    const json: any = {};
    json.imprint = [{ name: contName1, role: contRole1 }, { name: contName2, role: contRole2 }];
    logJSON(json);
    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is((md.Imprint as Contributor[]).length, 2);

    checkType(t, (md.Imprint as Contributor[])[0], Contributor);

    checkType_String(t, (md.Imprint as Contributor[])[0].Name);
    t.is((md.Imprint as Contributor[])[0].Name, contName1);

    checkType_String(t, (md.Imprint as Contributor[])[0].Role);
    t.is((md.Imprint as Contributor[])[0].Role, contRole1);

    checkType(t, (md.Imprint as Contributor[])[1], Contributor);

    checkType_String(t, (md.Imprint as Contributor[])[1].Name);
    t.is((md.Imprint as Contributor[])[1].Name, contName2);

    checkType_String(t, (md.Imprint as Contributor[])[1].Role);
    t.is((md.Imprint as Contributor[])[1].Role, contRole2);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor[1]", (t) => {

    const json: any = {};
    json.imprint = [{ name: contName1, role: contRole1 }];
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType(t, md.Imprint, Contributor);

    checkType_String(t, (md.Imprint as Contributor).Name);
    t.is((md.Imprint as Contributor).Name, contName1);

    checkType_String(t, (md.Imprint as Contributor).Role);
    t.is((md.Imprint as Contributor).Role, contRole1);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor", (t) => {

    const json: any = {};
    json.imprint = { name: contName1, role: contRole1 };
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType(t, md.Imprint, Contributor);

    checkType_String(t, (md.Imprint as Contributor).Name);
    t.is((md.Imprint as Contributor).Name, contName1);

    checkType_String(t, (md.Imprint as Contributor).Role);
    t.is((md.Imprint as Contributor).Role, contRole1);
});

// ==========================

const contextStr1 = "http://context1";
const contextStr2 = "http://context2";

// ==========================

test("JSON SERIALIZE: Publication.Context => string[]", (t) => {

    const pub = new Publication();
    pub.Context = [];
    pub.Context.push(contextStr1);
    pub.Context.push(contextStr2);
    inspect(pub);

    const json = TAJSON.serialize(pub);
    logJSON(json);

    checkType_Array(t, json["@context"]);
    t.is(json["@context"].length, 2);

    checkType_String(t, json["@context"][0]);
    t.is(json["@context"][0], contextStr1);

    checkType_String(t, json["@context"][1]);
    t.is(json["@context"][1], contextStr2);
});

test.failing("JSON SERIALIZE: Publication.Context => string[1]", (t) => {

    const pub = new Publication();
    pub.Context = [contextStr1];
    inspect(pub);

    const json = TAJSON.serialize(pub);
    // TODO FIXME This is a HACK!
    // (normalizes single-item array to the item value itself)
    if (!json) {
        traverseJsonObjects(json,
            (obj, parent, keyInParent) => {
                if (parent && obj instanceof Array && obj.length === 1) {
                    parent[keyInParent] = obj[0];
                }
            });
    }
    logJSON(json);

    checkType_String(t, json["@context"]);
    t.is(json["@context"], contextStr1);
});

test("JSON SERIALIZE: Publication.Context => string", (t) => {

    const pub = new Publication();
    pub.Context = contextStr1;
    inspect(pub);

    const json = TAJSON.serialize(pub);
    logJSON(json);

    checkType_String(t, json["@context"]);
    t.is(json["@context"], contextStr1);
});

test("JSON DESERIALIZE: Publication.Context => string[]", (t) => {

    const json: any = {};
    json["@context"] = [contextStr1, contextStr2];
    logJSON(json);

    const pub: Publication = TAJSON.deserialize<Publication>(json, Publication);
    inspect(pub);

    checkType_Array(t, pub.Context);
    t.is(pub.Context.length, 2);

    checkType_String(t, pub.Context[0]);
    t.is(pub.Context[0], contextStr1);

    checkType_String(t, pub.Context[1]);
    t.is(pub.Context[1], contextStr2);
});

test("JSON DESERIALIZE: Publication.Context => string[1]", (t) => {

    const json: any = {};
    json["@context"] = [contextStr1];
    logJSON(json);

    const pub: Publication = TAJSON.deserialize<Publication>(json, Publication);
    inspect(pub);

    checkType_String(t, pub.Context);
    t.is(pub.Context, contextStr1);
});

test("JSON DESERIALIZE: Publication.Context => string", (t) => {

    const json: any = {};
    json["@context"] = contextStr1;
    logJSON(json);

    const pub: Publication = TAJSON.deserialize<Publication>(json, Publication);
    inspect(pub);

    checkType_String(t, pub.Context);
    t.is(pub.Context, contextStr1);
});

// ==========================

test("JSON SERIALIZE: OPDSFeed.Context => string[]", (t) => {

    const pub = new OPDSFeed();
    pub.Context = [];
    pub.Context.push(contextStr1);
    pub.Context.push(contextStr2);
    inspect(pub);

    const json = TAJSON.serialize(pub);
    logJSON(json);

    checkType_Array(t, json["@context"]);
    t.is(json["@context"].length, 2);

    checkType_String(t, json["@context"][0]);
    t.is(json["@context"][0], contextStr1);

    checkType_String(t, json["@context"][1]);
    t.is(json["@context"][1], contextStr2);
});

test.failing("JSON SERIALIZE: OPDSFeed.Context => string[1]", (t) => {

    const pub = new OPDSFeed();
    pub.Context = [contextStr1];
    inspect(pub);

    const json = TAJSON.serialize(pub);
    // TODO FIXME This is a HACK!
    // (normalizes single-item array to the item value itself)
    if (!json) {
        traverseJsonObjects(json,
            (obj, parent, keyInParent) => {
                if (parent && obj instanceof Array && obj.length === 1) {
                    parent[keyInParent] = obj[0];
                }
            });
    }
    logJSON(json);

    checkType_String(t, json["@context"]);
    t.is(json["@context"], contextStr1);
});

test("JSON SERIALIZE: OPDSFeed.Context => string", (t) => {

    const pub = new OPDSFeed();
    pub.Context = contextStr1;
    inspect(pub);

    const json = TAJSON.serialize(pub);
    logJSON(json);

    checkType_String(t, json["@context"]);
    t.is(json["@context"], contextStr1);
});

test("JSON DESERIALIZE: OPDSFeed.Context => string[]", (t) => {

    const json: any = {};
    json["@context"] = [contextStr1, contextStr2];
    logJSON(json);

    const pub: OPDSFeed = TAJSON.deserialize<OPDSFeed>(json, OPDSFeed);
    inspect(pub);

    checkType_Array(t, pub.Context);
    t.is(pub.Context.length, 2);

    checkType_String(t, pub.Context[0]);
    t.is(pub.Context[0], contextStr1);

    checkType_String(t, pub.Context[1]);
    t.is(pub.Context[1], contextStr2);
});

test("JSON DESERIALIZE: OPDSFeed.Context => string[1]", (t) => {

    const json: any = {};
    json["@context"] = [contextStr1];
    logJSON(json);

    const pub: OPDSFeed = TAJSON.deserialize<OPDSFeed>(json, OPDSFeed);
    inspect(pub);

    checkType_String(t, pub.Context);
    t.is(pub.Context, contextStr1);
});

test("JSON DESERIALIZE: OPDSFeed.Context => string", (t) => {

    const json: any = {};
    json["@context"] = contextStr1;
    logJSON(json);

    const pub: OPDSFeed = TAJSON.deserialize<OPDSFeed>(json, OPDSFeed);
    inspect(pub);

    checkType_String(t, pub.Context);
    t.is(pub.Context, contextStr1);
});

// ==========================

const relStr1 = "rel1";
const relStr2 = "rel2";

// ==========================

test("JSON SERIALIZE: OPDSLink.Rel => string[]", (t) => {

    const link = new OPDSLink();
    link.AddRel(relStr1);
    link.AddRel(relStr2);
    inspect(link);

    const json = TAJSON.serialize(link);
    logJSON(json);

    checkType_Array(t, json.rel);
    t.is(json.rel.length, 2);

    checkType_String(t, json.rel[0]);
    t.is(json.rel[0], relStr1);

    checkType_String(t, json.rel[1]);
    t.is(json.rel[1], relStr2);
});

test("JSON SERIALIZE: OPDSLink.Rel => string[] (recursive links)", (t) => {

    const link = new OPDSLink();
    link.AddRel(relStr1);
    link.AddRel(relStr2);
    const child = new OPDSLink();
    child.AddRel(relStr2);
    child.AddRel(relStr1);
    link.Children = [];
    link.Children.push(child);
    inspect(link);

    const json = TAJSON.serialize(link);
    logJSON(json);

    checkType_Array(t, json.rel);
    t.is(json.rel.length, 2);

    checkType_String(t, json.rel[0]);
    t.is(json.rel[0], relStr1);

    checkType_String(t, json.rel[1]);
    t.is(json.rel[1], relStr2);

    checkType_Array(t, json.children);
    t.is(json.children.length, 1);

    checkType_Array(t, json.children[0].rel);
    t.is(json.children[0].rel.length, 2);

    checkType_String(t, json.children[0].rel[0]);
    t.is(json.children[0].rel[0], relStr2);

    checkType_String(t, json.children[0].rel[1]);
    t.is(json.children[0].rel[1], relStr1);
});

test("JSON SERIALIZE: OPDSLink.Rel => string", (t) => {

    const link = new OPDSLink();
    link.AddRel(relStr1);
    inspect(link);

    const json = TAJSON.serialize(link);
    logJSON(json);

    checkType_String(t, json.rel);
    t.is(json.rel, relStr1);
});

test("JSON SERIALIZE: OPDSLink.Rel => string (recursive links)", (t) => {

    const link = new OPDSLink();
    link.AddRel(relStr1);
    const child = new OPDSLink();
    child.AddRel(relStr2);
    link.Children = [];
    link.Children.push(child);
    inspect(link);

    const json = TAJSON.serialize(link);
    logJSON(json);

    checkType_String(t, json.rel);
    t.is(json.rel, relStr1);

    checkType_Array(t, json.children);
    t.is(json.children.length, 1);

    checkType_String(t, json.children[0].rel);
    t.is(json.children[0].rel, relStr2);
});

test("JSON DESERIALIZE: OPDSLink.Rel => string[]", (t) => {

    const json: any = {};
    json.rel = [relStr1, relStr2];
    logJSON(json);

    const link: OPDSLink = TAJSON.deserialize<OPDSLink>(json, OPDSLink);
    inspect(link);

    checkType_Array(t, link.Rel);
    t.is(link.Rel.length, 2);

    checkType_String(t, link.Rel[0]);
    t.is(link.Rel[0], relStr1);

    checkType_String(t, link.Rel[1]);
    t.is(link.Rel[1], relStr2);
});

test("JSON DESERIALIZE: OPDSLink.Rel => string[] (recursive children)", (t) => {

    const json: any = {};
    json.rel = [relStr1, relStr2];
    json.children = [];
    json.children.push({ rel: [relStr2, relStr1] });
    logJSON(json);

    const link: OPDSLink = TAJSON.deserialize<OPDSLink>(json, OPDSLink);
    inspect(link);

    checkType_Array(t, link.Rel);
    t.is(link.Rel.length, 2);

    checkType_String(t, link.Rel[0]);
    t.is(link.Rel[0], relStr1);

    checkType_String(t, link.Rel[1]);
    t.is(link.Rel[1], relStr2);

    checkType_Array(t, link.Children);
    t.is(link.Children.length, 1);

    checkType_Array(t, link.Children[0].Rel);
    t.is(link.Children[0].Rel.length, 2);

    checkType_String(t, link.Children[0].Rel[0]);
    t.is(link.Children[0].Rel[0], relStr2);

    checkType_String(t, link.Children[0].Rel[1]);
    t.is(link.Children[0].Rel[1], relStr1);
});

test("JSON DESERIALIZE: OPDSLink.Rel => string[1]", (t) => {

    const json: any = {};
    json.rel = [relStr1];
    logJSON(json);

    const link: OPDSLink = TAJSON.deserialize<OPDSLink>(json, OPDSLink);
    inspect(link);

    checkType_String(t, link.Rel);
    t.is(link.Rel, relStr1);
});

test("JSON DESERIALIZE: OPDSLink.Rel => string", (t) => {

    const json: any = {};
    json.rel = relStr1;
    logJSON(json);

    const link: OPDSLink = TAJSON.deserialize<OPDSLink>(json, OPDSLink);
    inspect(link);

    checkType_String(t, link.Rel);
    t.is(link.Rel, relStr1);
});

test("JSON DESERIALIZE: OPDSLink.Rel => string (recursive children)", (t) => {

    const json: any = {};
    json.rel = relStr1;
    json.children = [];
    json.children.push({ rel: relStr2 });
    logJSON(json);

    const link: OPDSLink = TAJSON.deserialize<OPDSLink>(json, OPDSLink);
    inspect(link);

    checkType_String(t, link.Rel);
    t.is(link.Rel, relStr1);

    checkType_Array(t, link.Children);
    t.is(link.Children.length, 1);

    checkType_String(t, link.Children[0].Rel);
    t.is(link.Children[0].Rel, relStr2);
});

// ==========================

test("JSON SERIALIZE: Publication Link.Rel => string[]", (t) => {

    const link = new Link();
    link.AddRel(relStr1);
    link.AddRel(relStr2);
    inspect(link);

    const json = TAJSON.serialize(link);
    logJSON(json);

    checkType_Array(t, json.rel);
    t.is(json.rel.length, 2);

    checkType_String(t, json.rel[0]);
    t.is(json.rel[0], relStr1);

    checkType_String(t, json.rel[1]);
    t.is(json.rel[1], relStr2);
});

test("JSON SERIALIZE: Publication Link.Rel => string", (t) => {

    const link = new Link();
    link.AddRel(relStr1);
    inspect(link);

    const json = TAJSON.serialize(link);
    logJSON(json);

    checkType_String(t, json.rel);
    t.is(json.rel, relStr1);
});

test("JSON DESERIALIZE: Publication Link.Rel => string[]", (t) => {

    const json: any = {};
    json.rel = [relStr1, relStr2];
    logJSON(json);

    const link: Link = TAJSON.deserialize<Link>(json, Link);
    inspect(link);

    checkType_Array(t, link.Rel);
    t.is(link.Rel.length, 2);

    checkType_String(t, link.Rel[0]);
    t.is(link.Rel[0], relStr1);

    checkType_String(t, link.Rel[1]);
    t.is(link.Rel[1], relStr2);
});

test("JSON DESERIALIZE: Publication Link.Rel => string[1]", (t) => {

    const json: any = {};
    json.rel = [relStr1];
    logJSON(json);

    const link: Link = TAJSON.deserialize<Link>(json, Link);
    inspect(link);

    checkType_String(t, link.Rel);
    t.is(link.Rel, relStr1);
});

test("JSON DESERIALIZE: Publication Link.Rel => string", (t) => {

    const json: any = {};
    json.rel = relStr1;
    logJSON(json);

    const link: Link = TAJSON.deserialize<Link>(json, Link);
    inspect(link);

    checkType_String(t, link.Rel);
    t.is(link.Rel, relStr1);
});

// ==========================
