let json = {
    "short": "NOT A GIT REPO?",
    "long": "NOT A GIT REPO?",
    "branch": "NOT A GIT REPO?",
    "date": "NOT A GIT REPO?",
    "dirty": "NOT A GIT REPO?",
    "urlHistory": "NOT A GIT REPO?",
    "urlDiff": "NOT A GIT REPO?",
};

var exec = require("child_process").exec;
exec("npm --version", function(execError, stdin, stderr) {
    var npmVersion = "?";
    if (execError) {
        console.log(execError);

        if (execError.code === 127) {
            console.log("NPM not found?");
        }
        if (stderr) {
            console.log(stderr.trim());
        }
        if (stdin) {
            console.log(stdin.trim());
        }
    } else {
        npmVersion = stdin.toString().trim(); // .split('\n')[0].trim();
    }

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
        const gitUrlBase = "https://github.com/readium/r2-streamer-js/";
        json = {
            "node": process.version.replace("v", ""),
            "npm": npmVersion,
            "short": git.short(),
            "long": git.long(),
            "branch": branch,
            "date": git.date(),
            // "dirty": git.isTagDirty(),
        };
        json["urlHistory"] = gitUrlBase + "commits/" + json.long;
        json["urlDiff"] = gitUrlBase + "compare/" + json.long + "..." + json.branch;

        // relative to process.cwd(), not __dirname
        fs.writeFileSync("./dist/gitrev.json", JSON.stringify(json, null, "  "), "utf8");
    } catch (err) {
        console.log(err);
    }
});
