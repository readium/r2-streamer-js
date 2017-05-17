import * as moment from "moment";
import * as path from "path";
import * as querystring from "querystring";
import * as xmldom from "xmldom";
import * as xpath from "xpath";

import { XML } from "../xml-js-mapper";

import { JSON } from "ta-json";

import { streamToBufferPromise } from "../utils";
import { IZip, zipLoadPromise } from "./zip";

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

const epub3 = "3.0";
const epub301 = "3.0.1";
const epub31 = "3.1";
// const epub2 = "2.0";
// const epub201 = "2.0.1";
const autoMeta = "auto";
const noneMeta = "none";
const reflowableMeta = "reflowable";

export const mediaOverlayURLPath = "media-overlay";
export const mediaOverlayURLParam = "resource";

export async function EpubParsePromise(filePath: string): Promise<Publication> {

    const zip = await zipLoadPromise(filePath);

    if (!zip.hasEntries()) {
        return Promise.reject("EPUB zip empty");
    }

    const publication = new Publication();
    publication.Metadata = new Metadata();
    publication.Metadata.Modified = moment(Date.now()).toDate();

    publication.AddToInternal("filename", path.basename(filePath));

    publication.AddToInternal("type", "epub");
    publication.AddToInternal("zip", zip);

    let lcpl: LCP | undefined;
    const lcplZipPath = "META-INF/license.lcpl";
    if (zip.hasEntry(lcplZipPath)) {
        const lcplZipStream_ = await zip.entryStreamPromise(lcplZipPath);
        const lcplZipStream = lcplZipStream_.stream;
        const lcplZipData = await streamToBufferPromise(lcplZipStream);

        const lcplStr = lcplZipData.toString("utf8");
        const lcplJson = global.JSON.parse(lcplStr);
        lcpl = JSON.deserialize<LCP>(lcplJson, LCP);
        lcpl.ZipPath = lcplZipPath;

        // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(lcpl,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
    }

    let encryption: Encryption | undefined;
    const encZipPath = "META-INF/encryption.xml";
    if (zip.hasEntry(encZipPath)) {
        const encryptionXmlZipStream_ = await zip.entryStreamPromise(encZipPath);
        const encryptionXmlZipStream = encryptionXmlZipStream_.stream;
        const encryptionXmlZipData = await streamToBufferPromise(encryptionXmlZipStream);
        const encryptionXmlStr = encryptionXmlZipData.toString("utf8");
        const encryptionXmlDoc = new xmldom.DOMParser().parseFromString(encryptionXmlStr);

        encryption = XML.deserialize<Encryption>(encryptionXmlDoc, Encryption);
        encryption.ZipPath = encZipPath;

        // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(encryption,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
    }

    const containerZipPath = "META-INF/container.xml";
    const containerXmlZipStream_ = await zip.entryStreamPromise(containerZipPath);
    const containerXmlZipStream = containerXmlZipStream_.stream;
    const containerXmlZipData = await streamToBufferPromise(containerXmlZipStream);
    const containerXmlStr = containerXmlZipData.toString("utf8");
    const containerXmlDoc = new xmldom.DOMParser().parseFromString(containerXmlStr);

    // console.log(containerXmlDoc);
    // console.log(containerXmlStr);
    // const containerXmlRootElement = xpath.select1("/", containerXmlDoc);
    // console.log(containerXmlRootElement.toString());

    const container = XML.deserialize<Container>(containerXmlDoc, Container);
    container.ZipPath = containerZipPath;
    // breakLength: 100  maxArrayLength: undefined
    // console.log(util.inspect(container,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    const rootfile = container.Rootfile[0];

    const opfZipStream_ = await zip.entryStreamPromise(rootfile.Path);
    const opfZipStream = opfZipStream_.stream;
    const opfZipData = await streamToBufferPromise(opfZipStream);
    const opfStr = opfZipData.toString("utf8");
    const opfDoc = new xmldom.DOMParser().parseFromString(opfStr);
    const opf = XML.deserialize<OPF>(opfDoc, OPF);
    opf.ZipPath = rootfile.Path;

    // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
    // publication.AddToInternal("rootfile", opf.ZipPath);

    // breakLength: 100  maxArrayLength: undefined
    // console.log(util.inspect(opf,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    // const epubVersion = getEpubVersion(rootfile, opf);

    let ncx: NCX | undefined;
    if (opf.Spine.Toc) {
        const ncxManItem = opf.Manifest.find((manifestItem) => {
            return manifestItem.ID === opf.Spine.Toc;
        });
        if (ncxManItem) {
            const ncxFilePath = path.join(path.dirname(opf.ZipPath), ncxManItem.Href)
                .replace(/\\/g, "/");
            // console.log("########## NCX: "
            //     + opf.ZipPath
            //     + " == "
            //     + ncxManItem.Href
            //     + " -- "
            //     + ncxFilePath);
            const ncxZipStream_ = await zip.entryStreamPromise(ncxFilePath);
            const ncxZipStream = ncxZipStream_.stream;
            const ncxZipData = await streamToBufferPromise(ncxZipStream);
            const ncxStr = ncxZipData.toString("utf8");
            const ncxDoc = new xmldom.DOMParser().parseFromString(ncxStr);
            ncx = XML.deserialize<NCX>(ncxDoc, NCX);
            ncx.ZipPath = ncxFilePath;

            // breakLength: 100  maxArrayLength: undefined
            // console.log(util.inspect(ncx,
            //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
        }
    }

    addTitle(publication, rootfile, opf);

    addIdentifier(publication, rootfile, opf);

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
                addContributor(publication, rootfile, opf, cont, undefined);
            });
        }
        if (opf.Metadata.Creator && opf.Metadata.Creator.length) {
            opf.Metadata.Creator.forEach((cont) => {
                addContributor(publication, rootfile, opf, cont, "aut");
            });
        }
    }

    if (opf.Spine && opf.Spine.PageProgression) {
        publication.Metadata.Direction = opf.Spine.PageProgression;
    } else {
        publication.Metadata.Direction = "default";
    }

    if (isEpub3OrMore(rootfile, opf)) {
        findContributorInMeta(publication, rootfile, opf);
    }

    fillSpineAndResource(publication, rootfile, opf);

    addRendition(publication, rootfile, opf);

    addCoverRel(publication, rootfile, opf);

    if (encryption) {
        fillEncryptionInfo(publication, rootfile, opf, encryption, lcpl);
    }

    await fillTOCFromNavDoc(publication, rootfile, opf, zip);
    if (!publication.TOC || !publication.TOC.length) {
        if (ncx) {
            fillTOCFromNCX(publication, rootfile, opf, ncx);
            fillPageListFromNCX(publication, rootfile, opf, ncx);
        }
        fillLandmarksFromGuide(publication, rootfile, opf);
    }

    fillCalibreSerieInfo(publication, rootfile, opf);
    fillSubject(publication, rootfile, opf);

    fillPublicationDate(publication, rootfile, opf);

    await fillMediaOverlay(publication, rootfile, opf, zip);

    return publication;
}

