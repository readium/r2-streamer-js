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

import { timeStrToSeconds } from "../models/media-overlay";

import { Container } from "./epub/container";
import { Rootfile } from "./epub/container-rootfile";
import { Encryption } from "./epub/encryption";
import { LCP } from "./epub/lcp";
import { NCX } from "./epub/ncx";
import { OPF } from "./epub/opf";
import { Author } from "./epub/opf-author";
import { Manifest } from "./epub/opf-manifest";
import { Metafield } from "./epub/opf-metafield";
import { Title } from "./epub/opf-title";
import { SMIL } from "./epub/smil";

import { IStringMap } from "../models/metadata-multilang";

import { Link } from "../models/publication-link";

import { Metadata } from "../models/metadata";

import { Publication } from "../models/publication";

import { Contributor } from "../models/metadata-contributor";
import { Properties } from "../models/metadata-properties";

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
                    .forEach((rootfile) => {
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
                        opf.Manifest.forEach((manifestItem) => {
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

                        this.addIdentifier(publication, rootfile, opf);

                        if (opf.Metadata) {
                            if (opf.Metadata.Language) {
                                publication.Metadata.Language = opf.Metadata.Language;
                            }
                            if (opf.Metadata.Rights && opf.Metadata.Rights.length) {
                                publication.Metadata.Rights = opf.Metadata.Rights.join(" ");
                            }
                            if (opf.Metadata.Description && opf.Metadata.Description.length) {
                                publication.Metadata.Description = opf.Metadata.Description[0];
                            }
                            if (opf.Metadata.Publisher && opf.Metadata.Publisher.length) {
                                publication.Metadata.Publisher = [];

                                opf.Metadata.Publisher.forEach((pub) => {
                                    const contrib = new Contributor();
                                    contrib.Name = pub;
                                    publication.Metadata.Publisher.push(contrib);
                                });
                            }
                            if (opf.Metadata.Source && opf.Metadata.Source.length) {
                                publication.Metadata.Source = opf.Metadata.Source[0];
                            }

                            if (opf.Metadata.Contributor && opf.Metadata.Contributor.length) {
                                opf.Metadata.Contributor.forEach((cont) => {
                                    this.addContributor(publication, rootfile, opf, cont, undefined);
                                });
                            }
                            if (opf.Metadata.Creator && opf.Metadata.Creator.length) {
                                opf.Metadata.Creator.forEach((cont) => {
                                    this.addContributor(publication, rootfile, opf, cont, "aut");
                                });
                            }
                        }

                        if (opf.Spine && opf.Spine.PageProgression) {
                            publication.Metadata.Direction = opf.Spine.PageProgression;
                        } else {
                            publication.Metadata.Direction = "default";
                        }

                        if (this.isEpub3OrMore(rootfile, opf)) {
                            this.findContributorInMeta(publication, rootfile, opf);
                        }

                        // this.fillSpineAndResource(publication, rootfile, opf);

                        // addRendition(&publication, book)

                        this.addCoverRel(publication, rootfile, opf);

                        // fillEncryptionInfo(&publication, book)

                        // fillTOCFromNavDoc(&publication, book)
                        // if len(publication.TOC) == 0 {
                        // 	fillTOCFromNCX(&publication, book)
                        // 	fillPageListFromNCX(&publication, book)
                        // 	fillLandmarksFromGuide(&publication, book)
                        // }

                        // fillCalibreSerieInfo(&publication, book)
                        // fillSubject(&publication, book)

                        this.fillPublicationDate(publication, rootfile, opf);

                        // fillMediaOverlay(&publication, book)
                    });
            }

            // const entries = zip.entries();
            // Object.keys(entries).forEach((entryName) => {
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
            //                 container.Rootfile.forEach((rootfile) => {
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

            //             //         xPathSelected.forEach((item) => {
            //             //             const elem = item as xmldom.Element;
            //             //             console.log(elem.localName);
            //             //         });

            //             //         xp = "epub:rootfile/@full-path";
            //             //         xPathSelected = select(xp, xPathSelected[0]);
            //             //         if (xPathSelected) {
            //             //             if (xPathSelected instanceof Array) {
            //             //                 console.log("XPATH multiple attribute MATCH: " + xp);

            //             //                 xPathSelected.forEach((item) => {
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

    private fillPublicationDate(publication: Publication, rootfile: Rootfile, opf: OPF) {

        if (opf.Metadata && opf.Metadata.Date && opf.Metadata.Date.length) {

            if (this.isEpub3OrMore(rootfile, opf) && opf.Metadata.Date[0] && opf.Metadata.Date[0].Data) {
                publication.Metadata.PublicationDate = Moment(opf.Metadata.Date[0].Data).toDate();
                return;
            }

            opf.Metadata.Date.forEach((date) => {
                if (date.Data && date.Event && date.Event.indexOf("publication") >= 0) {
                    publication.Metadata.PublicationDate = Moment(date.Data).toDate();
                }
            });
        }
    }

    private findContributorInMeta(publication: Publication, rootfile: Rootfile, opf: OPF) {

        if (opf.Metadata && opf.Metadata.Meta) {
            opf.Metadata.Meta.forEach((meta) => {
                if (meta.Property === "dcterms:creator" || meta.Property === "dcterms:contributor") {
                    const cont = new Author();
                    cont.Data = meta.Data;
                    cont.ID = meta.ID;
                    this.addContributor(publication, rootfile, opf, cont, undefined);
                }
            });
        }
    }

    private addContributor(
        publication: Publication, rootfile: Rootfile, opf: OPF, cont: Author, forcedRole: string | undefined) {

        const contributor = new Contributor();
        let role: string | undefined;

        const epubVersion = this.getEpubVersion(rootfile, opf);

        if (this.isEpub3OrMore(rootfile, opf)) {

            const meta = this.findMetaByRefineAndProperty(rootfile, opf, cont.ID, "role");
            if (meta && meta.Property === "role") {
                role = meta.Data;
            }
            if (!role && forcedRole) {
                role = forcedRole;
            }

            const metaAlt = this.findAllMetaByRefineAndProperty(rootfile, opf, cont.ID, "alternate-script");
            if (metaAlt && metaAlt.length) {
                contributor.Name = {} as IStringMap;

                if (publication.Metadata &&
                    publication.Metadata.Language &&
                    publication.Metadata.Language.length) {

                    contributor.Name[publication.Metadata.Language[0].toLowerCase()] = cont.Data;
                }

                metaAlt.forEach((m) => {
                    if (m.Lang) {
                        (contributor.Name as IStringMap)[m.Lang] = m.Data;
                    }
                });
            } else {
                contributor.Name = cont.Data;
            }
        } else {
            contributor.Name = cont.Data;
            role = cont.Role;
            if (!role && forcedRole) {
                role = forcedRole;
            }
        }

        if (role) {
            switch (role) {
                case "aut": {
                    if (!publication.Metadata.Author) {
                        publication.Metadata.Author = [];
                    }
                    publication.Metadata.Author.push(contributor);
                    break;
                }
                case "trl": {
                    if (!publication.Metadata.Translator) {
                        publication.Metadata.Translator = [];
                    }
                    publication.Metadata.Translator.push(contributor);
                    break;
                }
                case "art": {
                    if (!publication.Metadata.Artist) {
                        publication.Metadata.Artist = [];
                    }
                    publication.Metadata.Artist.push(contributor);
                    break;
                }
                case "edt": {
                    if (!publication.Metadata.Editor) {
                        publication.Metadata.Editor = [];
                    }
                    publication.Metadata.Editor.push(contributor);
                    break;
                }
                case "ill": {
                    if (!publication.Metadata.Illustrator) {
                        publication.Metadata.Illustrator = [];
                    }
                    publication.Metadata.Illustrator.push(contributor);
                    break;
                }
                case "ltr": {
                    if (!publication.Metadata.Letterer) {
                        publication.Metadata.Letterer = [];
                    }
                    publication.Metadata.Letterer.push(contributor);
                    break;
                }
                case "pen": {
                    if (!publication.Metadata.Penciler) {
                        publication.Metadata.Penciler = [];
                    }
                    publication.Metadata.Penciler.push(contributor);
                    break;
                }
                case "clr": {
                    if (!publication.Metadata.Colorist) {
                        publication.Metadata.Colorist = [];
                    }
                    publication.Metadata.Colorist.push(contributor);
                    break;
                }
                case "ink": {
                    if (!publication.Metadata.Inker) {
                        publication.Metadata.Inker = [];
                    }
                    publication.Metadata.Inker.push(contributor);
                    break;
                }
                case "nrt": {
                    if (!publication.Metadata.Narrator) {
                        publication.Metadata.Narrator = [];
                    }
                    publication.Metadata.Narrator.push(contributor);
                    break;
                }
                case "pbl": {
                    if (!publication.Metadata.Publisher) {
                        publication.Metadata.Publisher = [];
                    }
                    publication.Metadata.Publisher.push(contributor);
                    break;
                }
                default: {
                    contributor.Role = role;

                    if (!publication.Metadata.Contributor) {
                        publication.Metadata.Contributor = [];
                    }
                    publication.Metadata.Contributor.push(contributor);
                }
            }
        }
    }

    private addIdentifier(publication: Publication, rootfile: Rootfile, opf: OPF) {
        if (opf.Metadata && opf.Metadata.Identifier) {
            if (opf.UniqueIdentifier && opf.Metadata.Identifier.length > 1) {
                opf.Metadata.Identifier.forEach((iden) => {
                    if (iden.ID === opf.UniqueIdentifier) {
                        publication.Metadata.Identifier = iden.Data;
                    }
                });
            } else if (opf.Metadata.Identifier.length > 0) {
                publication.Metadata.Identifier = opf.Metadata.Identifier[0].Data;
            }
        }
    }

    private addTitle(publication: Publication, rootfile: Rootfile, opf: OPF) {

        if (this.isEpub3OrMore(rootfile, opf)) {
            let mainTitle: Title | undefined;

            if (opf.Metadata &&
                opf.Metadata.Title &&
                opf.Metadata.Title.length) {

                if (opf.Metadata.Meta) {
                    const tt = opf.Metadata.Title.find((title) => {
                        const refineID = "#" + title.ID;

                        const m = opf.Metadata.Meta.find((meta) => {
                            if (meta.Data === "main" && meta.Refine === refineID) {
                                return true;
                            }
                            return false;
                        });
                        if (m) {
                            return true;
                        }
                        return false;
                    });
                    if (tt) {
                        mainTitle = tt;
                    }
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

                    metaAlt.forEach((m) => {
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

    private addRelAndPropertiesToLink(link: Link, linkEpub: Manifest, rootfile: Rootfile, opf: OPF) {

        if (linkEpub.Properties) {
            this.addToLinkFromProperties(link, linkEpub.Properties);
        }
        const spineProperties = this.findPropertiesInSpineForManifest(linkEpub, rootfile, opf);
        if (spineProperties) {
            this.addToLinkFromProperties(link, spineProperties);
        }
    }

    private addToLinkFromProperties(link: Link, propertiesString: string) {

        const properties = propertiesString.split(" ");

        const propertiesStruct = new Properties();

        // https://idpf.github.io/epub-vocabs/rendition/
        properties.forEach((p) => {

            switch (p) {
                case "cover-image": {
                    link.AddRel("cover");
                    break;
                }
                case "nav": {
                    link.AddRel("contents");
                    break;
                }
                case "scripted": {
                    if (!propertiesStruct.Contains) {
                        propertiesStruct.Contains = [];
                    }
                    propertiesStruct.Contains.push("js");
                    break;
                }
                case "mathml": {
                    if (!propertiesStruct.Contains) {
                        propertiesStruct.Contains = [];
                    }
                    propertiesStruct.Contains.push("mathml");
                    break;
                }
                case "onix-record": {
                    if (!propertiesStruct.Contains) {
                        propertiesStruct.Contains = [];
                    }
                    propertiesStruct.Contains.push("onix");
                    break;
                }
                case "svg": {
                    if (!propertiesStruct.Contains) {
                        propertiesStruct.Contains = [];
                    }
                    propertiesStruct.Contains.push("svg");
                    break;
                }
                case "xmp-record": {
                    if (!propertiesStruct.Contains) {
                        propertiesStruct.Contains = [];
                    }
                    propertiesStruct.Contains.push("xmp");
                    break;
                }
                case "remote-resources": {
                    if (!propertiesStruct.Contains) {
                        propertiesStruct.Contains = [];
                    }
                    propertiesStruct.Contains.push("remote-resources");
                    break;
                }
                case "page-spread-left": {
                    propertiesStruct.Page = "left";
                    break;
                }
                case "page-spread-right": {
                    propertiesStruct.Page = "right";
                    break;
                }
                case "page-spread-center": {
                    propertiesStruct.Page = "center";
                    break;
                }
                case "rendition:spread-none": {
                    propertiesStruct.Spread = this.noneMeta;
                    break;
                }
                case "rendition:spread-auto": {
                    propertiesStruct.Spread = this.autoMeta;
                    break;
                }
                case "rendition:spread-landscape": {
                    propertiesStruct.Spread = "landscape";
                    break;
                }
                case "rendition:spread-portrait": {
                    propertiesStruct.Spread = "portrait";
                    break;
                }
                case "rendition:spread-both": {
                    propertiesStruct.Spread = "both";
                    break;
                }
                case "rendition:layout-reflowable": {
                    propertiesStruct.Layout = this.reflowableMeta;
                    break;
                }
                case "rendition:layout-pre-paginated": {
                    propertiesStruct.Layout = "fixed";
                    break;
                }
                case "rendition:orientation-auto": {
                    propertiesStruct.Orientation = "auto";
                    break;
                }
                case "rendition:orientation-landscape": {
                    propertiesStruct.Orientation = "landscape";
                    break;
                }
                case "rendition:orientation-portrait": {
                    propertiesStruct.Orientation = "portrait";
                    break;
                }
                case "rendition:flow-auto": {
                    propertiesStruct.Overflow = this.autoMeta;
                    break;
                }
                case "rendition:flow-paginated": {
                    propertiesStruct.Overflow = "paginated";
                    break;
                }
                case "rendition:flow-scrolled-continuous": {
                    propertiesStruct.Overflow = "scrolled-continuous";
                    break;
                }
                case "rendition:flow-scrolled-doc": {
                    propertiesStruct.Overflow = "scrolled";
                    break;
                }
            }

            if (propertiesStruct.Layout ||
                propertiesStruct.Orientation ||
                propertiesStruct.Overflow ||
                propertiesStruct.Page ||
                propertiesStruct.Spread ||
                (propertiesStruct.Contains && propertiesStruct.Contains.length)) {

                link.Properties = propertiesStruct;
            }
        });
    }

    private addMediaOverlay(link: Link, linkEpub: Manifest, rootfile: Rootfile, opf: OPF) {
        if (linkEpub.MediaOverlay) {
            const meta = this.findMetaByRefineAndProperty(rootfile, opf, linkEpub.MediaOverlay, "media:duration");
            if (meta) {
                link.Duration = timeStrToSeconds(meta.Data);
            }
        }
    }

    private findInManifestByID(rootfile: Rootfile, opf: OPF, ID: string): Link | undefined {
        let link: Link | undefined;

        if (opf.Manifest && opf.Manifest.length) {
            opf.Manifest.find((item) => {
                if (item.ID === ID) {
                    const linkItem = new Link();
                    linkItem.TypeLink = item.MediaType;
                    linkItem.Href = item.Href;
                    this.addRelAndPropertiesToLink(linkItem, item, rootfile, opf);
                    this.addMediaOverlay(linkItem, item, rootfile, opf);
                    link = linkItem;
                    return true;
                }
                return false;
            });
        }
        return link;
    }

    private addCoverRel(publication: Publication, rootfile: Rootfile, opf: OPF) {

        let coverID: string | undefined;

        if (opf.Metadata && opf.Metadata.Meta && opf.Metadata.Meta.length) {
            opf.Metadata.Meta.find((meta) => {
                if (meta.Name === "cover") {
                    coverID = meta.Content;
                    return true;
                }
                return false;
            });
        }

        if (coverID) {
            const manifestInfo = this.findInManifestByID(rootfile, opf, coverID);
            if (manifestInfo && manifestInfo.Href && publication.Resources && publication.Resources.length) {

                publication.Resources.find((item, i, arr) => {

                    if (item.Href === manifestInfo.Href) {
                        publication.Resources[i].AddRel("cover");
                        return true;
                    }
                    return false;
                });
            }
        }
    }

    private findPropertiesInSpineForManifest(linkEpub: Manifest, rootfile: Rootfile, opf: OPF): string | undefined {

        if (opf.Spine && opf.Spine.Items && opf.Spine.Items.length) {
            const it = opf.Spine.Items.find((item) => {
                if (item.IDref === linkEpub.ID) {
                    return true;
                }
                return false;
            });
            if (it && it.Properties) {
                return it.Properties;
            }
        }

        return undefined;
    }

    private findInSpineByHref(publication: Publication, href: string): Link | undefined {

        if (publication.Spine && publication.Spine.length) {
            const ll = publication.Spine.find((l) => {
                if (l.Href === href) {
                    return true;
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        return undefined;
    }

    private findMetaByRefineAndProperty(
        rootfile: Rootfile, opf: OPF, ID: string, property: string): Metafield | undefined {

        const ret = this.findAllMetaByRefineAndProperty(rootfile, opf, ID, property);
        if (ret.length) {
            return ret[0];
        }
        return undefined;
    }

    private findAllMetaByRefineAndProperty(rootfile: Rootfile, opf: OPF, ID: string, property: string): Metafield[] {
        const metas: Metafield[] = [];

        const refineID = "#" + ID;

        if (opf.Metadata && opf.Metadata.Meta) {
            opf.Metadata.Meta.forEach((metaTag) => {
                if (metaTag.Refine === refineID && metaTag.Property === property) {
                    metas.push(metaTag);
                }
            });
        }

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
