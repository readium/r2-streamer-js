import * as path from "path";
import * as querystring from "querystring";

import { MediaOverlayNode, timeStrToSeconds } from "@models/media-overlay";
import { Metadata } from "@models/metadata";
import { BelongsTo } from "@models/metadata-belongsto";
import { Collection } from "@models/metadata-collection";
import { Contributor } from "@models/metadata-contributor";
import { Encrypted } from "@models/metadata-encrypted";
import { MediaOverlay } from "@models/metadata-media-overlay";
import { IStringMap } from "@models/metadata-multilang";
import { Properties } from "@models/metadata-properties";
import { Subject } from "@models/metadata-subject";
import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { Transformers } from "@transform/transformer";
import { streamToBufferPromise } from "@utils/stream/BufferUtils";
import { XML } from "@utils/xml-js-mapper";
import { IStreamAndLength, IZip } from "@utils/zip/zip";
import { zipLoadPromise } from "@utils/zip/zipFactory";
import * as debug_ from "debug";
import * as sizeOf from "image-size";
import * as moment from "moment";
import { JSON as TAJSON } from "ta-json";
import * as xmldom from "xmldom";
import * as xpath from "xpath";

import { Container } from "./epub/container";
import { Rootfile } from "./epub/container-rootfile";
import { Encryption } from "./epub/encryption";
import { LCP } from "./epub/lcp";
import { NCX } from "./epub/ncx";
import { NavPoint } from "./epub/ncx-navpoint";
import { OPF } from "./epub/opf";
import { Author } from "./epub/opf-author";
import { Manifest } from "./epub/opf-manifest";
import { Metafield } from "./epub/opf-metafield";
import { Title } from "./epub/opf-title";
import { SMIL } from "./epub/smil";
import { Par } from "./epub/smil-par";
import { Seq } from "./epub/smil-seq";
import { SeqOrPar } from "./epub/smil-seq-or-par";

const debug = debug_("r2:epub");

const epub3 = "3.0";
const epub301 = "3.0.1";
const epub31 = "3.1";
// const epub2 = "2.0";
// const epub201 = "2.0.1";
const autoMeta = "auto";
const noneMeta = "none";
const reflowableMeta = "reflowable";

export const mediaOverlayURLPath = "media-overlay.json";
export const mediaOverlayURLParam = "resource";

export const addCoverDimensions = async (publication: Publication, coverLink: Link) => {

    const zipInternal = publication.findFromInternal("zip");
    if (zipInternal) {
        const zip = zipInternal.Value as IZip;
        if (zip.hasEntry(coverLink.Href)) {
            let zipStream: IStreamAndLength;
            try {
                zipStream = await zip.entryStreamPromise(coverLink.Href);
            } catch (err) {
                debug(coverLink.Href);
                debug(coverLink.TypeLink);
                debug(err);
                return;
            }

            let zipData: Buffer;
            try {
                zipData = await streamToBufferPromise(zipStream.stream);

                const imageInfo = sizeOf(zipData);
                if (imageInfo) {
                    coverLink.Width = imageInfo.width;
                    coverLink.Height = imageInfo.height;

                    if (coverLink.TypeLink &&
                        coverLink.TypeLink.replace("jpeg", "jpg").replace("+xml", "")
                        !== ("image/" + imageInfo.type)) {
                        debug(`Wrong image type? ${coverLink.TypeLink} -- ${imageInfo.type}`);
                    }
                }
            } catch (err) {
                debug(coverLink.Href);
                debug(coverLink.TypeLink);
                debug(err);
            }
        }
    }
};

