import * as path from "path";
import * as querystring from "querystring";

import * as express from "express";
import * as morgan from "morgan";

import { trailingSlashRedirect } from "./server-trailing-slash-redirect";
import { encodeURIComponent_RFC3986 } from "./utils";

export function serverPub(server: express.Router, filePaths: string[]): express.Router {

    const urlBook = "/pub/PATH_BASE64/manifest.json";
    const urlBookShowAll = "./manifest.json/show/all";

    const urlReaderNYPL = "/readerNYPL/?url=PREFIX" + querystring.escape(urlBook);
    const urlReaderHADRIEN = "/readerHADRIEN/?manifest=true&href=PREFIX"
        + querystring.escape(urlBook);

    const urlReaderEPUBJS =
        "https://s3.amazonaws.com/epubjs-manifest/examples/manifest.html?href=PREFIZ"
        + urlBook;

    const urlReaderHADRIENbasic =
        "https://hadriengardeur.github.io/webpub-manifest/examples/viewer/?manifest=true&href=PREFIX"
        + querystring.escape(urlBook);

    const htmlLanding = "<html><body><h1>PATH_STR</h1><h2><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></h2><p>Reader NYPL:<br><a href='" +
        urlReaderNYPL + "'>" + urlReaderNYPL + "</a></p><p>Reader HADRIEN:<br><a href='" +
        urlReaderHADRIEN + "'>" + urlReaderHADRIEN + "</a></p><p>Reader EPUB.js:<br><a href='" +
        urlReaderEPUBJS + "'>" + urlReaderEPUBJS + "</a></p><p>Reader HADRIEN BASIC:<br><a href='" +
        urlReaderHADRIENbasic + "'>" + urlReaderHADRIENbasic + "</a></p></body></html>";

    const routerPathBase64 = express.Router({ strict: false });
    routerPathBase64.use(morgan("combined"));

    routerPathBase64.use(trailingSlashRedirect);

    routerPathBase64.param("pathBase64", (req, res, next, value, _name) => {

        const found = filePaths.find((filePath) => {
            const filePathBase64 = new Buffer(filePath).toString("base64");
            return value === filePathBase64;
        });

        if (found) {
            (req as any).pathBase64 = value;
            next();
        } else {
            res.status(403).send("<html><body><p>Forbidden</p><p>INVALID parameter: <code>"
                + req.params.pathBase64 + "</code></p></body></html>");
            // next(new Error("INVALID file param"));
        }
    });

    routerPathBase64.get("/:pathBase64", (req: express.Request, res: express.Response) => {

        if (!req.params.pathBase64) {
            req.params.pathBase64 = (req as any).pathBase64;
        }

        const pathBase64Str = new Buffer(req.params.pathBase64, "base64").toString("utf8");

        const isSecureHttp = req.secure ||
            req.protocol === "https" ||
            req.get("X-Forwarded-Protocol") === "https"
            // || true  // FIXME: forcing to secure http because forward proxy to HTTP localhost
            ;

        res.status(200).send(htmlLanding.replace(/PATH_STR/g, path.basename(pathBase64Str))
            .replace(/PATH_BASE64/g, encodeURIComponent_RFC3986(req.params.pathBase64))
            .replace(/PREFIX/g,
            (isSecureHttp ?
                querystring.escape("https://") : querystring.escape("http://"))
            + req.headers.host).replace(/PREFIZ/g,
            (isSecureHttp ?
                "https://" : "http://")
            + req.headers.host));
    });

    server.use("/pub", routerPathBase64);

    return routerPathBase64;
}
