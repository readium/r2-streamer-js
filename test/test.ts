import { timeStrToSeconds } from "@models/media-overlay";
import { test } from "ava";
import * as debug_ from "debug";

const debug = debug_("r2:test");

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
