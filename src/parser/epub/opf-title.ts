import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Title {

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@lang")
    public Lang: string;

    @XmlXPathSelector("@dir")
    public Dir: string;
}
