import * as path from "path";

import { Metadata } from "@models/metadata";
import { Contributor } from "@models/metadata-contributor";
import { test } from "ava";
import { JSON as TAJSON } from "ta-json";

import { setLcpNativePluginPath } from "@parser/epub/lcp";
import { initGlobals } from "../src/init-globals";
import {
    checkType,
    checkType_Array,
    checkType_Object,
    checkType_String,
    inspect,
    logJSON,
} from "./helpers";

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP", "lcp.node"));

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

test("JSON SERIALIZE: Metadata.Imprint => Contributor[1] collapse-array", (t) => {

    const md = new Metadata();
    md.Imprint = [cont1];
    inspect(md);

    const json = TAJSON.serialize(md);
    // // (normalizes single-item array to the item value itself)
    // traverseJsonObjects(json,
    //     (obj, parent, keyInParent) => {
    //         if (parent && obj instanceof Array && obj.length === 1) {
    //             parent[keyInParent] = obj[0];
    //         }
    //     });
    logJSON(json);

    checkType_Object(t, json.imprint);

    checkType_String(t, json.imprint.name);
    t.is(json.imprint.name, contName1);

    checkType_String(t, json.imprint.role);
    t.is(json.imprint.role, contRole1);
});

// implemented, see IPropertyConverter.collapseArrayWithSingleItem()
// test("JSON SERIALIZE: Metadata.Imprint => Contributor[1] keep-array", (t) => {

//     const md = new Metadata();
//     md.Imprint = [cont1];
//     inspect(md);

//     const json = TAJSON.serialize(md);
//     logJSON(json);

//     checkType_Array(t, json.imprint);
//     t.is(json.imprint.length, 1);

//     checkType_Object(t, json.imprint[0]);

//     checkType_String(t, json.imprint[0].name);
//     t.is(json.imprint[0].name, contName1);

//     checkType_String(t, json.imprint[0].role);
//     t.is(json.imprint[0].role, contRole1);
// });

test("JSON DESERIALIZE: Metadata.Imprint => Contributor[]", (t) => {

    const json: any = {};
    json.imprint = [{ name: contName1, role: contRole1 }, { name: contName2, role: contRole2 }];
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is(md.Imprint.length, 2);

    checkType(t, md.Imprint[0], Contributor);

    checkType_String(t, md.Imprint[0].Name);
    t.is(md.Imprint[0].Name, contName1);

    checkType_String(t, md.Imprint[0].Role);
    t.is(md.Imprint[0].Role, contRole1);

    checkType(t, md.Imprint[1], Contributor);

    checkType_String(t, md.Imprint[1].Name);
    t.is(md.Imprint[1].Name, contName2);

    checkType_String(t, md.Imprint[1].Role);
    t.is(md.Imprint[1].Role, contRole2);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor[1]", (t) => {

    const json: any = {};
    json.imprint = [{ name: contName1, role: contRole1 }];
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is(md.Imprint.length, 1);

    checkType(t, md.Imprint[0], Contributor);

    checkType_String(t, md.Imprint[0].Name);
    t.is(md.Imprint[0].Name, contName1);

    checkType_String(t, md.Imprint[0].Role);
    t.is(md.Imprint[0].Role, contRole1);
});

test("JSON DESERIALIZE: Metadata.Imprint => Contributor", (t) => {

    const json: any = {};
    json.imprint = { name: contName2, role: contRole2 };
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is(md.Imprint.length, 1);

    checkType(t, md.Imprint[0], Contributor);

    checkType_String(t, md.Imprint[0].Name);
    t.is(md.Imprint[0].Name, contName2);

    checkType_String(t, md.Imprint[0].Role);
    t.is(md.Imprint[0].Role, contRole2);
});

test("JSON DESERIALIZE: Metadata.Imprint => ContributorSTR[]", (t) => {

    const json: any = {};
    json.imprint = [contName1, contName2];
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is(md.Imprint.length, 2);

    checkType(t, md.Imprint[0], Contributor);

    checkType_String(t, md.Imprint[0].Name);
    t.is(md.Imprint[0].Name, contName1);

    checkType(t, md.Imprint[1], Contributor);

    checkType_String(t, md.Imprint[1].Name);
    t.is(md.Imprint[1].Name, contName2);
});

test("JSON DESERIALIZE: Metadata.Imprint => ContributorSTR[1]", (t) => {

    const json: any = {};
    json.imprint = [contName1];
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is(md.Imprint.length, 1);

    checkType(t, md.Imprint[0], Contributor);

    checkType_String(t, md.Imprint[0].Name);
    t.is(md.Imprint[0].Name, contName1);
});

test("JSON DESERIALIZE: Metadata.Imprint => ContributorSTR", (t) => {

    const json: any = {};
    json.imprint = contName2;
    logJSON(json);

    const md: Metadata = TAJSON.deserialize<Metadata>(json, Metadata);
    inspect(md);

    checkType_Array(t, md.Imprint);
    t.is(md.Imprint.length, 1);

    checkType(t, md.Imprint[0], Contributor);

    checkType_String(t, md.Imprint[0].Name);
    t.is(md.Imprint[0].Name, contName2);
});
