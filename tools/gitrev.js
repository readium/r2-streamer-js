let json = {
    "short": "NOT A GIT REPO?",
    "long": "NOT A GIT REPO?",
    "branch": "NOT A GIT REPO?",
    "date": "NOT A GIT REPO?",
    "dirty": "NOT A GIT REPO?",
    "urlHistory": "NOT A GIT REPO?",
    "urlDiff": "NOT A GIT REPO?",
};

try {
    var git = require("git-rev-sync");

    var fs = require("fs");
    var path = require("path");

    // console.log("process.cwd():");
    // console.log(process.cwd());
    // console.log("path.resolve(\".\")");
    // console.log(path.resolve("."));

    // console.log("__dirname:");
    // console.log(__dirname);

    // const args = process.argv.slice(2);
    // console.log("args:");
    // console.log(args);

    const detached = "Detached: ";
    let branch = git.branch();
    if (branch.indexOf(detached) === 0) {
        branch = branch.substr(detached.length);
    }
    const gitUrlBase = "https://github.com/edrlab/r2-streamer-js/";
    json = {
        "short": git.short(),
        "long": git.long(),
        "branch": branch,
        "date": git.date(),
        "dirty": git.isTagDirty(),
    };
    json["urlHistory"] = gitUrlBase + "commits/" + json.long;
    json["urlDiff"] = gitUrlBase + "compare/" + json.long + "..." + json.branch;

    // relative to process.cwd(), not __dirname
    fs.writeFileSync("./dist/gitrev.json", JSON.stringify(json, null, "  "), "utf8");
} catch (err) {
    console.log(err);
}