export async function EpubParsePromise(filePath: string): Promise<Publication> {
    let zip: IZip;
    try {
        zip = await zipLoadPromise(filePath);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }

    if (!zip.hasEntries()) {
        return Promise.reject("EPUB zip empty");
    }

    const publication = new Publication();
    publication.Context = ["http://readium.org/webpub/default.jsonld"];
    publication.Metadata = new Metadata();
    publication.Metadata.RDFType = "http://schema.org/Book";
    publication.Metadata.Modified = moment(Date.now()).toDate();

    publication.AddToInternal("filename", path.basename(filePath));

    publication.AddToInternal("type", "epub");
    publication.AddToInternal("zip", zip);

    let lcpl: LCP | undefined;
    const lcplZipPath = "META-INF/license.lcpl";
    if (zip.hasEntry(lcplZipPath)) {
        let lcplZipStream_: IStreamAndLength;
        try {
            lcplZipStream_ = await zip.entryStreamPromise(lcplZipPath);
        } catch (err) {
            debug(err);
            return Promise.reject(err);
        }
        const lcplZipStream = lcplZipStream_.stream;

        let lcplZipData: Buffer;
        try {
            lcplZipData = await streamToBufferPromise(lcplZipStream);
        } catch (err) {
            debug(err);
            return Promise.reject(err);
        }

        const lcplStr = lcplZipData.toString("utf8");
        const lcplJson = global.JSON.parse(lcplStr);
        debug(lcplJson);
        lcpl = TAJSON.deserialize<LCP>(lcplJson, LCP);
        lcpl.ZipPath = lcplZipPath;
        lcpl.JsonSource = lcplStr;
        lcpl.init();

        // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(lcpl,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

        publication.LCP = lcpl;

        // // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(this.LCP,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

        publication.AddLink("application/vnd.readium.lcp.license-1.0+json", ["license"],
            lcpl.ZipPath, false);
    }

    let encryption: Encryption | undefined;
    const encZipPath = "META-INF/encryption.xml";
    if (zip.hasEntry(encZipPath)) {

        let encryptionXmlZipStream_: IStreamAndLength;
        try {
            encryptionXmlZipStream_ = await zip.entryStreamPromise(encZipPath);
        } catch (err) {
            debug(err);
            return Promise.reject(err);
        }
        const encryptionXmlZipStream = encryptionXmlZipStream_.stream;

        let encryptionXmlZipData: Buffer;
        try {
            encryptionXmlZipData = await streamToBufferPromise(encryptionXmlZipStream);
        } catch (err) {
            debug(err);
            return Promise.reject(err);
        }

        const encryptionXmlStr = encryptionXmlZipData.toString("utf8");
        const encryptionXmlDoc = new xmldom.DOMParser().parseFromString(encryptionXmlStr);

        encryption = XML.deserialize<Encryption>(encryptionXmlDoc, Encryption);
        encryption.ZipPath = encZipPath;

        // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(encryption,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
    }

    const containerZipPath = "META-INF/container.xml";

    let containerXmlZipStream_: IStreamAndLength;
    try {
        containerXmlZipStream_ = await zip.entryStreamPromise(containerZipPath);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }
    const containerXmlZipStream = containerXmlZipStream_.stream;

    let containerXmlZipData: Buffer;
    try {
        containerXmlZipData = await streamToBufferPromise(containerXmlZipStream);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }

    const containerXmlStr = containerXmlZipData.toString("utf8");
    const containerXmlDoc = new xmldom.DOMParser().parseFromString(containerXmlStr);

    // debug(containerXmlDoc);
    // debug(containerXmlStr);
    // const containerXmlRootElement = xpath.select1("/", containerXmlDoc);
    // debug(containerXmlRootElement.toString());

    const container = XML.deserialize<Container>(containerXmlDoc, Container);
    container.ZipPath = containerZipPath;
    // breakLength: 100  maxArrayLength: undefined
    // console.log(util.inspect(container,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    const rootfile = container.Rootfile[0];

    // debug(`${rootfile.Path}:`);

    // let timeBegin = process.hrtime();

    let opfZipStream_: IStreamAndLength;
    try {
        opfZipStream_ = await zip.entryStreamPromise(rootfile.Path);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }
    const opfZipStream = opfZipStream_.stream;

    // const timeElapsed1 = process.hrtime(timeBegin);
    // debug(`1) ${timeElapsed1[0]} seconds + ${timeElapsed1[1]} nanoseconds`);
    // timeBegin = process.hrtime();

    let opfZipData: Buffer;
    try {
        opfZipData = await streamToBufferPromise(opfZipStream);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }

    // debug(`${opfZipData.length} bytes`);

    // const timeElapsed2 = process.hrtime(timeBegin);
    // debug(`2) ${timeElapsed2[0]} seconds + ${timeElapsed2[1]} nanoseconds`);
    // timeBegin = process.hrtime();

    const opfStr = opfZipData.toString("utf8");

    // const timeElapsed3 = process.hrtime(timeBegin);
    // debug(`3) ${timeElapsed3[0]} seconds + ${timeElapsed3[1]} nanoseconds`);
    // timeBegin = process.hrtime();

    // TODO: this takes some time with large OPF XML data
    // (typically: many manifest items),
    // but it remains acceptable.
    // e.g. BasicTechnicalMathWithCalculus.epub with 2.5MB OPF!
    const opfDoc = new xmldom.DOMParser().parseFromString(opfStr);

    // const timeElapsed4 = process.hrtime(timeBegin);
    // debug(`4) ${timeElapsed4[0]} seconds + ${timeElapsed4[1]} nanoseconds`);
    // const timeBegin = process.hrtime();

    // tslint:disable-next-line:no-string-literal
    // process.env["OPF_PARSE"] = "true";
    // TODO: this takes a MASSIVE amount of time with large OPF XML data
    // (typically: many manifest items)
    // e.g. BasicTechnicalMathWithCalculus.epub with 2.5MB OPF!
    // culprit: XPath lib ... so we use our own mini XPath parser/matcher
    // (=> performance gain in orders of magnitude!)
    const opf = XML.deserialize<OPF>(opfDoc, OPF);
    // tslint:disable-next-line:no-string-literal
    // process.env["OPF_PARSE"] = "false";

    // const timeElapsed5 = process.hrtime(timeBegin);
    // debug(`5) ${timeElapsed5[0]} seconds + ${timeElapsed5[1]} nanoseconds`);

    opf.ZipPath = rootfile.Path;

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
            // debug("########## NCX: "
            //     + opf.ZipPath
            //     + " == "
            //     + ncxManItem.Href
            //     + " -- "
            //     + ncxFilePath);

            let ncxZipStream_: IStreamAndLength;
            try {
                ncxZipStream_ = await zip.entryStreamPromise(ncxFilePath);
            } catch (err) {
                debug(err);
                return Promise.reject(err);
            }
            const ncxZipStream = ncxZipStream_.stream;

            let ncxZipData: Buffer;
            try {
                ncxZipData = await streamToBufferPromise(ncxZipStream);
            } catch (err) {
                debug(err);
                return Promise.reject(err);
            }

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

        if (opf.Metadata.Meta) {
            const metasDuration: Metafield[] = [];
            const metasNarrator: Metafield[] = [];
            const metasActiveClass: Metafield[] = [];
            const metasPlaybackActiveClass: Metafield[] = [];

            opf.Metadata.Meta.forEach((metaTag) => {
                if (metaTag.Property === "media:duration") {
                    metasDuration.push(metaTag);
                }
                if (metaTag.Property === "media:narrator") {
                    metasNarrator.push(metaTag);
                }
                if (metaTag.Property === "media:active-class") {
                    metasActiveClass.push(metaTag);
                }
                if (metaTag.Property === "media:playback-active-class") {
                    metasPlaybackActiveClass.push(metaTag);
                }
            });

            if (metasDuration.length) {
                publication.Metadata.Duration = timeStrToSeconds(metasDuration[0].Data);
            }
            if (metasNarrator.length) {
                if (!publication.Metadata.Narrator) {
                    publication.Metadata.Narrator = [];
                }
                metasNarrator.forEach((metaNarrator) => {
                    const cont = new Contributor();
                    cont.Name = metaNarrator.Data;
                    publication.Metadata.Narrator.push(cont);
                });
            }
            if (metasActiveClass.length) {
                if (!publication.Metadata.MediaOverlay) {
                    publication.Metadata.MediaOverlay = new MediaOverlay();
                }
                publication.Metadata.MediaOverlay.ActiveClass = metasActiveClass[0].Data;
            }
            if (metasPlaybackActiveClass.length) {
                if (!publication.Metadata.MediaOverlay) {
                    publication.Metadata.MediaOverlay = new MediaOverlay();
                }
                publication.Metadata.MediaOverlay.PlaybackActiveClass = metasPlaybackActiveClass[0].Data;
            }
        }
    }

    if (opf.Spine && opf.Spine.PageProgression) {
        publication.Metadata.Direction = opf.Spine.PageProgression;
    }
    // else {
    //     publication.Metadata.Direction = "default";
    // }

    if (isEpub3OrMore(rootfile, opf)) {
        findContributorInMeta(publication, rootfile, opf);
    }
    await fillSpineAndResource(publication, rootfile, opf);

    addRendition(publication, rootfile, opf);

    await addCoverRel(publication, rootfile, opf);

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

