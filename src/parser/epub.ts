import * as moment from "moment";
import * as path from "path";
import * as querystring from "querystring";
import * as xmldom from "xmldom";
import * as xpath from "xpath";

import { XML } from "../xml-js-mapper";

import { JSON } from "ta-json";

import { createZipPromise } from "./zip";

import { MediaOverlayNode, timeStrToSeconds } from "../models/media-overlay";

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

import { BelongsTo } from "../models/metadata-belongsto";
import { Collection } from "../models/metadata-collection";
import { Contributor } from "../models/metadata-contributor";
import { Encrypted } from "../models/metadata-encrypted";
import { Properties } from "../models/metadata-properties";
import { Subject } from "../models/metadata-subject";
import { NavPoint } from "./epub/ncx-navpoint";
import { Par } from "./epub/smil-par";
import { Seq } from "./epub/smil-seq";
import { SeqOrPar } from "./epub/smil-seq-or-par";

export class EpubParser {

    public static async load(path: string): Promise<Publication> {
        const parser = new EpubParser();
        const publication = await parser.Parse(path);
        return publication;
    }

    private epub3 = "3.0";
    private epub301 = "3.0.1";
    private epub31 = "3.1";
    // private epub2 = "2.0";
    // private epub201 = "2.0.1";
    private autoMeta = "auto";
    private noneMeta = "none";
    private reflowableMeta = "reflowable";

    public static get mediaOverlayURLPath(): string {
        return "media-overlay";
    }

    public static get mediaOverlayURLParam(): string {
        return "resource";
    }

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
            publication.Metadata.Modified = moment(Date.now()).toDate();

            publication.AddToInternal("filename", path.basename(filePath));

            publication.AddToInternal("type", "epub");
            publication.AddToInternal("zip", zip);

            let lcpl: LCP | undefined;
            if (Object.keys(zip.entries()).indexOf("META-INF/license.lcpl") >= 0) {

                const lcplZipData = zip.entryDataSync("META-INF/license.lcpl");
                const lcplStr = lcplZipData.toString("utf8");
                const lcplJson = global.JSON.parse(lcplStr);
                lcpl = JSON.deserialize<LCP>(lcplJson, LCP);

                // breakLength: 100  maxArrayLength: undefined
                // console.log(util.inspect(lcpl,
                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
            }

