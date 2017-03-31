import { test } from "ava";
// import * as ava from "ava";

import { Publication } from "../src/models/publication";

async function fn() {
    const pub = new Publication();
    console.log(pub.Metadata);
    return Promise.resolve("foo");
}

test(async (t) => {
    t.is(await fn(), "foo");
});
