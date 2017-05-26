import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

import * as debug_ from "debug";
import * as express from "express";
import { JSON as TAJSON } from "ta-json";
import { tmpNameSync } from "tmp";

import { encodeURIComponent_RFC3986, isHTTP } from "./_utils/http/UrlUtils";
import { OPDSFeed } from "./models/opds2/opds2";
import { Publication } from "./models/publication";
import { serverAssets } from "./server-assets";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverOPDS } from "./server-opds";
import { serverOPDS2 } from "./server-opds2";
import { serverPub } from "./server-pub";
import { serverUrl } from "./server-url";

const debug = debug_("r2:server:main");

interface IPathPublicationMap { [key: string]: any; }

export class Server {
    private readonly publications: string[];
    private publicationsOPDSfeed: OPDSFeed | undefined;
    private readonly pathPublicationMap: IPathPublicationMap;
    private creatingPublicationsOPDS: boolean;
    private readonly opdsJsonFilePath: string;

    constructor() {
        this.publications = [];
        this.pathPublicationMap = {};
        this.publicationsOPDSfeed = undefined;
        this.creatingPublicationsOPDS = false;

        this.opdsJsonFilePath = tmpNameSync({ prefix: "readium2-OPDS2-", postfix: ".json" });

        const server = express();
        // server.enable('strict routing');

        // https://expressjs.com/en/4x/api.html#express.static
        const staticOptions = {
            etag: false,
        };

        server.use("/readerNYPL", express.static("reader-NYPL", staticOptions));
        server.use("/readerHADRIEN", express.static("reader-HADRIEN", staticOptions));

        server.get("/", (_req: express.Request, res: express.Response) => {

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
            html += "</body></html>";

            res.status(200).send(html);
        });

        serverUrl(this, server);
        serverOPDS(this, server);
        serverOPDS2(this, server);

        const routerPathBase64: express.Router = serverPub(this, server);
        serverManifestJson(this, routerPathBase64);
        serverMediaOverlays(this, routerPathBase64);
        serverAssets(this, routerPathBase64);

        const port = process.env.PORT || 3000;
        debug(`PORT: ${process.env.PORT} => ${port}`);
        server.listen(port, () => {
            debug(`http://localhost:${port}`);
        });
    }

    public addPublications(pubs: string[]) {
        pubs.forEach((pub) => {
            if (this.publications.indexOf(pub) < 0) {
                this.publications.push(pub);
            }
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
