import {
    XmlObject,
    XmlXPathSelector,
} from "../../_utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Author {

    // XPATH ROOT: /opf:package/opf:metadata/dc:creator
    // XPATH ROOT: /opf:package/opf:metadata/dc:contributor

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@file-as")
    public FileAs: string;

    @XmlXPathSelector("@role")
    public Role: string;

    @XmlXPathSelector("@id")
    public ID: string;
}
