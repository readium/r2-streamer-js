import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class Metafield {

    // XPATH ROOT: /opf:package/opf:metadata/opf:meta

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@name")
    public Name: string;

    @XmlXPathSelector("@content")
    public Content: string;

    @XmlXPathSelector("@refines")
    public Refine: string;

    @XmlXPathSelector("@scheme")
    public Scheme: string;

    @XmlXPathSelector("@property")
    public Property: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID: string;

    @XmlXPathSelector("@lang | @xml:lang")
    public Lang: string;
}
