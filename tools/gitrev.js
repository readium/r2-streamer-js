var fs = require("fs");
var path = require("path");
var git = require("git-rev-sync");

// console.log("process.cwd():");
// console.log(process.cwd());
// console.log("path.resolve(\".\")");
// console.log(path.resolve("."));

// console.log("__dirname:");
// console.log(__dirname);

// const args = process.argv.slice(2);
// console.log("args:");
// console.log(args);

const gitUrlBase = "https://github.com/edrlab/r2-streamer-js/";
const json = {
    "short": git.short(),
    "long": git.long(),
    "branch": git.branch(),
    "date": git.date(),
    "dirty": git.isTagDirty(),
};
json["urlHistory"] = gitUrlBase + "commits/" + json.long;
json["urlDiff"] = gitUrlBase + "compare/" + json.long + "..." + json.branch;

// relative to process.cwd(), not __dirname
fs.writeFileSync("./dist/gitrev.json", JSON.stringify(json, null, "  "), "utf8");
