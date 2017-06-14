import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Subject {

    // XPATH ROOT: /opf:package/opf:metadata/dc:subject

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@term")
    public Term: string;

    @XmlXPathSelector("@authority")
    public Authority: string;

    @XmlXPathSelector("@lang")
    public Lang: string;
}