            let encryption: Encryption | undefined;
            if (Object.keys(zip.entries()).indexOf("META-INF/encryption.xml") >= 0) {

                const encryptionXmlZipData = zip.entryDataSync("META-INF/encryption.xml");
                const encryptionXmlStr = encryptionXmlZipData.toString("utf8");
                const encryptionXmlDoc = new xmldom.DOMParser().parseFromString(encryptionXmlStr);

                encryption = XML.deserialize<Encryption>(encryptionXmlDoc, Encryption);

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

                        // const epubVersion = this.getEpubVersion(rootfile, opf);

                        let ncx: NCX | undefined;
                        opf.Manifest.forEach((manifestItem) => {

                            if (opf.Spine.Toc && manifestItem.ID === opf.Spine.Toc) {
                                const ncxFilePath = path.join(path.dirname(rootfile.Path), manifestItem.Href)
                                    .replace(/\\/g, "/");
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

                        this.fillSpineAndResource(publication, rootfile, opf);

                        this.addRendition(publication, rootfile, opf);

                        this.addCoverRel(publication, rootfile, opf);

                        if (encryption) {
                            this.fillEncryptionInfo(publication, rootfile, opf, encryption, lcpl);
                        }

                        this.fillTOCFromNavDoc(publication, rootfile, opf, zip);
                        if (!publication.TOC || !publication.TOC.length) {
                            if (ncx) {
                                this.fillTOCFromNCX(publication, rootfile, opf, ncx);
                                this.fillPageListFromNCX(publication, rootfile, opf, ncx);
                            }
                            this.fillLandmarksFromGuide(publication, rootfile, opf);
                        }

                        this.fillCalibreSerieInfo(publication, rootfile, opf);
                        this.fillSubject(publication, rootfile, opf);

                        this.fillPublicationDate(publication, rootfile, opf);

                        this.fillMediaOverlay(publication, rootfile, opf, zip);
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
            //             //             const elem = item as Element;
            //             //             console.log(elem.localName);
            //             //         });

            //             //         xp = "epub:rootfile/@full-path";
            //             //         xPathSelected = select(xp, xPathSelected[0]);
            //             //         if (xPathSelected) {
            //             //             if (xPathSelected instanceof Array) {
            //             //                 console.log("XPATH multiple attribute MATCH: " + xp);

            //             //                 xPathSelected.forEach((item) => {
            //             //                     const attr = item as Attr;
            //             //                     console.log(attr.value);
            //             //                 });

            //             //             } else {
            //             //                 console.log("XPATH single attribute MATCH: " + xp);

            //             //                 const attr = xPathSelected as Attr;
            //             //                 console.log(attr.value);
            //             //             }
            //             //         } else {
            //             //             console.log("XPATH NO MATCH: " + xp);
            //             //         }
            //             //     } else {
            //             //         console.log("XPATH single element MATCH: " + xp);

            //             //         const elem = xPathSelected as Element;
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

    private fillMediaOverlay(publication: Publication, rootfile: Rootfile, opf: OPF, zip: any) {

        if (!publication.Resources) {
            return;
        }

        publication.Resources.forEach((item) => {

            if (item.TypeLink === "application/smil+xml") {

                const smilFilePath = path.join(path.dirname(rootfile.Path), item.Href)
                    .replace(/\\/g, "/");
                if (Object.keys(zip.entries()).indexOf(smilFilePath) < 0) {
                    return;
                }

                const mo = new MediaOverlayNode();
                mo.SmilPathInOPF = item.Href;
                mo.SmilPathInZip = smilFilePath;

                const manItemsHtmlWithSmil = Array<Manifest>();
                opf.Manifest.forEach((manItemHtmlWithSmil) => {
                    if (manItemHtmlWithSmil.MediaOverlay) { // HTML
                        const manItemSmil = opf.Manifest.find((mi) => {
                            if (mi.ID === manItemHtmlWithSmil.MediaOverlay) {
                                return true;
                            }
                            return false;
                        });
                        if (manItemSmil) {
                            const smilFilePath2 = path.join(path.dirname(rootfile.Path), manItemSmil.Href)
                                .replace(/\\/g, "/");
                            if (smilFilePath2 === smilFilePath) {
                                manItemsHtmlWithSmil.push(manItemHtmlWithSmil);
                            }
                        }
                    }
                });

                manItemsHtmlWithSmil.forEach((manItemHtmlWithSmil) => {

                    const htmlPathInZip = path.join(path.dirname(rootfile.Path), manItemHtmlWithSmil.Href)
                        .replace(/\\/g, "/");

                    const link = this.findLinKByHref(publication, rootfile, opf, htmlPathInZip);
                    if (link) {
                        if (!link.MediaOverlays) {
                            link.MediaOverlays = [];
                        }

                        const alreadyExists = link.MediaOverlays.find((moo) => {
                            if (mo.SmilPathInZip === moo.SmilPathInZip) {
                                return true;
                            }
                            return false;
                        });
                        if (!alreadyExists) {
                            link.MediaOverlays.push(mo);
                        }

                        if (!link.Properties) {
                            link.Properties = new Properties();
                        }
                        link.Properties.MediaOverlay = EpubParser.mediaOverlayURLPath + "?" +
                            EpubParser.mediaOverlayURLParam + "=" + querystring.escape(link.Href);
                    }
                });

                const smilZipData = zip.entryDataSync(smilFilePath);
                const smilStr = smilZipData.toString("utf8");
                const smilXmlDoc = new xmldom.DOMParser().parseFromString(smilStr);
                const smil = XML.deserialize<SMIL>(smilXmlDoc, SMIL);

                // breakLength: 100  maxArrayLength: undefined
                // console.log(util.inspect(smil,
                //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

                mo.Role = [];
                mo.Role.push("section");

                if (smil.Body) {
                    if (smil.Body.TextRef) {
                        mo.Text = smil.Body.TextRef;
                    }
                    if (smil.Body.Children && smil.Body.Children.length) {
                        smil.Body.Children.forEach((seqChild) => {
                            if (!mo.Children) {
                                mo.Children = [];
                            }
                            this.addSeqToMediaOverlay(publication, rootfile, opf, mo, mo.Children, seqChild);
                        });
                    }
                }
            }
        });
    }

    private addSeqToMediaOverlay(
        publication: Publication, rootfile: Rootfile, opf: OPF,
        rootMO: MediaOverlayNode, mo: MediaOverlayNode[], seqChild: SeqOrPar) {

        const moc = new MediaOverlayNode();
        mo.push(moc);

        if (seqChild instanceof Seq) {
            moc.Role = [];
            moc.Role.push("section");

            const seq = seqChild as Seq;

            if (seq.TextRef) {
                moc.Text = seq.TextRef;
            }

            if (seq.Children && seq.Children.length) {
                seq.Children.forEach((child) => {
                    if (!moc.Children) {
                        moc.Children = [];
                    }
                    this.addSeqToMediaOverlay(publication, rootfile, opf, rootMO, moc.Children, child);
                });
            }
        } else { // Par
            const par = seqChild as Par;

            if (par.Text && par.Text.Src) {
                moc.Text = par.Text.Src;
            }
            if (par.Audio && par.Audio.Src) {
                moc.Audio = par.Audio.Src;
                moc.Audio += "#t=";
                moc.Audio += par.Audio.ClipBegin ? timeStrToSeconds(par.Audio.ClipBegin) : "0";
                if (par.Audio.ClipEnd) {
                    moc.Audio += ",";
                    moc.Audio += timeStrToSeconds(par.Audio.ClipEnd);
                }
            }
        }
    }

    private fillPublicationDate(publication: Publication, rootfile: Rootfile, opf: OPF) {

        if (opf.Metadata && opf.Metadata.Date && opf.Metadata.Date.length) {

            if (this.isEpub3OrMore(rootfile, opf) && opf.Metadata.Date[0] && opf.Metadata.Date[0].Data) {
                publication.Metadata.PublicationDate = moment(opf.Metadata.Date[0].Data).toDate();
                return;
            }

            opf.Metadata.Date.forEach((date) => {
                if (date.Data && date.Event && date.Event.indexOf("publication") >= 0) {
                    publication.Metadata.PublicationDate = moment(date.Data).toDate();
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

        // const epubVersion = this.getEpubVersion(rootfile, opf);

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

    private addIdentifier(publication: Publication, _rootfile: Rootfile, opf: OPF) {
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
                default: {
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

    private addRendition(publication: Publication, _rootfile: Rootfile, opf: OPF) {

        if (opf.Metadata && opf.Metadata.Meta && opf.Metadata.Meta.length) {
            const rendition = new Properties();

            opf.Metadata.Meta.forEach((meta) => {
                switch (meta.Property) {
                    case "rendition:layout": {
                        if (meta.Data === "pre-paginated") {
                            rendition.Layout = "fixed";
                        } else if (meta.Data === "reflowable") {
                            rendition.Layout = "reflowable";
                        }
                        break;
                    }
                    case "rendition:orientation": {
                        rendition.Orientation = meta.Data;
                        break;
                    }
                    case "rendition:spread": {
                        rendition.Spread = meta.Data;
                        break;
                    }
                    case "rendition:flow": {
                        rendition.Overflow = meta.Data;
                        break;
                    }
                    default: {
                        break;
                    }
                }
            });

            if (rendition.Layout || rendition.Orientation || rendition.Overflow || rendition.Page || rendition.Spread) {
                publication.Metadata.Rendition = rendition;
            }
        }
    }

    private fillSpineAndResource(publication: Publication, rootfile: Rootfile, opf: OPF) {

        if (opf.Spine && opf.Spine.Items && opf.Spine.Items.length) {
            opf.Spine.Items.forEach((item) => {

                if (!item.Linear || item.Linear === "yes") {

                    const linkItem = this.findInManifestByID(rootfile, opf, item.IDref);

                    if (linkItem && linkItem.Href) {
                        if (!publication.Spine) {
                            publication.Spine = [];
                        }
                        publication.Spine.push(linkItem);
                    }
                }
            });
        }

        if (opf.Manifest && opf.Manifest.length) {
            opf.Manifest.forEach((item) => {
                const linkSpine = this.findInSpineByHref(publication, item.Href);
                if (!linkSpine || !linkSpine.Href) {

                    const linkItem = new Link();
                    linkItem.TypeLink = item.MediaType;
                    linkItem.Href = item.Href;
                    this.addRelAndPropertiesToLink(linkItem, item, rootfile, opf);
                    this.addMediaOverlay(linkItem, item, rootfile, opf);

                    if (!publication.Resources) {
                        publication.Resources = [];
                    }
                    publication.Resources.push(linkItem);
                }
            });
        }
    }

    private fillEncryptionInfo(
        publication: Publication, rootfile: Rootfile, _opf: OPF, encryption: Encryption, lcp: LCP | undefined) {

        encryption.EncryptedData.forEach((encInfo) => {
            const encrypted = new Encrypted();
            encrypted.Algorithm = encInfo.EncryptionMethod.Algorithm;
            if (lcp) {
                encrypted.Profile = lcp.Encryption.Profile;
                encrypted.Scheme = "http://readium.org/2014/01/lcp";
            }
            if (encInfo.EncryptionProperties && encInfo.EncryptionProperties.length) {

                encInfo.EncryptionProperties.forEach((prop) => {

                    if (prop.Compression) {
                        if (prop.Compression.OriginalLength) {
                            encrypted.OriginalLength = parseFloat(prop.Compression.OriginalLength);
                        }
                        if (prop.Compression.Method === "8") {
                            encrypted.Compression = "deflate";
                        } else {
                            encrypted.Compression = "none";
                        }
                    }
                });

            }

            publication.Resources.forEach((l, _i, _arr) => {
                const filePath = path.join(path.dirname(rootfile.Path), l.Href)
                    .replace(/\\/g, "/");
                if (filePath === encInfo.CipherData.CipherReference.URI) {
                    if (!l.Properties) {
                        l.Properties = new Properties();
                    }
                    l.Properties.Encrypted = encrypted;
                }
            });

            publication.Spine.forEach((l, _i, _arr) => {
                const filePath = path.join(path.dirname(rootfile.Path), l.Href)
                    .replace(/\\/g, "/");
                if (filePath === encInfo.CipherData.CipherReference.URI) {
                    if (!l.Properties) {
                        l.Properties = new Properties();
                    }
                    l.Properties.Encrypted = encrypted;
                }
            });
        });

        if (lcp) {

            const decodedKeyCheck = new Buffer(lcp.Encryption.UserKey.KeyCheck, "base64").toString("utf8");
            const decodedContentKey = new Buffer(lcp.Encryption.ContentKey.EncryptedValue, "base64").toString("utf8");
            // publication.LCP = lcp;

            publication.AddToInternal("lcp_id", lcp.ID);
            publication.AddToInternal("lcp_content_key", decodedContentKey);
            publication.AddToInternal("lcp_content_key_algorithm", lcp.Encryption.ContentKey.Algorithm);
            publication.AddToInternal("lcp_user_hint", lcp.Encryption.UserKey.TextHint);
            publication.AddToInternal("lcp_user_key_check", decodedKeyCheck);

            publication.AddLink("application/vnd.readium.lcp.license-1.0+json", ["license"], "license.lcpl", false);
        }
    }

    private fillPageListFromNCX(publication: Publication, _rootfile: Rootfile, _opf: OPF, ncx: NCX) {
        if (ncx.PageList && ncx.PageList.PageTarget && ncx.PageList.PageTarget.length) {
            ncx.PageList.PageTarget.forEach((pageTarget) => {
                const link = new Link();
                link.Href = pageTarget.Content.Src;
                link.Title = pageTarget.Text;
                if (!publication.PageList) {
                    publication.PageList = [];
                }
                publication.PageList.push(link);
            });
        }
    }

    private fillTOCFromNCX(publication: Publication, rootfile: Rootfile, opf: OPF, ncx: NCX) {
        if (ncx.Points && ncx.Points.length) {
            ncx.Points.forEach((point) => {
                if (!publication.TOC) {
                    publication.TOC = [];
                }
                this.fillTOCFromNavPoint(publication, rootfile, opf, ncx, point, publication.TOC);
            });
        }
    }

    private fillLandmarksFromGuide(publication: Publication, _rootfile: Rootfile, opf: OPF) {
        if (opf.Guide && opf.Guide.length) {
            opf.Guide.forEach((ref) => {
                if (ref.Href) {
                    const link = new Link();
                    link.Href = ref.Href;
                    link.Title = ref.Title;
                    if (!publication.Landmarks) {
                        publication.Landmarks = [];
                    }
                    publication.Landmarks.push(link);
                }
            });
        }
    }

    private fillTOCFromNavPoint(
        publication: Publication, rootfile: Rootfile, opf: OPF, ncx: NCX, point: NavPoint, node: Link[]) {

        const link = new Link();
        link.Href = point.Content.Src;
        link.Title = point.Text;

        if (point.Points && point.Points.length) {
            point.Points.forEach((p) => {
                if (!link.Children) {
                    link.Children = [];
                }
                this.fillTOCFromNavPoint(publication, rootfile, opf, ncx, p, link.Children);
            });
        }

        node.push(link);
    }

    private fillSubject(publication: Publication, _rootfile: Rootfile, opf: OPF) {
        if (opf.Metadata && opf.Metadata.Subject && opf.Metadata.Subject.length) {
            opf.Metadata.Subject.forEach((s) => {
                const sub = new Subject();
                sub.Name = s.Data;
                sub.Code = s.Term;
                sub.Scheme = s.Authority;
                if (!publication.Metadata.Subject) {
                    publication.Metadata.Subject = [];
                }
                publication.Metadata.Subject.push(sub);
            });
        }
    }

    private fillCalibreSerieInfo(publication: Publication, _rootfile: Rootfile, opf: OPF) {
        let serie: string | undefined;
        let seriePosition: number | undefined;

        if (opf.Metadata && opf.Metadata.Meta && opf.Metadata.Meta.length) {
            opf.Metadata.Meta.forEach((m) => {
                if (m.Name === "calibre:series") {
                    serie = m.Content;
                }
                if (m.Name === "calibre:series_index") {
                    seriePosition = parseFloat(m.Content);
                }
            });
        }

        if (serie) {
            const collection = new Collection();
            collection.Name = serie;
            if (seriePosition) {
                collection.Position = seriePosition;
            }
            if (!publication.Metadata.BelongsTo) {
                publication.Metadata.BelongsTo = new BelongsTo();
            }
            if (!publication.Metadata.BelongsTo.Series) {
                publication.Metadata.BelongsTo.Series = [];
            }
            publication.Metadata.BelongsTo.Series.push(collection);
        }
    }

    private fillTOCFromNavDoc(publication: Publication, rootfile: Rootfile, _opf: OPF, zip: any) {

        const navLink = publication.GetNavDoc();
        if (!navLink) {
            return;
        }

        const navDocFilePath = path.join(path.dirname(rootfile.Path), navLink.Href)
            .replace(/\\/g, "/");
        if (Object.keys(zip.entries()).indexOf(navDocFilePath) < 0) {
            return;
        }

        const navDocZipData = zip.entryDataSync(navDocFilePath);
        const navDocStr = navDocZipData.toString("utf8");
        const navXmlDoc = new xmldom.DOMParser().parseFromString(navDocStr);

        const select = xpath.useNamespaces({
            epub: "http://www.idpf.org/2007/ops",
            xhtml: "http://www.w3.org/1999/xhtml",
        });

        const navs = select("/xhtml:html/xhtml:body//xhtml:nav", navXmlDoc);
        if (navs && navs.length) {

            navs.forEach((navElement: Element) => {

                const typeNav = select("@epub:type", navElement);
                if (typeNav && typeNav.length) {

                    const olElem = select("xhtml:ol", navElement) as Element[];

                    switch ((typeNav[0] as Attr).value) {

                        case "toc": {
                            publication.TOC = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.TOC, navLink.Href);
                            break;
                        }
                        case "page-list": {
                            publication.PageList = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.PageList, navLink.Href);
                            break;
                        }
                        case "landmarks": {
                            publication.Landmarks = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.Landmarks, navLink.Href);
                            break;
                        }
                        case "lot": {
                            publication.LOT = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.LOT, navLink.Href);
                            break;
                        }
                        case "loa": {
                            publication.LOA = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.LOA, navLink.Href);
                            break;
                        }
                        case "loi": {
                            publication.LOI = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.LOI, navLink.Href);
                            break;
                        }
                        case "lov": {
                            publication.LOV = [];
                            this.fillTOCFromNavDocWithOL(select, olElem, publication.LOV, navLink.Href);
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            });
        }
    }

    private fillTOCFromNavDocWithOL(select: any, olElems: Element[], node: Link[], navDocURL: string) {

        olElems.forEach((olElem: Element) => {

            const liElems = select("xhtml:li", olElem);
            if (liElems && liElems.length) {

                liElems.forEach((liElem: Element) => {

                    const link = new Link();
                    node.push(link);

                    const aElems = select("xhtml:a", liElem);
                    if (aElems && aElems.length > 0) {

                        let aHref = select("@href", aElems[0]);
                        if (aHref && aHref.length) {
                            if (aHref[0][0] === "#") {
                                aHref = navDocURL + aHref[0];
                            }
                            link.Href = aHref[0].value;
                        }

                        let aText = aElems[0].textContent; // select("text()", aElems[0])[0].data;
                        if (aText && aText.length) {
                            aText = aText.trim();
                            aText = aText.replace(/\s\s+/g, " ");
                            link.Title = aText;
                        }
                    }

                    const olElemsNext = select("xhtml:ol", liElem);
                    if (olElemsNext && olElemsNext.length) {
                        if (!link.Children) {
                            link.Children = [];
                        }
                        this.fillTOCFromNavDocWithOL(select, olElemsNext, link.Children, navDocURL);
                    }
                });
            }
        });
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

                publication.Resources.find((item, i, _arr) => {

                    if (item.Href === manifestInfo.Href) {
                        publication.Resources[i].AddRel("cover");
                        return true;
                    }
                    return false;
                });
            }
        }
    }

    private findPropertiesInSpineForManifest(linkEpub: Manifest, _rootfile: Rootfile, opf: OPF): string | undefined {

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

    private findAllMetaByRefineAndProperty(_rootfile: Rootfile, opf: OPF, ID: string, property: string): Metafield[] {
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

    private findLinKByHref(publication: Publication, rootfile: Rootfile, _opf: OPF, href: string): Link | undefined {
        if (publication.Spine && publication.Spine.length) {
            const ll = publication.Spine.find((l) => {
                const pathInZip = path.join(path.dirname(rootfile.Path), l.Href)
                    .replace(/\\/g, "/");

                if (href === pathInZip) {
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
}
