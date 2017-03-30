// package.json
// with dependencies:
// "@types/node"
// ==>
// const StreamZip = require("node-stream-zip");

// src/declarations.d.ts
// with:
// declare module '*';
// ==>
import * as StreamZip from "node-stream-zip";

import * as path from "path";
import * as slugify from "slugify";

import { Link } from "../models/publication-link";

import { Metadata } from "../models/metadata";

import { Publication } from "../models/publication";

export class CbzParser {

    public Parse(filePath: string): Promise<Publication> {

        const that = this;

        return new Promise<Publication>((resolve, reject) => {

            const zip = new StreamZip({
                file: filePath,
                storeEntries: true,
            });

            zip.on("error", (err: any) => {
                console.log("--ZIP: error");
                console.log(err);

                reject(err);
            });

            zip.on("entry", (entry: any) => {
                console.log("--ZIP: entry");
                console.log(entry.name);
            });

            zip.on("extract", (entry: any, file: any) => {
                console.log("--ZIP: extract");
                console.log(entry.name);
                console.log(file);
            });

            zip.on("ready", () => {
                console.log("--ZIP: ready");
                console.log(zip.entriesCount);

                const entries = zip.entries();
                console.log(entries);

                const publication = new Publication();
                publication.Metadata = new Metadata();
                publication.Metadata.Identifier = path.basename(filePath);
                publication.Metadata.Title = that.filePathToTitle(filePath);

                publication.AddToInternal("type", "cbz");
                // publication.AddToInternal("cbz", zip);

                if (zip.entriesCount) {
                    Object.keys(entries).map((entryName) => {
                        console.log("++ZIP: entry");

                        const entry = entries[entryName];
                        console.log(entry.name);

                        console.log(entryName);

                        const mediaType = that.getMediaTypeByName(entryName);
                        if (mediaType) {
                            const link = new Link();
                            link.Href = entryName;
                            link.TypeLink = mediaType;
                            if (!publication.Spine) {
                                publication.Spine = Array<Link>();
                            }
                            publication.Spine.push(link);
                        }

                        if (entry.size < 2048
                            && (entryName.toLowerCase().endsWith(".html")
                                || entryName.toLowerCase().endsWith(".xhtml")
                                || entryName.toLowerCase().endsWith(".css")
                                || entryName.toLowerCase().endsWith(".xml")
                                || entryName.toLowerCase().endsWith(".opf")
                                || entryName.toLowerCase().endsWith(".ncx")
                            )) {

                            const entryData = zip.entryDataSync(entryName);
                            console.log(entryData.toString("utf8"));
                        }
                    });
                }

                resolve(publication);
            });
        });
    }

    private filePathToTitle(filePath: string): string {
        const fileName = path.basename(filePath);
        return slugify(fileName, "_").replace(/[\.]/g, "_");
    }

    private getMediaTypeByName(filePath: string): string | undefined {
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();

        switch (ext) {
            case ".jpg":
                return "image/jpeg";
            case ".jpeg":
                return "image/jpeg";
            case ".png":
                return "image/png";
            default:
                return undefined;
        }
    }
}