// private filePathToTitle(filePath: string): string {
//     const fileName = path.basename(filePath);
//     return slugify(fileName, "_").replace(/[\.]/g, "_");
// }

const fillMediaOverlay = async (publication: Publication, rootfile: Rootfile, opf: OPF, zip: IZip) => {

    if (!publication.Resources) {
        return;
    }

    for (const item of publication.Resources) {
        if (item.TypeLink !== "application/smil+xml") {
            return;
        }

        // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
        // const smilFilePath = path.join(path.dirname(opf.ZipPath), item.Href)
        //     .replace(/\\/g, "/");
        const smilFilePath = item.Href;
        if (!zip.hasEntry(smilFilePath)) {
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
                    // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
                    // const smilFilePath2 = path.join(path.dirname(opf.ZipPath), manItemSmil.Href)
                    //     .replace(/\\/g, "/");
                    const smilFilePath2 = manItemSmil.Href;
                    if (smilFilePath2 === smilFilePath) {
                        manItemsHtmlWithSmil.push(manItemHtmlWithSmil);
                    }
                }
            }
        });

        manItemsHtmlWithSmil.forEach((manItemHtmlWithSmil) => {

            // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
            // const htmlPathInZip = path.join(path.dirname(opf.ZipPath), manItemHtmlWithSmil.Href)
            //     .replace(/\\/g, "/");
            const htmlPathInZip = manItemHtmlWithSmil.Href;

            const link = findLinKByHref(publication, rootfile, opf, htmlPathInZip);
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
                link.Properties.MediaOverlay = mediaOverlayURLPath + "?" +
                    mediaOverlayURLParam + "=" + querystring.escape(link.Href);
            }
        });

        const smilZipStream_ = await zip.entryStreamPromise(smilFilePath);
        const smilZipStream = smilZipStream_.stream;
        const smilZipData = await streamToBufferPromise(smilZipStream);
        const smilStr = smilZipData.toString("utf8");
        const smilXmlDoc = new xmldom.DOMParser().parseFromString(smilStr);
        const smil = XML.deserialize<SMIL>(smilXmlDoc, SMIL);
        smil.ZipPath = smilFilePath;

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
                    addSeqToMediaOverlay(publication, rootfile, opf, mo, mo.Children, seqChild);
                });
            }
        }
    }
    // publication.Resources.forEach(async (item) => {
    // });
};

