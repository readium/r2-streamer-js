import * as mime from "mime-types";
import * as path from "path";
import * as slugify from "slugify";
import * as xmldom from "xmldom";

import { XML } from "../_utils/xml-js-mapper";
import { Metadata } from "../models/metadata";
import { Contributor } from "../models/metadata-contributor";
import { Publication } from "../models/publication";
import { Link } from "../models/publication-link";
import { streamToBufferPromise, zipLoadPromise } from "../utils";
import { ComicInfo } from "./comicrack/comicrack";
import { IStreamAndLength, IZip } from "./zip";

export async function CbzParsePromise(filePath: string): Promise<Publication> {

    let zip: any;
    try {
        zip = await zipLoadPromise(filePath);
    } catch (err) {
        return Promise.reject(err);
    }

    if (!zip.hasEntries()) {
        return Promise.reject("CBZ zip empty");
    }

    const publication = new Publication();
    publication.Metadata = new Metadata();
    publication.Metadata.Identifier = filePathToTitle(filePath);

    publication.AddToInternal("type", "cbz");
    publication.AddToInternal("zip", zip);

    let comicInfoEntryName: string | undefined;
    zip.forEachEntry((entryName: string) => {
        // console.log("++ZIP: entry");

        // console.log(entryName);

        const link = new Link();
        link.Href = entryName;

        const mediaType = mime.lookup(entryName);
        if (mediaType) {
            // console.log(mediaType);

            link.TypeLink = mediaType as string;
        } else {
            console.log("!!!!!! NO MEDIA TYPE?!");
        }

        if (link.TypeLink && link.TypeLink.startsWith("image/")) {
            if (!publication.Spine) {
                publication.Spine = Array<Link>();
            }
            publication.Spine.push(link);

        } else if (entryName.endsWith("ComicInfo.xml")) {
            comicInfoEntryName = entryName;
        }
    });

    if (!publication.Metadata.Title) {
        publication.Metadata.Title = path.basename(filePath);
    }

    if (comicInfoEntryName) {
        try {
            await comicRackMetadata(zip, comicInfoEntryName, publication);
        } catch (err) {
            console.log(err);
        }
    }

    return publication;
}

const filePathToTitle = (filePath: string): string => {
    const fileName = path.basename(filePath);
    return slugify(fileName, "_").replace(/[\.]/g, "_");
};

const comicRackMetadata = async (zip: IZip, entryName: string, publication: Publication) => {
    let comicZipStream_: IStreamAndLength | undefined;
    try {
        comicZipStream_ = await zip.entryStreamPromise(entryName);
    } catch (err) {
        console.log(err);
        return;
    }
    const comicZipStream = comicZipStream_.stream;
    let comicZipData: Buffer | undefined;
    try {
        comicZipData = await streamToBufferPromise(comicZipStream);
    } catch (err) {
        console.log(err);
        return;
    }

    const comicXmlStr = comicZipData.toString("utf8");
    const comicXmlDoc = new xmldom.DOMParser().parseFromString(comicXmlStr);

    const comicMeta = XML.deserialize<ComicInfo>(comicXmlDoc, ComicInfo);
    comicMeta.ZipPath = entryName;

    if (!publication.Metadata) {
        publication.Metadata = new Metadata();
    }

    if (comicMeta.Writer) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Author) {
            publication.Metadata.Author = [];
        }
        publication.Metadata.Author.push(cont);
    }

    if (comicMeta.Penciller) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Penciler) {
            publication.Metadata.Penciler = [];
        }
        publication.Metadata.Penciler.push(cont);
    }

    if (comicMeta.Colorist) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Colorist) {
            publication.Metadata.Colorist = [];
        }
        publication.Metadata.Colorist.push(cont);
    }

    if (comicMeta.Inker) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Inker) {
            publication.Metadata.Inker = [];
        }
        publication.Metadata.Inker.push(cont);
    }

    if (comicMeta.Title) {
        publication.Metadata.Title = comicMeta.Title;
    }

    if (!publication.Metadata.Title) {
        if (comicMeta.Series) {
            let title = comicMeta.Series;
            if (comicMeta.Number) {
                title = title + " - " + comicMeta.Number;
            }
            publication.Metadata.Title = title;
        }
    }

    if (comicMeta.Pages) {
        comicMeta.Pages.forEach((p) => {
            const l = new Link();
            if (p.Type === "FrontCover") {
                l.AddRel("cover");
            }
            l.Href = publication.Spine[p.Image].Href;
            if (p.ImageHeight) {
                l.Height = p.ImageHeight;
            }
            if (p.ImageWidth) {
                l.Width = p.ImageWidth;
            }
            if (p.Bookmark) {
                l.Title = p.Bookmark;
            }
            if (!publication.TOC) {
                publication.TOC = [];
            }
            publication.TOC.push(l);
        });
    }
};
