import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class SpineItem {

    // XPATH ROOT: /opf:package/opf:spine/opf:itemref

    @XmlXPathSelector("@idref")
    public IDref: string;

    @XmlXPathSelector("@linear")
    public Linear: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID: string;

    @XmlXPathSelector("@properties")
    public Properties: string;
}