export async function getAllMediaOverlays(publication: Publication): Promise<MediaOverlayNode[]> {
    const mos: MediaOverlayNode[] = [];

    if (publication.Spine) {
        for (const link of publication.Spine) {
            // publication.Spine.forEach((link) => {
            if (link.MediaOverlays) {
                for (const mo of link.MediaOverlays) {
                    // link.MediaOverlays.forEach((mo) => {
                    try {
                        await fillMediaOverlayParse(publication, mo);
                    } catch (err) {
                        return Promise.reject(err);
                    }
                    mos.push(mo);
                    // });
                }
            }
            // });
        }
    }

    return Promise.resolve(mos);
}

export async function getMediaOverlay(publication: Publication, spineHref: string): Promise<MediaOverlayNode[]> {
    const mos: MediaOverlayNode[] = [];

    if (publication.Spine) {
        for (const link of publication.Spine) {
            // publication.Spine.forEach((link) => {
            if (link.MediaOverlays && link.Href.indexOf(spineHref) >= 0) {
                for (const mo of link.MediaOverlays) {
                    // link.MediaOverlays.forEach((mo) => {
                    try {
                        await fillMediaOverlayParse(publication, mo);
                    } catch (err) {
                        return Promise.reject(err);
                    }
                    mos.push(mo);
                    // });
                }
            }
            // });
        }
    }

    return Promise.resolve(mos);
}

