import { Manifest } from "./opf-manifest";
import { Metadata } from "./opf-metadata";
import { Reference } from "./opf-reference";
import { Spine } from "./opf-spine";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class OPF {
    @XmlXPathSelector("/opf:package/opf:metadata")
    public Metadata: Metadata;

    @XmlXPathSelector("/opf:package/opf:manifest/opf:item")
    @XmlItemType(Manifest)
    public Manifest: Manifest[];

    @XmlXPathSelector("/opf:package/opf:spine")
    public Spine: Spine;

    @XmlXPathSelector("/opf:package/opf:guide/opf:reference")
    @XmlItemType(Reference)
    public Guide: Reference[];

    @XmlXPathSelector("/opf:package/@unique-identifier")
    public UniqueIdentifier: string;

    @XmlXPathSelector("/opf:package/@dir")
    public Dir: string;

    @XmlXPathSelector("/opf:package/@version")
    public Version: string;
}
