var fs = require("fs");
var path = require("path");
var exec = require('child_process').exec;

console.log("process.cwd():");
console.log(process.cwd());
console.log("path.resolve(\".\")");
console.log(path.resolve("."));

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

let target = args[0];
if (!target) {
    console.log("TARGET ARGUMENT IS MISSING.");
    process.exit(1);
}

if (!args[1]) {
    console.log("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}

const argPath = args[1].trim();
let filePath = argPath;
console.log(filePath);
if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, argPath);
    console.log(filePath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), argPath);
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            console.log("FILEPATH DOES NOT EXIST.");
            process.exit(1);
        }
    }
}

filePath = fs.realpathSync(filePath);
console.log(`path (normalized): ${filePath}`);

const fileName = path.basename(filePath);
const ext = path.extname(fileName).toLowerCase();

var filePathRelative = path.relative(path.resolve("."), filePath);
console.log(`path (relative): ${filePathRelative}`);

var filePathRelativeDist = path.join("dist", target, filePathRelative);
console.log(`path (relative in DIST): ${filePathRelativeDist}`);
const nBacks = filePathRelativeDist.split("/").length - 1;

var filePathRelativeDist_JS = filePathRelativeDist.replace(".ts", ".js");
var filePathRelativeDist_JS_MAP = filePathRelativeDist.replace(".ts", ".js.map");
var filePathRelativeDist_D_TS = filePathRelativeDist.replace(".ts", ".d.ts");
var filePathRelativeDist_X = filePathRelativeDist.replace(".ts", ".*");

var parentDistDir = path.dirname(filePathRelativeDist);

var cmdlines = [];

var cmdLine = `cp "./${filePathRelative}" "./${filePathRelativeDist}" \
&& mv "${filePathRelativeDist_JS}" "${filePathRelativeDist_JS}_PREVIOUS" \
&& mv "${filePathRelativeDist_JS_MAP}" "${filePathRelativeDist_JS_MAP}_PREVIOUS" \
&& mv "${filePathRelativeDist_D_TS}" "${filePathRelativeDist_D_TS}_PREVIOUS"`;
cmdlines.push(cmdLine);

const tmpTsConfigPath = "./tsconfig-TMP.json";

const tsconfigJsonStr =
`{ "extends": "./tsconfigs/tsconfig-${target}", "include": [ "./src/declarations.d.ts", "./${filePathRelativeDist}" ] }`;
fs.writeFileSync(tmpTsConfigPath, tsconfigJsonStr, "utf8");

// cmdLine = `echo "TSCONFIG: ${tsconfigJsonStr}"`;
// cmdlines.push(cmdLine);

const distDirFullPath = fs.realpathSync(path.resolve(`./dist/${target}`));
console.log(`dist target dir path: ${distDirFullPath}`);

var relativePathRealTypeScriptSource = "";
for (var nBack = 0; nBack < nBacks; nBack++) {
    relativePathRealTypeScriptSource += "../";
}
console.log(`relativePathRealTypeScriptSource: ${relativePathRealTypeScriptSource}`);

cmdLine = `node "node_modules/typescript/bin/tsc" \
-p "${tmpTsConfigPath}" \
--rootDir ${distDirFullPath} \
--baseUrl ${distDirFullPath} \
--sourceRoot ${relativePathRealTypeScriptSource} \
`;
cmdlines.push(cmdLine);

cmdLine = `rm "${tmpTsConfigPath}" \
&& rm "${filePathRelativeDist}" \
&& echo "==== DIFF JS:" \
&& diff "${filePathRelativeDist_JS}" "${filePathRelativeDist_JS}_PREVIOUS" \
; echo "==== DIFF D TS:" \
&& diff "${filePathRelativeDist_D_TS}" "${filePathRelativeDist_D_TS}_PREVIOUS" \
; rm "${filePathRelativeDist_JS}_PREVIOUS" \
&& rm "${filePathRelativeDist_JS_MAP}_PREVIOUS" \
&& rm "${filePathRelativeDist_D_TS}_PREVIOUS" \
`;
//&& ls "${filePathRelativeDist_X}" \
// ; echo "DIFF JS MAP:" && diff "${filePathRelativeDist_JS_MAP}" "${filePathRelativeDist_JS_MAP}_PREVIOUS" \
// && ls -als "${parentDistDir}" \
cmdlines.push(cmdLine);

// console.log(cmdlines);

function execCmd(i) {
    var cmd = cmdlines[i];
    if (!cmd) return;

    var child = exec(cmd,
        function (error, stdout, stderr) {
            if (stdout) {
                console.log('-- exec stdout: ');
                console.log(stdout);
            }
            if (stderr) {
                console.log('-- exec stderr: ');
                console.log(stderr);
            }
            if (error) {
                console.log('-- exec error: ');
                console.log(error);
            }

            execCmd(++i);
        });
}
execCmd(0);
