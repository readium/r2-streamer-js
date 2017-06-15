import * as child_process from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";

import { OPDSFeed } from "@models/opds2/opds2";
import { Publication } from "@models/publication";
import { encodeURIComponent_RFC3986, isHTTP } from "@utils/http/UrlUtils";
import * as css2json from "css2json";
import * as debug_ from "debug";
import * as express from "express";
import * as jsonMarkup from "json-markup";
import { JSON as TAJSON } from "ta-json";
import { tmpNameSync } from "tmp";

import { serverAssets } from "./server-assets";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverOPDS } from "./server-opds";
import { serverOPDS2 } from "./server-opds2";
import { serverPub } from "./server-pub";
import { serverUrl } from "./server-url";

const debug = debug_("r2:server:main");

interface IPathPublicationMap { [key: string]: any; }

// https://github.com/mafintosh/json-markup/blob/master/style.css
const jsonStyle = `
.json-markup {
    line-height: 17px;
    font-size: 13px;
    font-family: monospace;
    white-space: pre;
}
.json-markup-key {
    font-weight: bold;
}
.json-markup-bool {
    color: firebrick;
}
.json-markup-string {
    color: green;
}
.json-markup-null {
    color: gray;
}
.json-markup-number {
    color: blue;
}
`;

export class Server {

    public readonly lcpBeginToken = "*-";
    public readonly lcpEndToken = "-*";

    private readonly publications: string[];
    private publicationsOPDSfeed: OPDSFeed | undefined;
    private readonly pathPublicationMap: IPathPublicationMap;
    private creatingPublicationsOPDS: boolean;
    private readonly opdsJsonFilePath: string;

    private readonly expressApp: express.Application;
    private httpServer: http.Server;

    constructor() {
        this.publications = [];
        this.pathPublicationMap = {};
        this.publicationsOPDSfeed = undefined;
        this.creatingPublicationsOPDS = false;

        this.opdsJsonFilePath = tmpNameSync({ prefix: "readium2-OPDS2-", postfix: ".json" });

        this.expressApp = express();
        // this.expressApp.enable('strict routing');

        // https://expressjs.com/en/4x/api.html#express.static
        const staticOptions = {
            etag: false,
        };

        this.expressApp.use("/readerNYPL", express.static("misc/readers/reader-NYPL", staticOptions));
        this.expressApp.use("/readerHADRIEN", express.static("misc/readers/reader-HADRIEN", staticOptions));

        this.expressApp.get("/", (_req: express.Request, res: express.Response) => {

            let html = "<html><body><h1>Publications</h1>";

            this.publications.forEach((pub) => {
                const filePathBase64 = new Buffer(pub).toString("base64");

                html += "<p><strong>"
                    + (isHTTP(pub) ? pub : path.basename(pub))
                    + "</strong><br> => <a href='./pub/" + encodeURIComponent_RFC3986(filePathBase64)
                    + "'>" + "./pub/" + filePathBase64 + "</a></p>";
            });
            html += "<h1>Custom publication URL</h1><p><a href='./url'>CLICK HERE</a></p>";
            html += "<h1>OPDS feed</h1><p><a href='./opds'>CLICK HERE</a></p>";
            html += "<h1>Server version</h1><p><a href='./version/show'>CLICK HERE</a></p>";
            html += "</body></html>";

            res.status(200).send(html);
        });

        this.expressApp.get(["/version", "/version/show/:jsonPath?"],
            (req: express.Request, res: express.Response) => {

                const isShow = req.url.indexOf("/show") >= 0 || req.query.show;
                if (!req.params.jsonPath && req.query.show) {
                    req.params.jsonPath = req.query.show;
                }

                const gitRevJson = "../../../gitrev_.json";
                if (!fs.existsSync(path.resolve(path.join(__dirname, gitRevJson)))) {

                    const err = "Missing Git rev JSON! ";
                    debug(err + gitRevJson);
                    res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                        + err + "</p></body></html>");
                    return;
                }

                const jsonObj = require(gitRevJson);
                // debug(jsonObj);

                if (isShow) {
                    const jsonPretty = jsonMarkup(jsonObj, css2json(jsonStyle));

                    res.status(200).send("<html><body>" +
                        "<h1>R2-STREAMER-JS VERSION INFO</h1>" +
                        "<hr><p><pre>" + jsonPretty + "</pre></p>" +
                        // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                        // "<p><pre>" + dumpStr + "</pre></p>" +
                        "</body></html>");
                } else {
                    this.setResponseCORS(res);
                    res.set("Content-Type", "application/json; charset=utf-8");

                    const jsonStr = JSON.stringify(jsonObj, null, "  ");

                    const checkSum = crypto.createHash("sha256");
                    checkSum.update(jsonStr);
                    const hash = checkSum.digest("hex");

                    const match = req.header("If-None-Match");
                    if (match === hash) {
                        debug("publications.json cache");
                        res.status(304); // StatusNotModified
                        res.end();
                        return;
                    }

                    res.setHeader("ETag", hash);

                    // res.setHeader("Cache-Control", "public,max-age=86400");

                    res.status(200).send(jsonStr);
                }
            });