const addSeqToMediaOverlay = (
    publication: Publication, rootfile: Rootfile, opf: OPF,
    rootMO: MediaOverlayNode, mo: MediaOverlayNode[], seqChild: SeqOrPar) => {

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
                addSeqToMediaOverlay(publication, rootfile, opf, rootMO, moc.Children, child);
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
};

const fillPublicationDate = (publication: Publication, rootfile: Rootfile, opf: OPF) => {

    if (opf.Metadata && opf.Metadata.Date && opf.Metadata.Date.length) {

        if (isEpub3OrMore(rootfile, opf) && opf.Metadata.Date[0] && opf.Metadata.Date[0].Data) {
            publication.Metadata.PublicationDate = moment(opf.Metadata.Date[0].Data).toDate();
            return;
        }

        opf.Metadata.Date.forEach((date) => {
            if (date.Data && date.Event && date.Event.indexOf("publication") >= 0) {
                publication.Metadata.PublicationDate = moment(date.Data).toDate();
            }
        });
    }
};

const findContributorInMeta = (publication: Publication, rootfile: Rootfile, opf: OPF) => {

    if (opf.Metadata && opf.Metadata.Meta) {
        opf.Metadata.Meta.forEach((meta) => {
            if (meta.Property === "dcterms:creator" || meta.Property === "dcterms:contributor") {
                const cont = new Author();
                cont.Data = meta.Data;
                cont.ID = meta.ID;
                addContributor(publication, rootfile, opf, cont, undefined);
            }
        });
    }
};

