var fs = require("fs");
var path = require("path");

console.log("process.cwd():");
console.log(process.cwd());
console.log("path.resolve(\".\")");
console.log(path.resolve("."));

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

var filePath = "./node_modules/electron/dist/Electron.app/Contents/Info.plist";
filePath = path.join(process.cwd(), filePath);

if (!fs.existsSync(filePath)) {
    return;
}

filePath = fs.realpathSync(filePath);
console.log(`path (normalized): ${filePath}`);

// relative to process.cwd(), not __dirname
var plist = fs.readFileSync(filePath, "utf8");

plist = plist.replace(/(<key>CFBundleName[^>]+>[\s]+<string>)(Electron)/, "$1Readium2 ($2)");

// relative to process.cwd(), not __dirname
fs.writeFileSync(filePath, plist, "utf8");
