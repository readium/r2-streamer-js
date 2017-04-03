import { SpineItem } from "./opf-spineitem";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Spine {

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@toc")
    public Toc: string;

    @XmlXPathSelector("@page-progression-direction")
    public PageProgression: string;

    @XmlXPathSelector("opf:itemref")
    @XmlItemType(SpineItem)
    public Items: SpineItem[];
}
