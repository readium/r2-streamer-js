import * as express from "express";

import { serverAssets } from "./server-assets";
import { serverManifestJson } from "./server-manifestjson";
import { serverMediaOverlays } from "./server-mediaoverlays";
import { serverPub } from "./server-pub";
import { encodeURIComponent_RFC3986 } from "./utils";

export function launchServer(filePaths: string[]) {

    const server = express();
    // server.enable('strict routing');

    // https://expressjs.com/en/4x/api.html#express.static
    const staticOptions = {
        etag: false,
    };

    server.use("/readerNYPL", express.static("reader-NYPL", staticOptions));
    server.use("/readerHADRIEN", express.static("reader-HADRIEN", staticOptions));

    server.get("/", (_req: express.Request, res: express.Response) => {

        // const fileName = path.basename(filePath);
        // const ext = path.extname(fileName).toLowerCase();

        let html = "<html><body><p>OK</p><p>Publications:";

        filePaths.forEach((filePath) => {
            const filePathBase64 = new Buffer(filePath).toString("base64");

            html += "<br><a href='./pub/" + encodeURIComponent_RFC3986(filePathBase64)
                + "'>" + "./pub/" + filePathBase64 + "</a>";
        });

        html += "</p></body></html>";

        res.status(200).send(html);
    });

    const routerPathBase64: express.Router = serverPub(server, filePaths);
    serverManifestJson(routerPathBase64);
    serverMediaOverlays(routerPathBase64);
    serverAssets(routerPathBase64);

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log("http://localhost:" + port);
    });
}
