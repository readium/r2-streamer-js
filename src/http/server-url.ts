import * as debug_ from "debug";
import * as express from "express";
import * as morgan from "morgan";

import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";

const debug = debug_("r2:streamer#http/server-url");

export function serverUrl(_server: Server, topRouter: express.Application) {

    const routerUrl = express.Router({ strict: false });
    routerUrl.use(morgan("combined"));

    routerUrl.use(trailingSlashRedirect);

    routerUrl.get("/", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
            `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
            `return "%" + c.charCodeAt(0).toString(16); }); }` +
            `function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '/url/' +` +
            ` encodeURIComponent_RFC3986(document.getElementById("url").value);` +
            `location.href = url;}</script>`;
        html += "</head>";

        html += "<body><h1>Publication URL</h1>";

        html += `<form onsubmit="go();return false;">` +
            `<input type="text" name="url" id="url" size="80">` +
            `<input type="submit" value="Go!"></form>`;

        html += "</body></html>";

        res.status(200).send(html);
    });

    routerUrl.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as any).urlEncoded = value;
        next();
    });

    routerUrl.get("/:urlEncoded(*)", (req: express.Request, res: express.Response) => {

        if (!req.params.urlEncoded) {
            req.params.urlEncoded = (req as any).urlEncoded;
        }

        const urlDecoded = req.params.urlEncoded;
        // if (urlDecoded.substr(-1) === "/") {
        //     urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
        // }
        debug(urlDecoded);

        const urlDecodedBase64 = new Buffer(urlDecoded).toString("base64");
        const redirect = req.originalUrl.substr(0, req.originalUrl.indexOf("/url/"))
            + "/pub/" + urlDecodedBase64 + "/";

        // No need for CORS with this URL redirect (HTML page lists available services)
        // server.setResponseCORS(res);

        debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
        res.redirect(301, redirect);
    });

    topRouter.use("/url", routerUrl);
}
