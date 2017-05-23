import {
    XmlObject,
    XmlXPathSelector,
} from "../../_utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Title {

    // XPATH ROOT: /opf:package/opf:metadata/dc:title

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@lang")
    public Lang: string;

    @XmlXPathSelector("@dir")
    public Dir: string;
}
