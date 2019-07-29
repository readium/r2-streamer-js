var fs = require("fs");
var path = require("path");
var filehound = require("filehound");

// console.log("process.cwd():");
// console.log(process.cwd());
// console.log("path.resolve(\".\")");
// console.log(path.resolve("."));

// console.log("__dirname:");
// console.log(__dirname);

// const args = process.argv.slice(2);
// console.log("args:");
// console.log(args);

// relative to __dirname, not process.cwd()
const tsConfigPath = "./tsconfigs/tsconfig-common.json";
var tsconfig = require("../" + tsConfigPath);

if (!tsconfig.compilerOptions.baseUrl) {
    return;
}

const tsConfigESPath = "./tsconfigs/tsconfig-" + "es5" + ".json";
var tsconfigES = require("../" + tsConfigESPath);

if (tsconfigES.compilerOptions.paths) {
    if (!tsconfig.compilerOptions.paths) {
        tsconfig.compilerOptions.paths = tsconfigES.compilerOptions.paths;
    } else {
        // merge
        tsconfig.compilerOptions.paths = Object.assign(tsconfig.compilerOptions.paths, tsconfigES.compilerOptions.paths);
    }
}

if (!tsconfig.compilerOptions.paths) {
    return;
}

const baseUrlAbsolutePath = fs.realpathSync(path.join(path.dirname(path.resolve(tsConfigPath)), tsconfig.compilerOptions.baseUrl));
console.log(baseUrlAbsolutePath);

const pathMappings = {};

const tsconfigCompilerOptionsPaths = Object.keys(tsconfig.compilerOptions.paths);
tsconfigCompilerOptionsPaths.forEach((tsconfigCompilerOptionsPath) => {

    // console.log(`PATH KEY: ${tsconfigCompilerOptionsPath}`);

    // const mappingArray = [];
    const tsconfigCompilerOptionsPathFix = tsconfigCompilerOptionsPath.replace(/\/\*/g, "(/.+)");
    // pathMappings[tsconfigCompilerOptionsPathFix] = mappingArray;

    const arr = [];
    arr.push(tsconfig.compilerOptions.paths[tsconfigCompilerOptionsPath]);
    arr.forEach((tsconfigCompilerOptionsPathArray) => {
        tsconfigCompilerOptionsPathArray.forEach((tsconfigCompilerOptionsPathArrayItem) => {
            // console.log(`PATH VALUE: ${tsconfigCompilerOptionsPathArrayItem}`);

            let p = path.join(baseUrlAbsolutePath, tsconfigCompilerOptionsPathArrayItem.replace(/\/\*/g, ""));
            p = p.replace(/\\/g, "/");
            if (!pathMappings[tsconfigCompilerOptionsPathFix]) {
                pathMappings[tsconfigCompilerOptionsPathFix] = p;
            }
            // mappingArray.push(p);
        });
    });
});

const pathMappingsKeys = Object.keys(pathMappings);
// console.log("###############");
// console.log("###############");
// console.log("###############");
// console.log("###############");
// console.log(pathMappings);

(async () => {
const dirPaths = await filehound.create()
    .depth(0)
    .paths("./dist/") // relative to process.cwd(), not __dirname
    .directory()
    .find();

for (dirPath of dirPaths) {
    // console.log(`DIST TARGET: ${dirPath}`);

    if (dirPath.indexOf("dist" + path.sep + "es") < 0) {
        console.log(`SKIPPED: ${dirPath}`);
        continue;
    }

    const filePaths = await filehound.create()
        .paths(dirPath) // relative to process.cwd(), not __dirname
        .ext([".js", ".ts"])
        .find();

    dirPath = dirPath.replace(/\\/g, "/");
    const dirPath_ = fs.realpathSync(dirPath);
    filePaths.forEach((filePath) => {

        filePath = fs.realpathSync(filePath);

        // relative to process.cwd(), not __dirname
        let code = fs.readFileSync(filePath, "utf8");
        let codeNew = code;

        const isTypeScript = filePath.endsWith(".ts");

        const regex1 = isTypeScript ?
            /from[\s]*('|")(.+)('|")/g :
            /require[\s]*\([\s]*('|")(.+)('|")[\s]*\)/g;
        let regex1Match = regex1.exec(code);
        // let firstMatch = true;
        while (regex1Match) {
            // console.log(`1 == ${regex1Match[0]} (${regex1Match[2]})`);

            for (pathMappingsKey of pathMappingsKeys) {
            // pathMappingsKeys.forEach((pathMappingsKey) => {

                const regex2 = new RegExp(pathMappingsKey, "g");
                let regex2Match = regex2.exec(regex1Match[2]);
                if (!regex2Match || !regex2Match[1]) {
                    continue; // return;
                }

                // if (firstMatch) {
                //     console.log("===============");
                //     console.log("=============== " + filePath);
                //     firstMatch = false;
                // }

                // console.log(`2 == ${regex2Match[0]} (${regex2Match[1]})`);

                let replacement = "";
                let expanded = pathMappings[pathMappingsKey];
                if (expanded.indexOf("/node_modules/") >= 0) {

                    replacement = path.relative(process.cwd(),
                        path.join(expanded, regex2Match[1])
                    );
                    replacement = replacement.replace(/\\/g, "/");

                    replacement = replacement.replace("node_modules/", "");

                    const regex3 = /dist\/(.+)/g;
                    let regex3Match = regex3.exec(dirPath);

                    replacement = replacement.replace("/dist/es5/", "/dist/" + regex3Match[1] + "/");
                } else {
                    replacement = path.relative(
                        path.dirname(filePath),
                        path.join(dirPath_,
                            path.relative(process.cwd(),
                                path.join(expanded, regex2Match[1])
                                )
                            )
                        );

                    replacement = replacement.replace(/\\/g, "/");
                    if (replacement[0] !== ".") {
                        replacement = "./" + replacement;
                    }
                }

                // console.log(`${regex1Match[2]} ==> ${replacement}`);
                // console.log(`=====> ${regex1Match[0]} >>> ${regex1Match[1]}${replacement}${regex1Match[3]}`);

                codeNew = codeNew.replace(regex1Match[0],
                    (isTypeScript ? "from " : "require(")
                    + regex1Match[1] + replacement + regex1Match[3]
                    + (isTypeScript ? "" : ")")
                );

                break;
            // });
            }

            regex1Match = regex1.exec(code); // loop
        }

        // relative to process.cwd(), not __dirname
        fs.writeFileSync(filePath, codeNew, "utf8");
    });
}
})();
