import * as mime from "mime-types";
import * as Moment from "moment";
import * as path from "path";
import * as slugify from "slugify";
import * as xmldom from "xmldom";
import * as xpath from "xpath";

import { createZipPromise } from "./zip";

import { Link } from "../models/publication-link";

import { Metadata } from "../models/metadata";

import { Publication } from "../models/publication";

export class EpubParser {

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

            publication.AddToInternal("type", "epub");
            // publication.AddToInternal("epub", zip);

            const entries = zip.entries();

            Object.keys(entries).map((entryName) => {
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

                if (!publication.Spine) {
                    publication.Spine = Array<Link>();
                }
                publication.Spine.push(link);

                if (entryName.toLowerCase().endsWith(".html")
                    || entryName.toLowerCase().endsWith(".xhtml")
                    || entryName.toLowerCase().endsWith(".xml")
                    || entryName.toLowerCase().endsWith(".opf")
                    || entryName.toLowerCase().endsWith(".ncx")
                ) {
                    const entryData = zip.entryDataSync(entryName);
                    const entryStr = entryData.toString("utf8");
                    const xml = new xmldom.DOMParser().parseFromString(entryStr);

                    const topNode = xpath.select1("/", xml);
                    // console.log(topNode.toString());

                    if (entryName === "META-INF/container.xml") {
                        const select = xpath.useNamespaces({
                            epub: "urn:oasis:names:tc:opendocument:xmlns:container",
                            rendition: "http://www.idpf.org/2013/rendition",
                        });

                        const xp = "/epub:container/epub:rootfiles/epub:rootfile/@full-path";
                        const fullPathAttrNode = select(xp, xml);
                        if (fullPathAttrNode && fullPathAttrNode.length) {
                            const attr = fullPathAttrNode[0] as Attr;
                            console.log(attr.value);
                        }
                    }
                }
            });

            resolve(publication);
        });
    }

    private filePathToTitle(filePath: string): string {
        const fileName = path.basename(filePath);
        return slugify(fileName, "_").replace(/[\.]/g, "_");
    }

    // private fillPublicationDate(publication: Publication, book: Epub) {

    //     if (!book.Opf || !book.Opf.Metadata || !book.Opf.Metadata.Date) {
    //         return;
    //     }

    //     if (this.isEpub3OrMore(book) && book.Opf.Metadata.Date[0] && book.Opf.Metadata.Date[0].Data) {
    //         publication.Metadata.PublicationDate = Moment(book.Opf.Metadata.Date[0].Data).toDate();
    //     }

    //     book.Opf.Metadata.Date.map((date) => {
    //         if (date.Data && date.Event && date.Event.indexOf("publication") >= 0) {
    //             publication.Metadata.PublicationDate = Moment(date.Data).toDate();
    //         }
    //     });
    // }

    // private getEpubVersion(book: Epub): string | undefined {

    //     if (book.Container.Rootfile.Version) {
    //         return book.Container.Rootfile.Version;
    //     } else if (book.Opf.Version) {
    //         return book.Opf.Version;
    //     }

    //     return undefined;
    // }

    // private isEpub3OrMore(book: Epub): boolean {

    //     let version = this.getEpubVersion(book);
    //     return (version === epub3 || version === epub31);
    // }
}
