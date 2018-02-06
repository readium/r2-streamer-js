import * as path from "path";
import * as querystring from "querystring";

import { encodeURIComponent_RFC3986, isHTTP } from "@utils/http/UrlUtils";
import * as debug_ from "debug";
import * as express from "express";
import * as morgan from "morgan";

import { IRequestPayloadExtension, _pathBase64 } from "./request-ext";
import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

const debug = debug_("r2:streamer#http/server-pub");

export function serverPub(server: Server, topRouter: express.Application): express.Router {

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

    const urlReaderREADIUM1 =
        "http://readium-2.surge.sh/?epub=PREFIX"
        + querystring.escape(urlBook);

    const htmlLanding = "<html><body><h1>PATH_STR</h1><h2><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></h2>" +
        (server.disableReaders ? "" : (
            "<p>Reader NYPL:<br><a href='" +
            urlReaderNYPL + "'>" + urlReaderNYPL + "</a></p><p>Reader HADRIEN:<br><a href='" +
            urlReaderHADRIEN + "'>" + urlReaderHADRIEN + "</a></p><p>Reader EPUB.js:<br><a href='" +
            urlReaderEPUBJS + "'>" + urlReaderEPUBJS + "</a></p><p>Reader HADRIEN BASIC:<br><a href='" +
            urlReaderHADRIENbasic + "'>" + urlReaderHADRIENbasic + "</a></p><p>Reader READIUM-1:<br><a href='" +
            urlReaderREADIUM1 + "'>" + urlReaderREADIUM1 + "</a></p>")) +
        "</body></html>";

    const routerPathBase64 = express.Router({ strict: false });
    routerPathBase64.use(morgan("combined"));

    routerPathBase64.use(trailingSlashRedirect);

    routerPathBase64.param("pathBase64", (req, res, next, value, _name) => {

        const reqparams = req.params as IRequestPayloadExtension;

        if (value.indexOf(server.lcpBeginToken) === 0 && value.indexOf(server.lcpEndToken) > 0) {
            const i = value.indexOf(server.lcpEndToken);
            const pass64 = value.substr(server.lcpBeginToken.length, i - server.lcpBeginToken.length);
            // const pass = new Buffer(pass64, "base64").toString("utf8");
            (req as IRequestPayloadExtension).lcpPass64 = pass64;

            value = value.substr(i + server.lcpEndToken.length);
            reqparams.pathBase64 = value;
            debug(value);
        }

        const valueStr = new Buffer(value, "base64").toString("utf8");
        debug(valueStr);
        if (isHTTP(valueStr)) {
            // debug(`Publication URL: ${valueStr}`);

            (req as IRequestPayloadExtension).pathBase64 = value;
            next();
            return;
        }

        const found = server.getPublications().find((filePath) => {
            const filePathBase64 = new Buffer(filePath).toString("base64");
            return value === filePathBase64;
        });

        if (found) {
            (req as IRequestPayloadExtension).pathBase64 = value;
            next();
        } else {
            res.status(403).send("<html><body><p>Forbidden</p><p>INVALID parameter: <code>"
                + reqparams.pathBase64 + "</code></p></body></html>");
            // next(new Error("INVALID file param"));
        }
    });

    routerPathBase64.get("/:" + _pathBase64, (req: express.Request, res: express.Response) => {

        const reqparams = req.params as IRequestPayloadExtension;

        if (!reqparams.pathBase64) {
            reqparams.pathBase64 = (req as IRequestPayloadExtension).pathBase64;
        }

        const pathBase64Str = new Buffer(reqparams.pathBase64, "base64").toString("utf8");
        debug(`Publication: ${pathBase64Str}`);

        const isSecureHttp = req.secure ||
            req.protocol === "https" ||
            req.get("X-Forwarded-Proto") === "https"
            // (req.headers.host && req.headers.host.indexOf("now.sh") >= 0) ||
            // (req.hostname && req.hostname.indexOf("now.sh") >= 0)
            ;

        // const debug = req.hostname + " -- "
        //     + req.headers.host + " == "
        //     + req.protocol + " // "
        //     + req.secure + " .. "
        //     + req.get("X-Forwarded-Proto");

        res.status(200).send(htmlLanding
            // .replace("<body>", "<body><p>" + debug + "</p>")
            .replace(/PATH_STR/g, path.basename(pathBase64Str))
            .replace(/PATH_BASE64/g, encodeURIComponent_RFC3986(reqparams.pathBase64))
            .replace(/PREFIX/g,
            (isSecureHttp ?
                querystring.escape("https://") : querystring.escape("http://"))
            + req.headers.host).replace(/PREFIZ/g,
            (isSecureHttp ?
                "https://" : "http://")
            + req.headers.host));
    });

    topRouter.use("/pub", routerPathBase64);

    return routerPathBase64;
}