const fillMediaOverlayParse =
    async (publication: Publication, mo: MediaOverlayNode) => {

    if (mo.initialized) {
        return;
    }

    let link: Link | undefined;
    if (publication.Resources) {

        const relativePath = mo.SmilPathInZip;

        if (publication.Resources) {
            link = publication.Resources.find((l) => {
                if (l.Href === relativePath) {
                    return true;
                }
                return false;
            });
        }
        if (!link) {
            if (publication.Spine) {
                link = publication.Spine.find((l) => {
                    if (l.Href === relativePath) {
                        return true;
                    }
                    return false;
                });
            }
        }
        if (!link) {
            const err = "Asset not declared in publication spine/resources! " + relativePath;
            debug(err);
            return Promise.reject(err);
        }
    }

    const zipInternal = publication.findFromInternal("zip");
    if (!zipInternal) {
        return;
    }
    const zip = zipInternal.Value as IZip;

    let smilZipStream_: IStreamAndLength;
    try {
        smilZipStream_ = await zip.entryStreamPromise(mo.SmilPathInZip);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }

    if (link && link.Properties && link.Properties.Encrypted) {
        let decryptFail = false;
        let transformedStream: IStreamAndLength;
        try {
            transformedStream = await Transformers.tryStream(
                publication, link,
                smilZipStream_,
                false, 0, 0);
        } catch (err) {
            debug(err);
            return Promise.reject(err);
        }
        if (transformedStream) {
            smilZipStream_ = transformedStream;
        } else {
            decryptFail = true;
        }

        if (decryptFail) {
            const err = "Encryption scheme not supported.";
            debug(err);
            return Promise.reject(err);
        }
    }

    const smilZipStream = smilZipStream_.stream;

    let smilZipData: Buffer;
    try {
        smilZipData = await streamToBufferPromise(smilZipStream);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }

    const smilStr = smilZipData.toString("utf8");
    const smilXmlDoc = new xmldom.DOMParser().parseFromString(smilStr);
    const smil = XML.deserialize<SMIL>(smilXmlDoc, SMIL);
    smil.ZipPath = mo.SmilPathInZip;

    mo.initialized = true;
    debug("PARSED SMIL: " + mo.SmilPathInZip);

    // breakLength: 100  maxArrayLength: undefined
    // console.log(util.inspect(smil,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    mo.Role = [];
    mo.Role.push("section");

    if (smil.Body) {
        if (smil.Body.EpubType) {
            smil.Body.EpubType.trim().split(" ").forEach((role) => {
                if (!role.length) {
                    return;
                }
                if (mo.Role.indexOf(role) < 0) {
                    mo.Role.push(role);
                }
            });
        }
        if (smil.Body.TextRef) {
            const zipPath = path.join(path.dirname(smil.ZipPath), smil.Body.TextRef)
                .replace(/\\/g, "/");
            mo.Text = zipPath;

        }
        if (smil.Body.Children && smil.Body.Children.length) {
            smil.Body.Children.forEach((seqChild) => {
                if (!mo.Children) {
                    mo.Children = [];
                }
                addSeqToMediaOverlay(smil, publication, mo, mo.Children, seqChild);
            });
        }
    }

    return;
};

