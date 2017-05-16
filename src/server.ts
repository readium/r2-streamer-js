import * as debug_ from "debug";
import * as path from "path";

import * as express from "express";

import { Publication } from "./models/publication";
import { serverAssets } from "./server-assets";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverOPDS } from "./server-opds";
import { serverPub } from "./server-pub";
import { serverUrl } from "./server-url";
import { encodeURIComponent_RFC3986 } from "./utils";

const debug = debug_("r2:server:main");

interface IPathPublicationMap { [key: string]: any; }

export class Server {
    private readonly publications: string[];
    private readonly pathPublicationMap: IPathPublicationMap;

    constructor() {
        this.publications = [];
        this.pathPublicationMap = {};

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
                    + (pub.indexOf("http") === 0 ? pub : path.basename(pub))
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

        const routerPathBase64: express.Router = serverPub(this, server);
        serverManifestJson(this, routerPathBase64);
        serverMediaOverlays(this, routerPathBase64);
        serverAssets(this, routerPathBase64);

        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            debug(`http://localhost: ${port}`);
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
}
