import * as querystring from "querystring";

import * as express from "express";
import * as morgan from "morgan";

export function serverPub(server: express.Router, filePath: string, htmlLanding: string): express.Router {

    const filePathBase64 = new Buffer(filePath).toString("base64");

    const routerPathBase64 = express.Router();
    routerPathBase64.use(morgan("combined"));

    routerPathBase64.param("pathBase64", (req, res, next, value, _name) => {
        if (value === filePathBase64) {
            (req as any).pathBase64 = value;
            next();
        } else {
            res.status(403).send("<html><body><p>Forbidden</p><p>INVALID parameter: <code>"
                + req.params.pathBase64 + "</code></p></body></html>");
            // next(new Error("INVALID file param"));
        }
    });

    routerPathBase64.get("/:pathBase64", (req: express.Request, res: express.Response) => {

        const isSecureHttp = req.secure ||
            req.protocol === "https" ||
            req.get("X-Forwarded-Protocol") === "https" ||
            true; // TODO: the other tests do not appear to work on now.sh :(

        res.status(200).send(htmlLanding.replace(/PREFIX/g,
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
