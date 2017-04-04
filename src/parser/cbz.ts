import * as mime from "mime-types";
import * as path from "path";
import * as slugify from "slugify";

import { createZipPromise } from "./zip";

import { Link } from "../models/publication-link";

import { Metadata } from "../models/metadata";

import { Publication } from "../models/publication";

export class CbzParser {

    public Parse(filePath: string): Promise<Publication> {

        const zipPromise = createZipPromise(filePath);

        return zipPromise
            .then((zip: any) => {
                return this.createPublicationPromise(filePath, zip);
            });
    }

    private createPublicationPromise(filePath: string, zip: any): Promise<Publication> {

        return new Promise<Publication>((resolve, reject) => {

            if (!zip.entriesCount) {
                reject();
            }

            const publication = new Publication();
            publication.Metadata = new Metadata();
            publication.Metadata.Identifier = path.basename(filePath);
            publication.Metadata.Title = this.filePathToTitle(filePath);

            publication.AddToInternal("type", "cbz");
            // publication.AddToInternal("epub", zip);

            const entries = zip.entries();

            Object.keys(entries).forEach((entryName) => {
                console.log("++ZIP: entry");

                const entry = entries[entryName];
                console.log(entry.name);

                console.log(entryName);

                const link = new Link();
                link.Href = entryName;

                const mediaType = mime.lookup(entryName);
                if (mediaType) {
                    console.log(mediaType);

                    link.TypeLink = mediaType as string;
                } else {
                    console.log("!!!!!! NO MEDIA TYPE?!");
                }

                if (link.TypeLink && link.TypeLink.startsWith("image/")) {
                    if (!publication.Spine) {
                        publication.Spine = Array<Link>();
                    }
                    publication.Spine.push(link);
                }
            });

            resolve(publication);
        });
    }

    private filePathToTitle(filePath: string): string {
        const fileName = path.basename(filePath);
        return slugify(fileName, "_").replace(/[\.]/g, "_");
    }
}
