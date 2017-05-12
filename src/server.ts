import * as querystring from "querystring";

import * as express from "express";

import { serverAssets } from "./server-assets";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverPub } from "./server-pub";

export function launchServer(filePath: string) {

    // const fileName = path.basename(filePath);
    // const ext = path.extname(fileName).toLowerCase();

    const filePathBase64 = new Buffer(filePath).toString("base64");

    const urlBook = "/pub/" + filePathBase64 + "/manifest.json";
    const urlBookShowAll = "." + urlBook + "/show/all";

    const urlReaderNYPL = "./readerNYPL/?url=PREFIX" + querystring.escape(urlBook); // urlBook.replace(/=/g, "%3D")
    const urlReaderHADRIEN = "./readerHADRIEN/?manifest=true&href=PREFIX"
        + querystring.escape(urlBook); // urlBook.replace(/=/g, "%3D")

    const urlReaderEPUBJS =
        "https://s3.amazonaws.com/epubjs-manifest/examples/manifest.html?href=PREFIZ"
        + urlBook;

    const urlReaderHADRIENbasic =
        "https://hadriengardeur.github.io/webpub-manifest/examples/viewer/?manifest=true&href=PREFIX"
        + querystring.escape(urlBook);

    const htmlLanding = "<html><body><p>OK</p><p>Manifest dump:<br><a href='" +
        urlBookShowAll + "'>" + urlBookShowAll + "</a></p><p>Reader NYPL:<br><a href='" +
        urlReaderNYPL + "'>" + urlReaderNYPL + "</a></p><p>Reader HADRIEN:<br><a href='" +
        urlReaderHADRIEN + "'>" + urlReaderHADRIEN + "</a></p><p>Reader EPUB.js:<br><a href='" +
        urlReaderEPUBJS + "'>" + urlReaderEPUBJS + "</a></p><p>Reader HADRIEN BASIC:<br><a href='" +
        urlReaderHADRIENbasic + "'>" + urlReaderHADRIENbasic + "</a></p></body></html>";

    const server = express();
    server.get("/", (req: express.Request, res: express.Response) => {

        // // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(_req,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));

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

    server.use("/readerNYPL", express.static("reader-NYPL"));
    server.use("/readerHADRIEN", express.static("reader-HADRIEN"));

    const routerPathBase64: express.Router = serverPub(server, filePath, htmlLanding);
    serverManifestJson(routerPathBase64, filePath);
    serverMediaOverlays(routerPathBase64, filePath);
    serverAssets(routerPathBase64, filePath);

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log("http://localhost:" + port);
        console.log(urlBook);
    });
}
