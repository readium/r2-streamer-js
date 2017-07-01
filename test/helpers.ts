import * as util from "util";

import { TestContext } from "ava";

export function inspect(obj: any) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    // breakLength: 100  maxArrayLength: undefined
    console.log(util.inspect(obj,
        { showHidden: false, depth: 1000, colors: true, customInspect: true }));
}

export function log(str: string) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    console.log(str);
}

export function logJSON(json: any) {
    if (!process.env.DEBUG || process.env.DEBUG === "false" || process.env.DEBUG === "0") {
        return;
    }
    const jsonStr = global.JSON.stringify(json, null, "");
    log(jsonStr);
}

// ==========================

export function checkDate(t: TestContext, d1: Date, d2: Date) {
    t.true(d1.getTime() === d2.getTime());
    t.true(d1.toString() === d2.toString());
    t.true(+d1 === +d2);
    t.true(d1 >= d2 && d1 <= d2);
}

// import { FunctionType } from "@utils/xml-js-mapper";
// tslint:disable-next-line:ban-types
export function checkType(t: TestContext, obj: any, clazz: Function) {
    t.is(typeof obj, "object"); // obj.constructor.name
    t.true(obj instanceof clazz);
    t.is(obj.constructor, clazz);
}

export function checkType_String(t: TestContext, obj: any) {
    t.is(typeof obj, "string");
    t.false(obj instanceof String);
    t.false(obj instanceof Object);
    t.is(obj.constructor, String);
}

export function checkType_Array(t: TestContext, obj: any) {
    t.is(typeof obj, "object");
    t.true(obj instanceof Array);
    t.true(obj instanceof Object);
    t.is(obj.constructor, Array);
}

export function checkType_Object(t: TestContext, obj: any) {
    checkType(t, obj, Object);
}
