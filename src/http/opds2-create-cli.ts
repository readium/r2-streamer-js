// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";

import { Publication } from "@models/publication";
import { OPDSFeed } from "@opds/opds2/opds2";
import { OPDSLink } from "@opds/opds2/opds2-link";
import { OPDSMetadata } from "@opds/opds2/opds2-metadata";
import { OPDSPublication } from "@opds/opds2/opds2-publication";
import { OPDSPublicationMetadata } from "@opds/opds2/opds2-publicationMetadata";
import { PublicationParsePromise } from "@parser/publication-parser";
import { encodeURIComponent_RFC3986, isHTTP } from "@utils/http/UrlUtils";
import * as debug_ from "debug";
import * as moment from "moment";
import { JSON as TAJSON } from "ta-json";

const debug = debug_("r2:streamer#http/opds2-create-cli");

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
    const feed = new OPDSFeed();

    // TODO: what is the JSON-LD context URL?
    // https://drafts.opds.io/opds-2.0
    // https://github.com/opds-community/test-catalog/tree/master/2.0
    feed.Context = ["http://opds-spec.org/opds.jsonld"];

    feed.Metadata = new OPDSMetadata();
    feed.Metadata.RDFType = "http://schema.org/DataFeed";
    feed.Metadata.Title = "Readium 2 OPDS 2.0 Feed";
    feed.Metadata.Modified = moment(Date.now()).toDate();

    feed.Publications = [];

    let nPubs = 0;
    for (const pathBase64 of args) {
        const pathBase64Str = new Buffer(pathBase64, "base64").toString("utf8");

        if (isHTTP(pathBase64Str)) {
            continue;
        }

        // const fileName = path.basename(pathBase64Str);
        // const ext = path.extname(fileName).toLowerCase();

        debug(`OPDS parsing: ${pathBase64Str}`);
        let publication: Publication;
        try {
            publication = await PublicationParsePromise(pathBase64Str);
        } catch (err) {
            debug(err);
            continue;
        }

        nPubs++;
        const filePathBase64Encoded = encodeURIComponent_RFC3986(pathBase64);

        const publi = new OPDSPublication();

        publi.Links = [];
        const linkSelf = new OPDSLink();
        linkSelf.Href = filePathBase64Encoded + "/manifest.json";
        linkSelf.TypeLink = "application/webpub+json";
        linkSelf.AddRel("self");
        publi.Links.push(linkSelf);

        feed.Publications.push(publi);

        publi.Images = [];
        const coverLink = publication.GetCover();
        if (coverLink) {
            const linkCover = new OPDSLink();
            linkCover.Href = filePathBase64Encoded + "/" + coverLink.Href;
            linkCover.TypeLink = coverLink.TypeLink;
            // linkCover.Rel = [];
            // linkCover.Rel.push("cover");

            if (coverLink.Width && coverLink.Height) {
                linkCover.Width = coverLink.Width;
                linkCover.Height = coverLink.Height;

            }
            publi.Images.push(linkCover);
        }

        if (publication.Metadata) {
            try {
                const publicationMetadataJson = TAJSON.serialize(publication.Metadata);
                publi.Metadata = TAJSON.deserialize<OPDSPublicationMetadata>(
                    publicationMetadataJson, OPDSPublicationMetadata);
            } catch (err) {
                debug(err);
                continue;
            }
        }
    }

    feed.Metadata.NumberOfItems = nPubs;

    const jsonObj = TAJSON.serialize(feed);
    const jsonStr = global.JSON.stringify(jsonObj, null, "");
    fs.writeFileSync(opdsJsonFilePath, jsonStr, { encoding: "utf8" });

    debug("DONE! :)");
    debug(opdsJsonFilePath);
})();