const addContributor = (
    publication: Publication, rootfile: Rootfile, opf: OPF, cont: Author, forcedRole: string | undefined) => {

    const contributor = new Contributor();
    let role: string | undefined;

    // const epubVersion = getEpubVersion(rootfile, opf);

    if (isEpub3OrMore(rootfile, opf)) {

        const meta = findMetaByRefineAndProperty(rootfile, opf, cont.ID, "role");
        if (meta && meta.Property === "role") {
            role = meta.Data;
        }
        if (!role && forcedRole) {
            role = forcedRole;
        }

        const metaAlt = findAllMetaByRefineAndProperty(rootfile, opf, cont.ID, "alternate-script");
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
};

const addIdentifier = (publication: Publication, _rootfile: Rootfile, opf: OPF) => {
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
};

const addTitle = (publication: Publication, rootfile: Rootfile, opf: OPF) => {

    if (isEpub3OrMore(rootfile, opf)) {
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
            const metaAlt = findAllMetaByRefineAndProperty(rootfile, opf, mainTitle.ID, "alternate-script");
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
};

const addRelAndPropertiesToLink = (link: Link, linkEpub: Manifest, rootfile: Rootfile, opf: OPF) => {

    if (linkEpub.Properties) {
        addToLinkFromProperties(link, linkEpub.Properties);
    }
    const spineProperties = findPropertiesInSpineForManifest(linkEpub, rootfile, opf);
    if (spineProperties) {
        addToLinkFromProperties(link, spineProperties);
    }
};

const addToLinkFromProperties = (link: Link, propertiesString: string) => {

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
                propertiesStruct.Spread = noneMeta;
                break;
            }
            case "rendition:spread-auto": {
                propertiesStruct.Spread = autoMeta;
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
                propertiesStruct.Layout = reflowableMeta;
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
                propertiesStruct.Overflow = autoMeta;
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
};

const addMediaOverlay = (link: Link, linkEpub: Manifest, rootfile: Rootfile, opf: OPF) => {
    if (linkEpub.MediaOverlay) {
        const meta = findMetaByRefineAndProperty(rootfile, opf, linkEpub.MediaOverlay, "media:duration");
        if (meta) {
            link.Duration = timeStrToSeconds(meta.Data);
        }
    }
};

const findInManifestByID = (rootfile: Rootfile, opf: OPF, ID: string): Link | undefined => {

    if (opf.Manifest && opf.Manifest.length) {
        const item = opf.Manifest.find((manItem) => {
            if (manItem.ID === ID) {
                return true;
            }
            return false;
        });
        if (item) {
            const linkItem = new Link();
            linkItem.TypeLink = item.MediaType;
            const zipPath = path.join(path.dirname(opf.ZipPath), item.Href)
                .replace(/\\/g, "/");
            linkItem.Href = zipPath;
            addRelAndPropertiesToLink(linkItem, item, rootfile, opf);
            addMediaOverlay(linkItem, item, rootfile, opf);
            return linkItem;
        }
    }
    return undefined;
};

const addRendition = (publication: Publication, _rootfile: Rootfile, opf: OPF) => {

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
};

const fillSpineAndResource = (publication: Publication, rootfile: Rootfile, opf: OPF) => {

    if (opf.Spine && opf.Spine.Items && opf.Spine.Items.length) {
        opf.Spine.Items.forEach((item) => {

            if (!item.Linear || item.Linear === "yes") {

                const linkItem = findInManifestByID(rootfile, opf, item.IDref);

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
            const zipPath = path.join(path.dirname(opf.ZipPath), item.Href)
                .replace(/\\/g, "/");
            const linkSpine = findInSpineByHref(publication, zipPath);
            if (!linkSpine || !linkSpine.Href) {

                const linkItem = new Link();
                linkItem.TypeLink = item.MediaType;
                linkItem.Href = zipPath;
                addRelAndPropertiesToLink(linkItem, item, rootfile, opf);
                addMediaOverlay(linkItem, item, rootfile, opf);

                if (!publication.Resources) {
                    publication.Resources = [];
                }
                publication.Resources.push(linkItem);
            }
        });
    }
};

const fillEncryptionInfo =
    (publication: Publication, _rootfile: Rootfile, _opf: OPF, encryption: Encryption, lcp: LCP | undefined) => {

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
                // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
                // const filePath = path.join(path.dirname(opf.ZipPath), l.Href)
                //     .replace(/\\/g, "/");
                const filePath = l.Href;
                if (filePath === encInfo.CipherData.CipherReference.URI) {
                    if (!l.Properties) {
                        l.Properties = new Properties();
                    }
                    l.Properties.Encrypted = encrypted;
                }
            });

            publication.Spine.forEach((l, _i, _arr) => {
                // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
                // const filePath = path.join(path.dirname(opf.ZipPath), l.Href)
                //     .replace(/\\/g, "/");
                const filePath = l.Href;
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

            publication.AddLink("application/vnd.readium.lcp.license-1.0+json", ["license"],
                lcp.ZipPath, false);
        }
    };

const fillPageListFromNCX = (publication: Publication, _rootfile: Rootfile, _opf: OPF, ncx: NCX) => {
    if (ncx.PageList && ncx.PageList.PageTarget && ncx.PageList.PageTarget.length) {
        ncx.PageList.PageTarget.forEach((pageTarget) => {
            const link = new Link();
            const zipPath = path.join(path.dirname(ncx.ZipPath), pageTarget.Content.Src)
                .replace(/\\/g, "/");
            link.Href = zipPath;
            link.Title = pageTarget.Text;
            if (!publication.PageList) {
                publication.PageList = [];
            }
            publication.PageList.push(link);
        });
    }
};

const fillTOCFromNCX = (publication: Publication, rootfile: Rootfile, opf: OPF, ncx: NCX) => {
    if (ncx.Points && ncx.Points.length) {
        ncx.Points.forEach((point) => {
            if (!publication.TOC) {
                publication.TOC = [];
            }
            fillTOCFromNavPoint(publication, rootfile, opf, ncx, point, publication.TOC);
        });
    }
};

const fillLandmarksFromGuide = (publication: Publication, _rootfile: Rootfile, opf: OPF) => {
    if (opf.Guide && opf.Guide.length) {
        opf.Guide.forEach((ref) => {
            if (ref.Href) {
                const link = new Link();
                const zipPath = path.join(path.dirname(opf.ZipPath), ref.Href)
                    .replace(/\\/g, "/");
                link.Href = zipPath;
                link.Title = ref.Title;
                if (!publication.Landmarks) {
                    publication.Landmarks = [];
                }
                publication.Landmarks.push(link);
            }
        });
    }
};

const fillTOCFromNavPoint =
    (publication: Publication, rootfile: Rootfile, opf: OPF, ncx: NCX, point: NavPoint, node: Link[]) => {

        const link = new Link();
        const zipPath = path.join(path.dirname(ncx.ZipPath), point.Content.Src)
            .replace(/\\/g, "/");
        link.Href = zipPath;
        link.Title = point.Text;

        if (point.Points && point.Points.length) {
            point.Points.forEach((p) => {
                if (!link.Children) {
                    link.Children = [];
                }
                fillTOCFromNavPoint(publication, rootfile, opf, ncx, p, link.Children);
            });
        }

        node.push(link);
    };

const fillSubject = (publication: Publication, _rootfile: Rootfile, opf: OPF) => {
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
};

const fillCalibreSerieInfo = (publication: Publication, _rootfile: Rootfile, opf: OPF) => {
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
};

const fillTOCFromNavDoc = async (publication: Publication, _rootfile: Rootfile, _opf: OPF, zip: IZip) => {

    const navLink = publication.GetNavDoc();
    if (!navLink) {
        return;
    }

    // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
    // const navDocFilePath = path.join(path.dirname(opf.ZipPath), navLink.Href)
    //     .replace(/\\/g, "/");
    const navDocFilePath = navLink.Href;
    if (!zip.hasEntry(navDocFilePath)) {
        return;
    }
    const navDocZipStream_ = await zip.entryStreamPromise(navDocFilePath);
    const navDocZipStream = navDocZipStream_.stream;
    const navDocZipData = await streamToBufferPromise(navDocZipStream);
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
                        fillTOCFromNavDocWithOL(select, olElem, publication.TOC, navLink.Href);
                        break;
                    }
                    case "page-list": {
                        publication.PageList = [];
                        fillTOCFromNavDocWithOL(select, olElem, publication.PageList, navLink.Href);
                        break;
                    }
                    case "landmarks": {
                        publication.Landmarks = [];
                        fillTOCFromNavDocWithOL(select, olElem, publication.Landmarks, navLink.Href);
                        break;
                    }
                    case "lot": {
                        publication.LOT = [];
                        fillTOCFromNavDocWithOL(select, olElem, publication.LOT, navLink.Href);
                        break;
                    }
                    case "loa": {
                        publication.LOA = [];
                        fillTOCFromNavDocWithOL(select, olElem, publication.LOA, navLink.Href);
                        break;
                    }
                    case "loi": {
                        publication.LOI = [];
                        fillTOCFromNavDocWithOL(select, olElem, publication.LOI, navLink.Href);
                        break;
                    }
                    case "lov": {
                        publication.LOV = [];
                        fillTOCFromNavDocWithOL(select, olElem, publication.LOV, navLink.Href);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        });
    }
};

