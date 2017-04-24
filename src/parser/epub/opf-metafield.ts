import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Metafield {

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@name")
    public Name: string;

    @XmlXPathSelector("@content")
    public Content: string;

    @XmlXPathSelector("@refines")
    public Refine: string;

    @XmlXPathSelector("@property")
    public Property: string;

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@lang")
    public Lang: string;
}
