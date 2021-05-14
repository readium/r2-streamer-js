// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as child_process from "child_process";
import * as debug_ from "debug";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import { tmpNameSync } from "tmp";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { Publication } from "@r2-shared-js/models/publication";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { CertificateData, generateSelfSignedData } from "../utils/self-signed";
import { serverAssets } from "./server-assets";
import { serverLCPLSD_show } from "./server-lcp-lsd-show";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverOPDS_browse_v1 } from "./server-opds-browse-v1";
import { serverOPDS_browse_v2 } from "./server-opds-browse-v2";
import { serverOPDS_convert_v1_to_v2 } from "./server-opds-convert-v1-to-v2";
import { serverOPDS_local_feed } from "./server-opds-local-feed";
import { serverPub } from "./server-pub";
import { serverRoot } from "./server-root";
import { IHTTPHeaderNameValue, serverSecure, serverSecureHTTPHeader } from "./server-secure";
import { serverRemotePub } from "./server-url";
import { serverVersion } from "./server-version";

const debug = debug_("r2:streamer#http/server");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IPathPublicationMap { [key: string]: any; }

export interface ServerData extends CertificateData {
    urlScheme: string;
    urlHost: string;
    urlPort: number;
}

export interface IServerOptions {
    disableReaders?: boolean;
    disableDecryption?: boolean; /* excludes obfuscated fonts */
    disableRemotePubUrl?: boolean;
    disableOPDS?: boolean;
    maxPrefetchLinks?: number;
}

// this ceiling value seems very arbitrary ... what would be a reasonable default value?
// ... based on what metric, any particular HTTP server or client implementation?
export const MAX_PREFETCH_LINKS = 10;

export class Server {
    public readonly disableReaders: boolean;
    public readonly disableDecryption: boolean;
    public readonly disableRemotePubUrl: boolean;
    public readonly disableOPDS: boolean;
    public readonly maxPrefetchLinks: number;

    public readonly lcpBeginToken = "*-";
    public readonly lcpEndToken = "-*";

    private readonly publications: string[];
    private publicationsOPDSfeed: OPDSFeed | undefined;
    private publicationsOPDSfeedNeedsUpdate: boolean;
    private readonly pathPublicationMap: IPathPublicationMap;
    private creatingPublicationsOPDS: boolean;
    private readonly opdsJsonFilePath: string;

    private readonly expressApp: express.Application;

    private httpServer: http.Server | undefined;
    private httpsServer: https.Server | undefined;

    private serverData: ServerData | undefined;

    constructor(options?: IServerOptions) {

        this.disableReaders = options && options.disableReaders ? options.disableReaders : false;
        this.disableDecryption = options && options.disableDecryption ? options.disableDecryption : false;
        this.disableRemotePubUrl = options && options.disableRemotePubUrl ? options.disableRemotePubUrl : false;
        this.disableOPDS = options && options.disableOPDS ? options.disableOPDS : false;

        // note: zero not allowed (fallback to default MAX_PREFETCH_LINKS). use -1 to disable ceiling value.
        this.maxPrefetchLinks = options && options.maxPrefetchLinks ? options.maxPrefetchLinks : MAX_PREFETCH_LINKS;

        this.publications = [];
        this.pathPublicationMap = {};
        this.publicationsOPDSfeed = undefined;
        this.publicationsOPDSfeedNeedsUpdate = true;
        this.creatingPublicationsOPDS = false;

        this.opdsJsonFilePath = tmpNameSync({ prefix: "readium2-OPDS2-", postfix: ".json" });

        this.expressApp = express();
        // this.expressApp.enable('strict routing');

        serverSecure(this, this.expressApp);

        // https://expressjs.com/en/4x/api.html#express.static
        const staticOptions = {
            etag: false,
        };
        if (!this.disableReaders) {
            this.expressApp.use("/readerNYPL", express.static("misc/readers/reader-NYPL", staticOptions));
            this.expressApp.use("/readerHADRIEN", express.static("misc/readers/reader-HADRIEN", staticOptions));
        }

        serverRoot(this, this.expressApp);
        serverVersion(this, this.expressApp);

        if (!this.disableRemotePubUrl) {
            serverRemotePub(this, this.expressApp);
            serverLCPLSD_show(this, this.expressApp);
        }
        if (!this.disableOPDS) {
            serverOPDS_browse_v1(this, this.expressApp);
            serverOPDS_browse_v2(this, this.expressApp);
            serverOPDS_local_feed(this, this.expressApp);
            serverOPDS_convert_v1_to_v2(this, this.expressApp);
        }

        const routerPathBase64: express.Router = serverPub(this, this.expressApp);
        serverManifestJson(this, routerPathBase64);
        serverMediaOverlays(this, routerPathBase64);
        serverAssets(this, routerPathBase64);
    }

