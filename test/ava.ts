// This is a straight port to TypeScript of ./nodes_modules/ava/profile.js
// with added support for multiple test files (sequential invoke of test runner / worker)

import * as EventEmitter from "events";
// import * as fs from "fs";
import * as path from "path";

import * as  arrify from "arrify";
import * as  babelConfigHelper from "ava/lib/babel-config";
import * as  CachingPrecompiler from "ava/lib/caching-precompiler";
import * as  globals from "ava/lib/globals";
import * as  Promise from "bluebird";
// import * as _eval from "eval";
import * as  findCacheDir from "find-cache-dir";
import * as  meow from "meow";
import * as  pkgConf from "pkg-conf";
import * as  resolveCwd from "resolve-cwd";
import * as  uniqueTempDir from "unique-temp-dir";

// const workerPath = fs.realpathSync(path.join(__dirname, "../../../node_modules/ava/lib/test-worker.js"));
// console.log(workerPath);
// const workerCode = fs.readFileSync(workerPath, { encoding: "utf8" });

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
    $ iron-node node_modules/ava/profile.js <test-files>
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

if (cli.input.length <= 0) {
    throw new Error("Specify test files");
}
// console.log(cli.input);
const files = cli.input.map((file: any) => {
    const f = path.resolve(file);
    console.log(f);
    return f;
});
const cacheDir = findCacheDir({
    files,
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
        files.forEach((file: any) => {
            precompiled[file] = precompiler.precompileFile(file);
        });

        const resolvedModules = resolveModules(conf.require);

        let uncaughtExceptionCount = 0;

        let currentIndex = 0;
        function runTest() {
            if (currentIndex >= files.length) {
                return;
            }
            const file = files[currentIndex];
            console.log(`============> ${file}`);

            const opts = {
                cacheDir,
                failFast: cli.flags.failFast,
                file,
                precompiled,
                require: resolvedModules,
                serial: cli.flags.serial,
                tty: false,
            };

            uncaughtExceptionCount = 0;

            // `test-worker` will read process.argv[2] for options
            process.argv[2] = JSON.stringify(opts);
            process.argv.length = 3;

            if (console.profile) {
                console.profile("AVA test-worker process");
            }

            setImmediate(() => {
                console.log("setImmediate ava/lib/test-worker REQUIRE EVAL");
                console.log(process.argv[2]);

                // eslint-disable-next-line import/no-unassigned-import
                require("ava/lib/test-worker");

                // // eslint-disable-next-line import/no-unassigned-import
                // require(file);

                // _eval(workerCode,
                //     `${workerPath}`, // _${currentIndex}.js
                //     {},
                //     true);
            });
        }

        const events = new EventEmitter();

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

            console.log("RESULTS:", data.stats);
            currentIndex++;
            if (currentIndex < files.length) {
                runTest();
            } else {
                console.log("ALL TESTS DONE.");

                if (console.profileEnd) {
                    console.profileEnd();
                }

                if (process.exit) {
                    console.log("EXIT ...");
                    // eslint-disable-next-line unicorn/no-process-exit
                    process.exit(data.stats.failCount + uncaughtExceptionCount);
                }
            }
        });

        events.on("stats", () => {
            setImmediate(() => {
                (process as any).emit("ava-run", {});
            });
        });

        events.on("uncaughtException", (data: any) => {
            uncaughtExceptionCount++;
            let stack = data && data.exception && data.exception.stack;
            stack = stack || data;
            console.log(stack);
        });

        runTest();
    });