const fillTOCFromNavDocWithOL = (select: any, olElems: Element[], node: Link[], navDocPath: string) => {

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
                            aHref = navDocPath + aHref[0];
                        }

                        const zipPath = path.join(path.dirname(navDocPath), aHref[0].value)
                            .replace(/\\/g, "/");
                        link.Href = zipPath;
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
                    fillTOCFromNavDocWithOL(select, olElemsNext, link.Children, navDocPath);
                }
            });
        }
    });
};

const addCoverRel = (publication: Publication, rootfile: Rootfile, opf: OPF) => {

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
        const manifestInfo = findInManifestByID(rootfile, opf, coverID);
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
};

const findPropertiesInSpineForManifest = (linkEpub: Manifest, _rootfile: Rootfile, opf: OPF): string | undefined => {

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
};

const findInSpineByHref = (publication: Publication, href: string): Link | undefined => {

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
};

const findMetaByRefineAndProperty = (
    rootfile: Rootfile, opf: OPF, ID: string, property: string): Metafield | undefined => {

    const ret = findAllMetaByRefineAndProperty(rootfile, opf, ID, property);
    if (ret.length) {
        return ret[0];
    }
    return undefined;
};

const findAllMetaByRefineAndProperty = (_rootfile: Rootfile, opf: OPF, ID: string, property: string): Metafield[] => {
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
};

const getEpubVersion = (rootfile: Rootfile, opf: OPF): string | undefined => {

    if (rootfile.Version) {
        return rootfile.Version;
    } else if (opf.Version) {
        return opf.Version;
    }

    return undefined;
};

const isEpub3OrMore = (rootfile: Rootfile, opf: OPF): boolean => {

    const version = getEpubVersion(rootfile, opf);
    return (version === epub3 || version === epub301 || version === epub31);
};

const findLinKByHref = (publication: Publication, _rootfile: Rootfile, _opf: OPF, href: string): Link | undefined => {
    if (publication.Spine && publication.Spine.length) {
        const ll = publication.Spine.find((l) => {
            // FIX_LINK_HREF_PATHS_RELATIVE_TO_ZIP_ROOT
            // const pathInZip = path.join(path.dirname(opf.ZipPath), l.Href)
            //     .replace(/\\/g, "/");
            const pathInZip = l.Href;

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
};