    // TODO: HTTP header `X-Robots-Tag` === `none`?
    public preventRobots() {
        this.expressApp.get("/robots.txt", (_req: express.Request, res: express.Response) => {

            const robotsTxt = `User-agent: *
Disallow: /
`;
            res.header("Content-Type", "text/plain");
            res.status(200).send(robotsTxt);
        });
    }

    public expressUse(pathf: string, func: express.Handler) {
        this.expressApp.use(pathf, func);
    }

    public expressGet(paths: string[], func: express.Handler) {
        this.expressApp.get(paths, func);
    }

    public isStarted(): boolean {
        return (typeof this.serverInfo() !== "undefined") &&
            (typeof this.httpServer !== "undefined") ||
            (typeof this.httpsServer !== "undefined");
    }

    public isSecured(): boolean {
        return (typeof this.serverInfo() !== "undefined") &&
            (typeof this.httpsServer !== "undefined");
    }

    public getSecureHTTPHeader(url: string): IHTTPHeaderNameValue | undefined {
        return serverSecureHTTPHeader(this, url);
    }

    public async start(port: number, secure: boolean): Promise<ServerData> {

        if (this.isStarted()) {
            return Promise.resolve(this.serverInfo() as ServerData);
        }

        let envPort = 0;
        try {
            envPort = process.env.PORT ? parseInt(process.env.PORT as string, 10) : 0;
        } catch (err) {
            debug(err);
            envPort = 0;
        }
        const p = port || envPort || 3000;
        debug(`PORT: ${port} || ${envPort} || 3000 => ${p}`);

        if (secure) {
            this.httpServer = undefined;

            return new Promise<ServerData>(async (resolve, reject) => {
                let certData: CertificateData | undefined;
                try {
                    certData = await generateSelfSignedData();
                } catch (err) {
                    debug(err);
                    reject("err");
                    return;
                }

                this.httpsServer = https.createServer({ key: certData.private, cert: certData.cert },
                    this.expressApp).listen(p, () => {

                        this.serverData = {
                            ...certData,
                            urlHost: "127.0.0.1",
                            urlPort: p, // this.httpsServer.address().port
                            urlScheme: "https",
                        } as ServerData;
                        resolve(this.serverData);
                    });
            });
        } else {
            this.httpsServer = undefined;

            return new Promise<ServerData>((resolve, _reject) => {
                this.httpServer = http.createServer(this.expressApp).listen(p, () => {

                    this.serverData = {
                        urlHost: "127.0.0.1",
                        urlPort: p, // this.httpsServer.address().port
                        urlScheme: "http",
                    } as ServerData;
                    resolve(this.serverData);
                });
                // this.httpServer = this.expressApp.listen(p, () => {
                //     debug(`http://localhost:${p}`);
                // });
            });
        }
    }

    public stop() {
        if (this.isStarted()) {
            if (this.httpServer) {
                this.httpServer.close();
                this.httpServer = undefined;
            }
            if (this.httpsServer) {
                this.httpsServer.close();
                this.httpsServer = undefined;
            }
            this.serverData = undefined;
            this.uncachePublications();
        }
    }

    public serverInfo(): ServerData | undefined {
        return this.serverData;
    }

    public serverUrl(): string | undefined {
        if (!this.isStarted()) {
            return undefined;
        }
        const info = this.serverInfo();
        if (!info) {
            return undefined;
        }

        // This is important, because browsers collapse the standard HTTP and HTTPS ports,
        // and we don't normalise this elsewhere in consumer code!
        // (which means critical URL prefix matching / syntax comparisons would fail otherwise :(
        if (info.urlPort === 443 || info.urlPort === 80) {
            return `${info.urlScheme}://${info.urlHost}`;
        }
        return `${info.urlScheme}://${info.urlHost}:${info.urlPort}`;

        // const port = this.httpServer ? this.httpServer.address().port :
        //     (this.httpsServer ? this.httpsServer.address().port : 0);
        // return this.isStarted() ?
        //     `${this.httpsServer ? "https:" : "http:"}//127.0.0.1:${port}` :
        //     undefined;
    }

