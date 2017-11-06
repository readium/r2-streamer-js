import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { SpineItem } from "./opf-spineitem";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class Spine {

    // XPATH ROOT: /opf:package/opf:spine

    @XmlXPathSelector("@id | @xml:id")
    public ID: string;

    @XmlXPathSelector("@toc")
    public Toc: string;

    @XmlXPathSelector("@page-progression-direction")
    public PageProgression: string;

    @XmlXPathSelector("opf:itemref")
    @XmlItemType(SpineItem)
    public Items: SpineItem[];
}
