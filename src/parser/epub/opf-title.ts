import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class Title {

    // XPATH ROOT: /opf:package/opf:metadata/dc:title

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID: string;

    @XmlXPathSelector("@lang | @xml:lang")
    public Lang: string;

    @XmlXPathSelector("@dir")
    public Dir: string;
}
