import * as path from "path";

import { Metadata } from "@models/metadata";
import { Contributor } from "@models/metadata-contributor";
import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { streamToBufferPromise } from "@utils/stream/BufferUtils";
import { XML } from "@utils/xml-js-mapper";
import { IStreamAndLength, IZip } from "@utils/zip/zip";
import { zipLoadPromise } from "@utils/zip/zipFactory";
import * as mime from "mime-types";
import * as slugify from "slugify";
import * as xmldom from "xmldom";

import { ComicInfo } from "./comicrack/comicrack";
import { addCoverDimensions } from "./epub";

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
    publication.Context = ["http://readium.org/webpub/default.jsonld"];
    publication.Metadata = new Metadata();
    publication.Metadata.RDFType = "http://schema.org/ComicIssue";
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
                publication.Spine = [];
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
            const _b = await comicRackMetadata(zip, comicInfoEntryName, publication);
            console.log(_b);
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
    let comicZipStream_: IStreamAndLength;
    try {
        comicZipStream_ = await zip.entryStreamPromise(entryName);
    } catch (err) {
        console.log(err);
        return;
    }
    const comicZipStream = comicZipStream_.stream;
    let comicZipData: Buffer;
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
        // no forEach(), because of await/async within the iteration body
        // comicMeta.Pages.forEach(async (p) => {
        for (const p of comicMeta.Pages) {
            const l = new Link();
            if (p.Type === "FrontCover") {
                l.AddRel("cover");
                await addCoverDimensions(publication, l);
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
        }
    }
};