    public setResponseCacheHeaders(res: express.Response, enableCaching: boolean) {

        if (enableCaching) {
            res.setHeader("Cache-Control", "public,max-age=86400");
        } else {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
        }
    }

    public setResponseCORS(res: express.Response) {
        res.setHeader("Access-Control-Allow-Origin",
            "*");

        res.setHeader("Access-Control-Allow-Methods",
            "GET, HEAD, OPTIONS"); // POST, DELETE, PUT, PATCH

        res.setHeader("Access-Control-Allow-Headers",
            // tslint:disable-next-line:max-line-length
            "Content-Type, Content-Length, Accept-Ranges, Content-Range, Range, Link, Transfer-Encoding, X-Requested-With, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, Keep-Alive, If-Modified-Since");

        res.setHeader("Access-Control-Expose-Headers",
            // tslint:disable-next-line:max-line-length
            "Content-Type, Content-Length, Accept-Ranges, Content-Range, Range, Link, Transfer-Encoding, X-Requested-With, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, Keep-Alive, If-Modified-Since");
    }

    public addPublications(pubs: string[]): string[] {
        pubs.forEach((pub) => {
            if (this.publications.indexOf(pub) < 0) {
                this.publicationsOPDSfeedNeedsUpdate = true;
                this.publications.push(pub);
            }
        });

        return pubs.map((pub) => {
            const pubid = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
            return `/pub/${pubid}/manifest.json`;
        });
    }

    public removePublications(pubs: string[]): string[] {
        pubs.forEach((pub) => {
            this.uncachePublication(pub);
            const i = this.publications.indexOf(pub);
            if (i >= 0) {
                this.publicationsOPDSfeedNeedsUpdate = true;
                this.publications.splice(i, 1);
            }
        });

        return pubs.map((pub) => {
            const pubid = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
            return `/pub/${pubid}/manifest.json`;
        });
    }

    public getPublications(): string[] {
        return this.publications;
    }

    public async loadOrGetCachedPublication(filePath: string): Promise<Publication> {

        let publication = this.cachedPublication(filePath);
        if (!publication) {

            // const fileName = path.basename(pathBase64Str);
            // const ext = path.extname(fileName).toLowerCase();

            try {
                publication = await PublicationParsePromise(filePath);
            } catch (err) {
                debug(err);
                return Promise.reject(err);
            }

            this.cachePublication(filePath, publication);
        }
        // return Promise.resolve(publication);
        return publication;
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

    public uncachePublication(filePath: string) {
        if (this.isPublicationCached(filePath)) {
            const pub = this.cachedPublication(filePath);
            if (pub) {
                pub.freeDestroy();
            }
            this.pathPublicationMap[filePath] = undefined;
            delete this.pathPublicationMap[filePath];
        }
    }

    public uncachePublications() {
        Object.keys(this.pathPublicationMap).forEach((filePath) => {
            this.uncachePublication(filePath);
        });
    }

    public publicationsOPDS(): OPDSFeed | undefined {

        if (this.publicationsOPDSfeedNeedsUpdate) {
            this.publicationsOPDSfeed = undefined;
            if (fs.existsSync(this.opdsJsonFilePath)) {
                fs.unlinkSync(this.opdsJsonFilePath);
            }
        }

        if (this.publicationsOPDSfeed) {
            return this.publicationsOPDSfeed;
        }

        debug(`OPDS2.json => ${this.opdsJsonFilePath}`);
        if (!fs.existsSync(this.opdsJsonFilePath)) {
            if (!this.creatingPublicationsOPDS) {
                this.creatingPublicationsOPDS = true;

                this.publicationsOPDSfeedNeedsUpdate = false;

                const jsFile = path.join(__dirname, "opds2-create-cli.js");
                const args = [jsFile, this.opdsJsonFilePath];
                this.publications.forEach((pub) => {
                    const filePathBase64 = encodeURIComponent_RFC3986(Buffer.from(pub).toString("base64"));
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
                    debug(data.toString());
                });
                child.stderr.on("data", (data) => {
                    debug(data.toString());
                });
            }
            return undefined;
        }
        this.creatingPublicationsOPDS = false;
        const jsonStr = fs.readFileSync(this.opdsJsonFilePath, { encoding: "utf8" });
        if (!jsonStr) {
            return undefined;
        }
        const json = global.JSON.parse(jsonStr);

        this.publicationsOPDSfeed = TaJsonDeserialize<OPDSFeed>(json, OPDSFeed);
        return this.publicationsOPDSfeed;
    }
}
