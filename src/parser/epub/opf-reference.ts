import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Reference {

    @XmlXPathSelector("@href")
    public Href: string;

    @XmlXPathSelector("@title")
    public Title: string;

    @XmlXPathSelector("@type")
    public Type: string;
}
