import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Identifier {

    // XPATH ROOT: /opf:package/opf:metadata/dc:identifier

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@scheme")
    public Scheme: string;
}
