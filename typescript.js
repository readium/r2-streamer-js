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

let filePath = args[0];
if (!filePath) {
    console.log("FILEPATH ARGUMENT IS MISSING.");
    process.exit(1);
}

filePath = filePath.trim();
console.log(filePath);
if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, filePath);
    console.log(filePath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), filePath);
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

var filePathRelativeDist = path.join("dist", filePathRelative);
console.log(`path (relative in DIST): ${filePathRelativeDist}`);

var cmdline = `cp ${filePathRelative} ${filePathRelativeDist} \
&& node node_modules/typescript/bin/tsc \
--strictNullChecks --sourceMap --noImplicitAny --module commonjs --target es2015 --experimentalDecorators --emitDecoratorMetadata --declaration --noUnusedLocals false --noUnusedParameters \
--outDir ./dist/ \
--rootDir ./dist/ \
./src/declarations.d.ts \
${filePathRelativeDist} \
&& rm ${filePathRelativeDist}`;

console.log(cmdline);

var child = exec(cmdline,
    function (error, stdout, stderr) {
        console.log('exec stdout: ' + stdout);
        console.log('exec stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
// cp ./src/cli.ts ./dist/src/
// node node_modules/typescript/bin/tsc --strictNullChecks --sourceMap --noImplicitAny --module commonjs --target es2015 --experimentalDecorators --emitDecoratorMetadata --declaration --noUnusedLocals false --noUnusedParameters --outDir ./dist/ --rootDir ./dist/ ./src/declarations.d.ts ./dist/src/cli.ts
// && rm ./dist/src/cli.ts