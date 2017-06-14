import * as fs from "fs";
import * as path from "path";

import { CbzParsePromise } from "@parser/cbz";
import { EpubParsePromise } from "@parser/epub";
import { encodeURIComponent_RFC3986, isHTTP } from "@utils/http/UrlUtils";
import * as debug_ from "debug";
import * as moment from "moment";
import { JSON as TAJSON } from "ta-json";

import { OPDSFeed } from "@models/opds2/opds2";
import { OPDSMetadata } from "@models/opds2/opds2-metadata";
import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";

const debug = debug_("r2:opds2create");

debug(`process.cwd(): ${process.cwd()}`);
debug(`__dirname: ${__dirname}`);

let args = process.argv.slice(2);
// debug("process.argv.slice(2): %o", args);

if (!args.length) {
    debug("FILEPATH ARGUMENTS ARE MISSING.");
    process.exit(1);
}
const opdsJsonFilePath = args[0];
args = args.slice(1);
if (fs.existsSync(opdsJsonFilePath)) {
    debug("OPDS2 JSON file already exists.");
    process.exit(1);
}

// tslint:disable-next-line:no-floating-promises
(async () => {
    const publications = new OPDSFeed();
    publications.Context = ["http://opds-spec.org/opds.jsonld"];
    publications.Metadata = new OPDSMetadata();
    publications.Metadata.RDFType = "http://schema.org/DataFeed";
    publications.Metadata.Title = "Readium 2 OPDS 2.0 Feed";
    publications.Metadata.Modified = moment(Date.now()).toDate();

    publications.Publications = new Array<Publication>();

    let nPubs = 0;
    for (const pathBase64 of args) {
        const pathBase64Str = new Buffer(pathBase64, "base64").toString("utf8");

        if (isHTTP(pathBase64Str)) {
            continue;
        }

        const fileName = path.basename(pathBase64Str);
        const ext = path.extname(fileName).toLowerCase();

        debug(`OPDS parsing: ${pathBase64Str}`);
        let publication: Publication | undefined;
        try {
            publication = ext === ".epub" ?
                await EpubParsePromise(pathBase64Str) :
                await CbzParsePromise(pathBase64Str);
        } catch (err) {
            debug(err);
            continue;
        }

        nPubs++;
        const filePathBase64Encoded = encodeURIComponent_RFC3986(pathBase64);

        const publi = new Publication();
        publi.Links = new Array<Link>();
        const linkSelf = new Link();
        linkSelf.Href = filePathBase64Encoded + "/manifest.json";
        linkSelf.TypeLink = "application/webpub+json";
        linkSelf.Rel = new Array<string>();
        linkSelf.Rel.push("self");
        publi.Links.push(linkSelf);

        publi.Images = new Array<Link>();
        const coverLink = publication.GetCover();
        if (coverLink) {
            const linkCover = new Link();
            linkCover.Href = filePathBase64Encoded + "/" + coverLink.Href;
            linkCover.TypeLink = coverLink.TypeLink;
            // linkCover.Rel = new Array<string>();
            // linkCover.Rel.push("cover");

            if (coverLink.Width && coverLink.Height) {
                linkCover.Width = coverLink.Width;
                linkCover.Height = coverLink.Height;

            }
            publi.Images.push(linkCover);
        }

        if (publications.Metadata) {
            // TODO: clone by copy values, not by reference
            // selective copy? or full metadata
            publi.Metadata = publication.Metadata;
        }

        publications.Publications.push(publi);
    }

    publications.Metadata.NumberOfItems = nPubs;

    const jsonObj = TAJSON.serialize(publications);
    const jsonStr = global.JSON.stringify(jsonObj, null, "");
    fs.writeFileSync(opdsJsonFilePath, jsonStr, "utf8");

    debug("DONE! :)");
    debug(opdsJsonFilePath);
})();