        serverUrl(this, this.expressApp);
        serverOPDS(this, this.expressApp);
        serverOPDS2(this, this.expressApp);

        const routerPathBase64: express.Router = serverPub(this, this.expressApp);
        serverManifestJson(this, routerPathBase64);
        serverMediaOverlays(this, routerPathBase64);
        serverAssets(this, routerPathBase64);
    }

    public start(port: number): string {

        const p = port || process.env.PORT || 3000;
        debug(`PORT: ${p} || ${process.env.PORT} || 3000 => ${p}`);

        this.httpServer = this.expressApp.listen(p, () => {
            debug(`http://localhost:${p}`);
        });

        return `http://127.0.0.1:${p}`; // this.httpServer.address().port
    }

    public stop() {
        this.httpServer.close();
    }

    public setResponseCORS(res: express.Response) {
        res.setHeader("Access-Control-Allow-Origin",
            "*");

        res.setHeader("Access-Control-Allow-Methods",
            "GET, HEAD, OPTIONS"); // POST, DELETE, PUT, PATCH

        res.setHeader("Access-Control-Allow-Headers",
            "Content-Type, Content-Length, Accept-Ranges, Link, Transfer-Encoding");
    }

    public addPublications(pubs: string[]): string[] {
        pubs.forEach((pub) => {
            if (this.publications.indexOf(pub) < 0) {
                this.publications.push(pub);
            }
        });

        return pubs.map((pub) => {
            const pubid = new Buffer(pub).toString("base64");
            return `/pub/${pubid}/manifest.json`;
        });
    }

    public getPublications(): string[] {
        return this.publications;
    }

    public isPublicationCached(filePath: string): boolean {
        return typeof this.cachedPublication(filePath) !== "undefined";
    }

    public cachedPublication(filePath: string): Publication | undefined {
        return this.pathPublicationMap[filePath];
    }

    public cachePublication(filePath: string, pub: Publication) {
        // TODO: implement LRU caching algorithm? Anything smarter than this will do!
        if (!this.isPublicationCached(filePath)) {
            this.pathPublicationMap[filePath] = pub;
        }
    }

    public publicationsOPDS(): OPDSFeed | undefined {

        if (this.publicationsOPDSfeed) {
            return this.publicationsOPDSfeed;
        }

        debug(`OPDS2.json => ${this.opdsJsonFilePath}`);
        if (!fs.existsSync(this.opdsJsonFilePath)) {
            if (!this.creatingPublicationsOPDS) {
                this.creatingPublicationsOPDS = true;

                const jsFile = path.join(__dirname, "opds2-create-cli.js");
                const args = [jsFile, this.opdsJsonFilePath];
                this.publications.forEach((pub) => {
                    const filePathBase64 = new Buffer(pub).toString("base64");
                    args.push(filePathBase64);
                });
                // debug("SPAWN OPDS2 create: %o", args);
                debug(`SPAWN OPDS2-create: ${args[0]}`);

                const child = child_process.spawn("node", args, {
                    cwd: process.cwd(),
                    // detached: true,
                    env: process.env,
                    // stdio: ["ignore"],
                })
                    // .unref()
                    ;
                child.stdout.on("data", (data) => {
                    console.log(data.toString());
                });
                child.stderr.on("data", (data) => {
                    console.log(data.toString());
                });
            }
            return undefined;
        }
        const jsonStr = fs.readFileSync(this.opdsJsonFilePath, "utf8");
        if (!jsonStr) {
            return undefined;
        }
        const json = global.JSON.parse(jsonStr);

        this.publicationsOPDSfeed = TAJSON.deserialize<OPDSFeed>(json, OPDSFeed);
        return this.publicationsOPDSfeed;
    }
}
