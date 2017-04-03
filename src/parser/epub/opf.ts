import { Metadata } from "./opf-metadata";

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
}
