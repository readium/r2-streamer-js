// This is a straight port to TypeScript of ./nodes_modules/ava/profile.js

import * as EventEmitter from "events";
import * as path from "path";

import * as  arrify from "arrify";
import * as  Promise from "bluebird";
import * as  findCacheDir from "find-cache-dir";
import * as  meow from "meow";
import * as  pkgConf from "pkg-conf";
import * as  resolveCwd from "resolve-cwd";
import * as  uniqueTempDir from "unique-temp-dir";

import * as  babelConfigHelper from "ava/lib/babel-config";
import * as  CachingPrecompiler from "ava/lib/caching-precompiler";
import * as  globals from "ava/lib/globals";

function resolveModules(modules: any) {
    return arrify(modules).map((name: any) => {
        const modulePath = resolveCwd(name);

        if (modulePath === null) {
            throw new Error(`Could not resolve required module '${name}'`);
        }

        return modulePath;
    });
}

// Chrome gets upset when the `this` value is non-null for these functions
globals.setTimeout = setTimeout.bind(null);
globals.clearTimeout = clearTimeout.bind(null);

Promise.longStackTraces();

const conf = pkgConf.sync("ava", {
    defaults: {
        babel: "default",
    },
});

// Define a minimal set of options from the main CLI
const cli = meow(`
Usage
    $ iron-node node_modules/ava/profile.js <test-file>
Options
    --fail-fast   Stop after first test failure
    --serial, -s  Run tests serially
`, {
        alias: {
            s: "serial",
        },
        boolean: [
            "fail-fast",
            "verbose",
            "serial",
            "tap",
        ],
        default: conf,
        string: [
            "_",
        ],
    });

if (cli.input.length !== 1) {
    throw new Error("Specify a test file");
}

const file = path.resolve(cli.input[0]);
const cacheDir = findCacheDir({
    files: [file],
    name: "ava",
}) || uniqueTempDir();

babelConfigHelper.build(process.cwd(), cacheDir, conf.babel, true)
    .then((result: any) => {
        const precompiler = new CachingPrecompiler({
            babelCacheKeys: result.cacheKeys,
            getBabelOptions: result.getOptions,
            path: cacheDir,
        });

        const precompiled: any = {};
        precompiled[file] = precompiler.precompileFile(file);

        const opts = {
            cacheDir,
            failFast: cli.flags.failFast,
            file,
            precompiled,
            require: resolveModules(conf.require),
            serial: cli.flags.serial,
            tty: false,
        };

        const events = new EventEmitter();
        let uncaughtExceptionCount = 0;

        // Mock the behavior of a parent process
        (process as any).channel = {
            // tslint:disable-next-line:no-empty
            ref() {
            },
            // tslint:disable-next-line:no-empty
            unref() {
            },
        };
        process.send = (data: any) => {
            if (data && data.ava) {
                const name = data.name.replace(/^ava-/, "");

                if (events.listeners(name).length > 0) {
                    events.emit(name, data.data);
                } else {
                    console.log("UNHANDLED AVA EVENT:", name, data.data);
                }

                return;
            }

            console.log("NON AVA EVENT:", data);
        };

        events.on("test", (data: any) => {
            console.log("TEST:", data.title, data.error);
        });

        events.on("results", (data: any) => {
            if (console.profileEnd) {
                console.profileEnd();
            }

            console.log("RESULTS:", data.stats);

            if (process.exit) {
                // eslint-disable-next-line unicorn/no-process-exit
                process.exit(data.stats.failCount + uncaughtExceptionCount);
            }
        });

        events.on("stats", () => {
            setImmediate(() => {
                process.emit("ava-run", {});
            });
        });

        events.on("uncaughtException", (data: any) => {
            uncaughtExceptionCount++;
            let stack = data && data.exception && data.exception.stack;
            stack = stack || data;
            console.log(stack);
        });

        // `test-worker` will read process.argv[2] for options
        process.argv[2] = JSON.stringify(opts);
        process.argv.length = 3;

        if (console.profile) {
            console.profile("AVA test-worker process");
        }

        setImmediate(() => {
            // eslint-disable-next-line import/no-unassigned-import
            require("ava/lib/test-worker");
        });
    });
