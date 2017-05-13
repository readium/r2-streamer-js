import * as debug_ from "debug";
import * as path from "path";

import * as express from "express";

import { serverAssets } from "./server-assets";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverPub } from "./server-pub";
import { encodeURIComponent_RFC3986 } from "./utils";

const debug = debug_("r2:server:main");

export class Server {
    private readonly publications: string[];

    constructor() {
        this.publications = [];

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

                html += "<p><strong>" + path.basename(pub)
                    + "</strong> => <a href='./pub/" + encodeURIComponent_RFC3986(filePathBase64)
                    + "'>" + "./pub/" + filePathBase64 + "</a></p>";
            });

            html += "</body></html>";

            res.status(200).send(html);
        });

        const routerPathBase64: express.Router = serverPub(this, server);
        serverManifestJson(routerPathBase64);
        serverMediaOverlays(routerPathBase64);
        serverAssets(routerPathBase64);

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
}
