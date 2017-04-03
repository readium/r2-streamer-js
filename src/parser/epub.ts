import * as mime from "mime-types";
import * as Moment from "moment";
import * as path from "path";
import * as slugify from "slugify";
import * as util from "util";
import * as xmldom from "xmldom";
import * as xpath from "xpath";

import { XML } from "../xml-js-mapper";

import { createZipPromise } from "./zip";

import { Container } from "./epub/container";
import { Encryption } from "./epub/encryption";
import { NCX } from "./epub/ncx";
import { OPF } from "./epub/opf";

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

            const encryptionXmlZipData = zip.entryDataSync("META-INF/encryption.xml");
            if (encryptionXmlZipData) {
                const encryptionXmlStr = encryptionXmlZipData.toString("utf8");
                const encryptionXmlDoc = new xmldom.DOMParser().parseFromString(encryptionXmlStr);

                const encryption = XML.deserialize<Encryption>(encryptionXmlDoc, Encryption);

                // breakLength: 100  maxArrayLength: undefined
                // console.log(util.inspect(encryption,
                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
            }

            const containerXmlZipData = zip.entryDataSync("META-INF/container.xml");
            const containerXmlStr = containerXmlZipData.toString("utf8");
            const containerXmlDoc = new xmldom.DOMParser().parseFromString(containerXmlStr);

            // console.log(containerXmlDoc);
            // console.log(containerXmlStr);
            // const containerXmlRootElement = xpath.select1("/", containerXmlDoc);
            // console.log(containerXmlRootElement.toString());

            const container = XML.deserialize<Container>(containerXmlDoc, Container);
            // breakLength: 100  maxArrayLength: undefined
            // console.log(util.inspect(container,
            //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

            if (container && container.Rootfile) {
                container.Rootfile.map((rootfile) => {
                    const opfZipData = zip.entryDataSync(rootfile.Path);
                    const opfStr = opfZipData.toString("utf8");
                    const opfDoc = new xmldom.DOMParser().parseFromString(opfStr);
                    const opf = XML.deserialize<OPF>(opfDoc, OPF);

                    // breakLength: 100  maxArrayLength: undefined
                    // console.log(util.inspect(opf,
                    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

                    if (opf.Spine.Toc) {
                        opf.Manifest.map((manifestItem) => {
                            if (manifestItem.ID === opf.Spine.Toc) {
                                const ncxFilePath = path.join(path.dirname(rootfile.Path), manifestItem.Href);
                                // console.log("########## NCX: "
                                //     + rootfile.Path
                                //     + " == "
                                //     + manifestItem.Href
                                //     + " -- "
                                //     + ncxFilePath);
                                const ncxZipData = zip.entryDataSync(ncxFilePath);
                                const ncxStr = ncxZipData.toString("utf8");
                                const ncxDoc = new xmldom.DOMParser().parseFromString(ncxStr);
                                const ncx = XML.deserialize<NCX>(ncxDoc, NCX);

                                // breakLength: 100  maxArrayLength: undefined
                                // console.log(util.inspect(ncx,
                                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                            }
                        });
                    }
                });
            }

            // const entries = zip.entries();
            // Object.keys(entries).map((entryName) => {
            //     console.log("++ZIP: entry");

            //     const entry = entries[entryName];
            //     console.log(entry.name);

            //     console.log(entryName);

            //     const link = new Link();
            //     link.Href = entryName;

            //     const mediaType = mime.lookup(entryName);
            //     if (mediaType) {
            //         console.log(mediaType);

            //         link.TypeLink = mediaType as string;
            //     } else {
            //         console.log("!!!!!! NO MEDIA TYPE?!");
            //     }

            //     if (!publication.Spine) {
            //         publication.Spine = Array<Link>();
            //     }
            //     publication.Spine.push(link);

            //     if (entryName.toLowerCase().endsWith(".html")
            //         || entryName.toLowerCase().endsWith(".xhtml")
            //         || entryName.toLowerCase().endsWith(".xml")
            //         || entryName.toLowerCase().endsWith(".opf")
            //         || entryName.toLowerCase().endsWith(".ncx")
            //     ) {
            //         const entryData = zip.entryDataSync(entryName);
            //         const entryStr = entryData.toString("utf8");
            //         const xmlDoc = new xmldom.DOMParser().parseFromString(entryStr);

            //         if (entryName === "META-INF/container.xml") {

            //             console.log(xmlDoc);

            //             console.log(entryStr);

            //             const topNode = xpath.select1("/", xmlDoc);
            //             console.log(topNode.toString());

            //             const container = XML.deserialize<Container>(xmlDoc, Container);
            //             console.log(container);
            //             if (container && container.Rootfile) {
            //                 container.Rootfile.map((rootfile) => {
            //                     console.log(rootfile.Path);
            //                     console.log(rootfile.Type);
            //                     console.log(rootfile.Version);
            //                 });
            //             }
            //             // process.exit(1);

            //             // const select = xpath.useNamespaces({
            //             //     epub: "urn:oasis:names:tc:opendocument:xmlns:container",
            //             //     rendition: "http://www.idpf.org/2013/rendition",
            //             // });

            //             // let xp = "/epub:container/epub:rootfiles";
            //             // let xPathSelected = select(xp, xmlDoc);

            //             // if (xPathSelected) {
            //             //     if (xPathSelected instanceof Array) {
            //             //         console.log("XPATH multiple element MATCH: " + xp);

            //             //         xPathSelected.map((item) => {
            //             //             const elem = item as xmldom.Element;
            //             //             console.log(elem.localName);
            //             //         });

            //             //         xp = "epub:rootfile/@full-path";
            //             //         xPathSelected = select(xp, xPathSelected[0]);
            //             //         if (xPathSelected) {
            //             //             if (xPathSelected instanceof Array) {
            //             //                 console.log("XPATH multiple attribute MATCH: " + xp);

            //             //                 xPathSelected.map((item) => {
            //             //                     const attr = item as xmldom.Attr;
            //             //                     console.log(attr.value);
            //             //                 });

            //             //             } else {
            //             //                 console.log("XPATH single attribute MATCH: " + xp);

            //             //                 const attr = xPathSelected as xmldom.Attr;
            //             //                 console.log(attr.value);
            //             //             }
            //             //         } else {
            //             //             console.log("XPATH NO MATCH: " + xp);
            //             //         }
            //             //     } else {
            //             //         console.log("XPATH single element MATCH: " + xp);

            //             //         const elem = xPathSelected as xmldom.Element;
            //             //         console.log(elem.localName);
            //             //     }
            //             // } else {
            //             //     console.log("XPATH NO MATCH: " + xp);
            //             // }

            //             // process.exit(1);
            //         }
            //     }
            // });

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