const fillMediaOverlay =
    async (publication: Publication, rootfile: Rootfile, opf: OPF, zip: IZip) => {

        if (!publication.Resources) {
            return;
        }

        // no forEach(), because of await/async within the iteration body
        // publication.Resources.forEach(async (item) => {
        for (const item of publication.Resources) {
            if (item.TypeLink !== "application/smil+xml") {
                continue;
            }

            if (!zip.hasEntry(item.Href)) {
                continue;
            }

            const manItemsHtmlWithSmil: Manifest[] = [];
            opf.Manifest.forEach((manItemHtmlWithSmil) => {
                if (manItemHtmlWithSmil.MediaOverlay) { // HTML
                    const manItemSmil = opf.Manifest.find((mi) => {
                        if (mi.ID === manItemHtmlWithSmil.MediaOverlay) {
                            return true;
                        }
                        return false;
                    });
                    if (manItemSmil) {
                        const smilFilePath2 = path.join(path.dirname(opf.ZipPath), manItemSmil.Href)
                            .replace(/\\/g, "/");
                        if (smilFilePath2 === item.Href) {
                            manItemsHtmlWithSmil.push(manItemHtmlWithSmil);
                        }
                    }
                }
            });

            const mo = new MediaOverlayNode();
            mo.SmilPathInZip = item.Href;
            mo.initialized = false;

            manItemsHtmlWithSmil.forEach((manItemHtmlWithSmil) => {

                const htmlPathInZip = path.join(path.dirname(opf.ZipPath), manItemHtmlWithSmil.Href)
                    .replace(/\\/g, "/");

                const link = findLinKByHref(publication, rootfile, opf, htmlPathInZip);
                if (link) {
                    if (!link.MediaOverlays) {
                        link.MediaOverlays = [];
                    }

                    const alreadyExists = link.MediaOverlays.find((moo) => {
                        if (item.Href === moo.SmilPathInZip) {
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

            if (item.Properties && item.Properties.Encrypted) {
                debug("ENCRYPTED SMIL MEDIA OVERLAY: " + item.Href);
                continue;
            }
            // LAZY
            // await fillMediaOverlayParse(publication, mo);
        }

        return;
    };

const addSeqToMediaOverlay = (
    smil: SMIL, publication: Publication,
    rootMO: MediaOverlayNode, mo: MediaOverlayNode[], seqChild: SeqOrPar) => {

    const moc = new MediaOverlayNode();
    moc.initialized = rootMO.initialized;
    mo.push(moc);

    if (seqChild instanceof Seq) {
        moc.Role = [];
        moc.Role.push("section");

        const seq = seqChild as Seq;

        if (seq.EpubType) {
            seq.EpubType.trim().split(" ").forEach((role) => {
                if (!role.length) {
                    return;
                }
                if (moc.Role.indexOf(role) < 0) {
                    moc.Role.push(role);
                }
            });
        }

        if (seq.TextRef) {
            const zipPath = path.join(path.dirname(smil.ZipPath), seq.TextRef)
                .replace(/\\/g, "/");
            moc.Text = zipPath;
        }

        if (seq.Children && seq.Children.length) {
            seq.Children.forEach((child) => {
                if (!moc.Children) {
                    moc.Children = [];
                }
                addSeqToMediaOverlay(smil, publication, rootMO, moc.Children, child);
            });
        }
    } else { // Par
        const par = seqChild as Par;

        if (par.EpubType) {
            par.EpubType.trim().split(" ").forEach((role) => {
                if (!role.length) {
                    return;
                }
                if (!moc.Role) {
                    moc.Role = [];
                }
                if (moc.Role.indexOf(role) < 0) {
                    moc.Role.push(role);
                }
            });
        }

        if (par.Text && par.Text.Src) {
            const zipPath = path.join(path.dirname(smil.ZipPath), par.Text.Src)
                .replace(/\\/g, "/");
            moc.Text = zipPath;
        }
        if (par.Audio && par.Audio.Src) {
            const zipPath = path.join(path.dirname(smil.ZipPath), par.Audio.Src)
                .replace(/\\/g, "/");
            moc.Audio = zipPath;
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

const addRelAndPropertiesToLink =
    async (publication: Publication, link: Link, linkEpub: Manifest, rootfile: Rootfile, opf: OPF) => {

        if (linkEpub.Properties) {
            await addToLinkFromProperties(publication, link, linkEpub.Properties);
        }
        const spineProperties = findPropertiesInSpineForManifest(linkEpub, rootfile, opf);
        if (spineProperties) {
            await addToLinkFromProperties(publication, link, spineProperties);
        }
    };

const addToLinkFromProperties = async (publication: Publication, link: Link, propertiesString: string) => {

    const properties = propertiesString.trim().split(" ");

    const propertiesStruct = new Properties();

    // https://idpf.github.io/epub-vocabs/rendition/

    // no forEach(), because of await/async within the iteration body
    // properties.forEach(async (p) => {
    for (const p of properties) {
        switch (p) {
            case "cover-image": {
                link.AddRel("cover");
                await addCoverDimensions(publication, link);
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
    }
};

const addMediaOverlay = (link: Link, linkEpub: Manifest, rootfile: Rootfile, opf: OPF) => {
    if (linkEpub.MediaOverlay) {
        const meta = findMetaByRefineAndProperty(rootfile, opf, linkEpub.MediaOverlay, "media:duration");
        if (meta) {
            link.Duration = timeStrToSeconds(meta.Data);
        }
    }
};

const findInManifestByID =
    async (publication: Publication, rootfile: Rootfile, opf: OPF, ID: string): Promise<Link> => {

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
                await addRelAndPropertiesToLink(publication, linkItem, item, rootfile, opf);
                addMediaOverlay(linkItem, item, rootfile, opf);
                return linkItem;
            }
        }
        return Promise.reject(`${ID} not found`);
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

const fillSpineAndResource = async (publication: Publication, rootfile: Rootfile, opf: OPF) => {

    if (opf.Spine && opf.Spine.Items && opf.Spine.Items.length) {
        // no forEach(), because of await/async within the iteration body
        // opf.Spine.Items.forEach(async (item) => {
        for (const item of opf.Spine.Items) {

            if (!item.Linear || item.Linear === "yes") {

                let linkItem: Link;
                try {
                    linkItem = await findInManifestByID(publication, rootfile, opf, item.IDref);
                } catch (err) {
                    debug(err);
                    continue;
                }

                if (linkItem && linkItem.Href) {
                    if (!publication.Spine) {
                        publication.Spine = [];
                    }
                    publication.Spine.push(linkItem);
                }
            }
        }
    }

    if (opf.Manifest && opf.Manifest.length) {

        // no forEach(), because of await/async within the iteration body
        // opf.Manifest.forEach(async (item) => {
        for (const item of opf.Manifest) {

            const zipPath = path.join(path.dirname(opf.ZipPath), item.Href)
                .replace(/\\/g, "/");
            const linkSpine = findInSpineByHref(publication, zipPath);
            if (!linkSpine || !linkSpine.Href) {

                const linkItem = new Link();
                linkItem.TypeLink = item.MediaType;
                linkItem.Href = zipPath;
                await addRelAndPropertiesToLink(publication, linkItem, item, rootfile, opf);
                addMediaOverlay(linkItem, item, rootfile, opf);

                if (!publication.Resources) {
                    publication.Resources = [];
                }
                publication.Resources.push(linkItem);
            }
        }
    }
};

const fillEncryptionInfo =
    (publication: Publication, _rootfile: Rootfile, _opf: OPF, encryption: Encryption, lcp: LCP | undefined) => {

        encryption.EncryptedData.forEach((encInfo) => {
            const encrypted = new Encrypted();
            encrypted.Algorithm = encInfo.EncryptionMethod.Algorithm;

            if (lcp &&
                encrypted.Algorithm !== "http://www.idpf.org/2008/embedding" &&
                encrypted.Algorithm !== "http://ns.adobe.com/pdf/enc#RC") {
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

                const filePath = l.Href;
                if (filePath === encInfo.CipherData.CipherReference.URI) {
                    if (!l.Properties) {
                        l.Properties = new Properties();
                    }
                    l.Properties.Encrypted = encrypted;
                }
            });

            publication.Spine.forEach((l, _i, _arr) => {
                const filePath = l.Href;
                if (filePath === encInfo.CipherData.CipherReference.URI) {
                    if (!l.Properties) {
                        l.Properties = new Properties();
                    }
                    l.Properties.Encrypted = encrypted;
                }
            });
        });
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

const fillTOCFromNavDoc = async (publication: Publication, _rootfile: Rootfile, _opf: OPF, zip: IZip):
    Promise<void> => {

    const navLink = publication.GetNavDoc();
    if (!navLink) {
        return;
    }

    const navDocFilePath = navLink.Href;
    if (!zip.hasEntry(navDocFilePath)) {
        return;
    }

    let navDocZipStream_: IStreamAndLength;
    try {
        navDocZipStream_ = await zip.entryStreamPromise(navDocFilePath);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }
    const navDocZipStream = navDocZipStream_.stream;

    let navDocZipData: Buffer;
    try {
        navDocZipData = await streamToBufferPromise(navDocZipStream);
    } catch (err) {
        debug(err);
        return Promise.reject(err);
    }

    const navDocStr = navDocZipData.toString("utf8");
    const navXmlDoc = new xmldom.DOMParser().parseFromString(navDocStr);

    const select = xpath.useNamespaces({
        epub: "http://www.idpf.org/2007/ops",
        xhtml: "http://www.w3.org/1999/xhtml",
    });

    const navs = select("/xhtml:html/xhtml:body//xhtml:nav", navXmlDoc) as Element[];
    if (navs && navs.length) {

        navs.forEach((navElement: Element) => {

            const typeNav = select("@epub:type", navElement);
            if (typeNav && typeNav.length) {

                const olElem = select("xhtml:ol", navElement) as Element[];

                const roles = (typeNav[0] as Attr).value;
                const role = roles.trim().split(" ")[0]; // TODO assumes only single epub:type in space-separated value?
                switch (role) {

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

                    const aHref = select("@href", aElems[0]);
                    if (aHref && aHref.length) {
                        let val = (aHref[0] as Attr).value;
                        if (val[0] === "#") {
                            val = path.basename(navDocPath) + val;
                        }

                        const zipPath = path.join(path.dirname(navDocPath), val)
                            .replace(/\\/g, "/");
                        link.Href = zipPath;
                    }

                    let aText = aElems[0].textContent; // select("text()", aElems[0])[0].data;
                    if (aText && aText.length) {
                        aText = aText.trim();
                        aText = aText.replace(/\s\s+/g, " ");
                        link.Title = aText;
                    }
                } else {
                    const liFirstChild = select("xhtml:*[1]", liElem);
                    if (liFirstChild && liFirstChild.length && liFirstChild[0].textContent) {
                        link.Title = liFirstChild[0].textContent.trim();
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

const addCoverRel = async (publication: Publication, rootfile: Rootfile, opf: OPF) => {

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
        let manifestInfo: Link;
        try {
            manifestInfo = await findInManifestByID(publication, rootfile, opf, coverID);
        } catch (err) {
            debug(err);
            return;
        }
        if (manifestInfo && manifestInfo.Href && publication.Resources && publication.Resources.length) {

            const href = manifestInfo.Href;
            const linky = publication.Resources.find((item, _i, _arr) => {
                if (item.Href === href) {
                    return true;
                }
                return false;
            });
            if (linky) { // publication.Resources[i]
                linky.AddRel("cover");
                await addCoverDimensions(publication, linky);
            }
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
