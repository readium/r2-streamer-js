import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class MetaDate {

    // XPATH ROOT: /opf:package/opf:metadata/dc:date

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@event")
    public Event: string;
}
