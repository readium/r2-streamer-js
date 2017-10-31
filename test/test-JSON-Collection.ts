import * as path from "path";

import { BelongsTo } from "@models/metadata-belongsto";
import { Collection } from "@models/metadata-collection";
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

const colName1 = "theName1";
const colID1 = "theID1";
const col1 = new Collection();
col1.Name = colName1;
col1.Identifier = colID1;

const colName2 = "theName2";
const colID2 = "theID2";
const col2 = new Collection();
col2.Name = colName2;
col2.Identifier = colID2;

// ==========================

test("JSON SERIALIZE: BelongsTo.Series => Collection[]", (t) => {

    const b = new BelongsTo();
    b.Series = [];
    b.Series.push(col1);
    b.Series.push(col2);
    inspect(b);

    const json = TAJSON.serialize(b);
    logJSON(json);

    checkType_Array(t, json.series);
    t.is(json.series.length, 2);

    checkType_Object(t, json.series[0]);

    checkType_String(t, json.series[0].name);
    t.is(json.series[0].name, colName1);

    checkType_String(t, json.series[0].identifier);
    t.is(json.series[0].identifier, colID1);

    checkType_Object(t, json.series[1]);

    checkType_String(t, json.series[1].name);
    t.is(json.series[1].name, colName2);

    checkType_String(t, json.series[1].identifier);
    t.is(json.series[1].identifier, colID2);
});

test("JSON SERIALIZE: BelongsTo.Series => Collection[1] collapse-array", (t) => {

    const b = new BelongsTo();
    b.Series = [col1];
    inspect(b);

    const json = TAJSON.serialize(b);
    // // (normalizes single-item array to the item value itself)
    // traverseJsonObjects(json,
    //     (obj, parent, keyInParent) => {
    //         if (parent && obj instanceof Array && obj.length === 1) {
    //             parent[keyInParent] = obj[0];
    //         }
    //     });
    logJSON(json);

    checkType_Object(t, json.series);

    checkType_String(t, json.series.name);
    t.is(json.series.name, colName1);

    checkType_String(t, json.series.identifier);
    t.is(json.series.identifier, colID1);
});

test("JSON DESERIALIZE: BelongsTo.Series => Collection[]", (t) => {

    const json: any = {};
    json.series = [{ name: colName1, identifier: colID1 }, { name: colName2, identifier: colID2 }];
    logJSON(json);

    const b: BelongsTo = TAJSON.deserialize<BelongsTo>(json, BelongsTo);
    inspect(b);

    checkType_Array(t, b.Series);
    t.is(b.Series.length, 2);

    checkType(t, b.Series[0], Collection);

    checkType_String(t, b.Series[0].Name);
    t.is(b.Series[0].Name, colName1);

    checkType_String(t, b.Series[0].Identifier);
    t.is(b.Series[0].Identifier, colID1);

    checkType(t, b.Series[1], Collection);

    checkType_String(t, b.Series[1].Name);
    t.is(b.Series[1].Name, colName2);

    checkType_String(t, b.Series[1].Identifier);
    t.is(b.Series[1].Identifier, colID2);
});

test("JSON DESERIALIZE: BelongsTo.Series => Collection[1]", (t) => {

    const json: any = {};
    json.series = [{ name: colName1, identifier: colID1 }];
    logJSON(json);

    const b: BelongsTo = TAJSON.deserialize<BelongsTo>(json, BelongsTo);
    inspect(b);

    checkType_Array(t, b.Series);
    t.is(b.Series.length, 1);

    checkType(t, b.Series[0], Collection);

    checkType_String(t, b.Series[0].Name);
    t.is(b.Series[0].Name, colName1);

    checkType_String(t, b.Series[0].Identifier);
    t.is(b.Series[0].Identifier, colID1);
});

test("JSON DESERIALIZE: BelongsTo.Series => Collection", (t) => {

    const json: any = {};
    json.series = { name: colName2, identifier: colID2 };
    logJSON(json);

    const b: BelongsTo = TAJSON.deserialize<BelongsTo>(json, BelongsTo);
    inspect(b);

    checkType_Array(t, b.Series);
    t.is(b.Series.length, 1);

    checkType(t, b.Series[0], Collection);

    checkType_String(t, b.Series[0].Name);
    t.is(b.Series[0].Name, colName2);

    checkType_String(t, b.Series[0].Identifier);
    t.is(b.Series[0].Identifier, colID2);
});

test("JSON DESERIALIZE: BelongsTo.Series => CollectionSTR[]", (t) => {

    const json: any = {};
    json.series = [colName1, colName2];
    logJSON(json);

    const b: BelongsTo = TAJSON.deserialize<BelongsTo>(json, BelongsTo);
    inspect(b);

    checkType_Array(t, b.Series);
    t.is(b.Series.length, 2);

    checkType(t, b.Series[0], Collection);

    checkType_String(t, b.Series[0].Name);
    t.is(b.Series[0].Name, colName1);

    checkType(t, b.Series[1], Collection);

    checkType_String(t, b.Series[1].Name);
    t.is(b.Series[1].Name, colName2);
});

test("JSON DESERIALIZE: BelongsTo.Series => CollectionSTR[1]", (t) => {

    const json: any = {};
    json.series = [colName1];
    logJSON(json);

    const b: BelongsTo = TAJSON.deserialize<BelongsTo>(json, BelongsTo);
    inspect(b);

    checkType_Array(t, b.Series);
    t.is(b.Series.length, 1);

    checkType(t, b.Series[0], Collection);

    checkType_String(t, b.Series[0].Name);
    t.is(b.Series[0].Name, colName1);
});

test("JSON DESERIALIZE: BelongsTo.Series => CollectionSTR", (t) => {

    const json: any = {};
    json.series = colName2;
    logJSON(json);

    const b: BelongsTo = TAJSON.deserialize<BelongsTo>(json, BelongsTo);
    inspect(b);

    checkType_Array(t, b.Series);
    t.is(b.Series.length, 1);

    checkType(t, b.Series[0], Collection);

    checkType_String(t, b.Series[0].Name);
    t.is(b.Series[0].Name, colName2);
});
