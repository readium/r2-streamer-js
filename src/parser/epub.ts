import * as mime from "mime-types";
import * as Moment from "moment";
import * as path from "path";
import * as slugify from "slugify";
import * as util from "util";
import * as xmldom from "xmldom";
import * as xpath from "xpath";

import { XML } from "../xml-js-mapper";

import { JSON } from "ta-json";

import { createZipPromise } from "./zip";

import { Container } from "./epub/container";
import { Rootfile } from "./epub/container-rootfile";
import { Encryption } from "./epub/encryption";
import { LCP } from "./epub/lcp";
import { NCX } from "./epub/ncx";
import { OPF } from "./epub/opf";
import { Metafield } from "./epub/opf-metafield";
import { Title } from "./epub/opf-title";
import { SMIL } from "./epub/smil";

import { IStringMap } from "../models/metadata-multilang";

import { Link } from "../models/publication-link";

import { Metadata } from "../models/metadata";

import { Publication } from "../models/publication";

export class EpubParser {

    private epub3 = "3.0";
    private epub301 = "3.0.1";
    private epub31 = "3.1";
    private epub2 = "2.0";
    private epub201 = "2.0.1";
    private autoMeta = "auto";
    private noneMeta = "none";
    private reflowableMeta = "reflowable";
    private mediaOverlayURL = "media-overlay?resource=";

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
            publication.Metadata.Modified = Moment(Date.now()).toDate();

            publication.AddToInternal("filename", path.basename(filePath));

            publication.AddToInternal("type", "epub");
            // publication.AddToInternal("epub", zip);

            let lcpl: LCP | undefined;
            if (Object.keys(zip.entries()).indexOf("META-INF/license.lcpl") >= 0) {

                const lcplZipData = zip.entryDataSync("META-INF/license.lcpl");
                if (lcplZipData) {
                    const lcplStr = lcplZipData.toString("utf8");
                    const lcplJson = global.JSON.parse(lcplStr);
                    lcpl = JSON.deserialize<LCP>(lcplJson, LCP);

                    // breakLength: 100  maxArrayLength: undefined
                    // console.log(util.inspect(lcpl,
                    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                }
            }

            let encryption: Encryption | undefined;
            if (Object.keys(zip.entries()).indexOf("META-INF/encryption.xml") >= 0) {

                const encryptionXmlZipData = zip.entryDataSync("META-INF/encryption.xml");
                if (encryptionXmlZipData) {
                    const encryptionXmlStr = encryptionXmlZipData.toString("utf8");
                    const encryptionXmlDoc = new xmldom.DOMParser().parseFromString(encryptionXmlStr);

                    encryption = XML.deserialize<Encryption>(encryptionXmlDoc, Encryption);

                    // breakLength: 100  maxArrayLength: undefined
                    // console.log(util.inspect(encryption,
                    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                }
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
                [container.Rootfile[0]] // container.Rootfile for multiple renditions
                    .map((rootfile) => {
                        publication.AddToInternal("rootfile", rootfile.Path);

                        const opfZipData = zip.entryDataSync(rootfile.Path);
                        const opfStr = opfZipData.toString("utf8");
                        const opfDoc = new xmldom.DOMParser().parseFromString(opfStr);
                        const opf = XML.deserialize<OPF>(opfDoc, OPF);

                        // breakLength: 100  maxArrayLength: undefined
                        // console.log(util.inspect(opf,
                        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

                        const epubVersion = this.getEpubVersion(rootfile, opf);

                        let ncx: NCX | undefined;
                        opf.Manifest.map((manifestItem) => {
                            if (manifestItem.MediaType === "application/smil+xml") {
                                const smilFilePath = path.join(path.dirname(rootfile.Path), manifestItem.Href);
                                // console.log("########## SMIL: "
                                //     + rootfile.Path
                                //     + " == "
                                //     + manifestItem.Href
                                //     + " -- "
                                //     + smilFilePath);
                                const smilZipData = zip.entryDataSync(smilFilePath);
                                const smilStr = smilZipData.toString("utf8");
                                const smilDoc = new xmldom.DOMParser().parseFromString(smilStr);
                                const smil = XML.deserialize<SMIL>(smilDoc, SMIL);

                                // breakLength: 100  maxArrayLength: undefined
                                // console.log(util.inspect(smil,
                                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                            }

                            if (opf.Spine.Toc && manifestItem.ID === opf.Spine.Toc) {
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
                                ncx = XML.deserialize<NCX>(ncxDoc, NCX);

                                // breakLength: 100  maxArrayLength: undefined
                                // console.log(util.inspect(ncx,
                                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                            }
                        });

                        this.addTitle(publication, rootfile, opf);

                        if (opf.Metadata && opf.Metadata.Language) {
                            publication.Metadata.Language = opf.Metadata.Language;
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

    // private filePathToTitle(filePath: string): string {
    //     const fileName = path.basename(filePath);
    //     return slugify(fileName, "_").replace(/[\.]/g, "_");
    // }

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

    private addTitle(publication: Publication, rootfile: Rootfile, opf: OPF) {

        if (this.isEpub3OrMore(rootfile, opf)) {
            let mainTitle: Title | undefined;

            if (opf.Metadata &&
                opf.Metadata.Title &&
                opf.Metadata.Title.length) {

                if (opf.Metadata.Meta) {
                    opf.Metadata.Title.map((title) => {
                        const refineID = "#" + title.ID;

                        opf.Metadata.Meta.map((meta) => {
                            if (meta.Data === "main" && meta.Refine === refineID) {
                                mainTitle = title;
                            }
                        });
                    });
                }

                if (!mainTitle) {
                    mainTitle = opf.Metadata.Title[0];
                }
            }

            if (mainTitle) {
                const metaAlt = this.findAllMetaByRefineAndProperty(rootfile, opf, mainTitle.ID, "alternate-script");
                if (metaAlt && metaAlt.length) {
                    publication.Metadata.Title = {} as IStringMap;

                    if (mainTitle.Lang) {
                        publication.Metadata.Title[mainTitle.Lang.toLowerCase()] = mainTitle.Data;
                    }

                    metaAlt.map((m) => {
                        if (m.Lang) {
                            (publication.Metadata.Title as IStringMap)[m.Lang.toLowerCase()] = m.Data;
                        }
                    });
                } else {
                    publication.Metadata.Title = mainTitle.Data;
                }
            }

        } else {
            if (opf.Metadata &&
                opf.Metadata.Title &&
                opf.Metadata.Title.length) {

                publication.Metadata.Title = opf.Metadata.Title[0].Data;
            }
        }
    }

    private findAllMetaByRefineAndProperty(rootfile: Rootfile, opf: OPF, ID: string, property: string): Metafield[] {
        const metas: Metafield[] = [];

        const refineID = "#" + ID;

        opf.Metadata.Meta.map((metaTag) => {
            if (metaTag.Refine === refineID && metaTag.Property === property) {
                metas.push(metaTag);
            }
        });

        return metas;
    }

    private getEpubVersion(rootfile: Rootfile, opf: OPF): string | undefined {

        if (rootfile.Version) {
            return rootfile.Version;
        } else if (opf.Version) {
            return opf.Version;
        }

        return undefined;
    }

    private isEpub3OrMore(rootfile: Rootfile, opf: OPF): boolean {

        const version = this.getEpubVersion(rootfile, opf);
        return (version === this.epub3 || version === this.epub301 || version === this.epub31);
    }
}
