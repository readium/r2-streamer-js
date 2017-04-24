import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Author {

    @XmlXPathSelector("text()")
    public Data: string;

    @XmlXPathSelector("@file-as")
    public FileAs: string;

    @XmlXPathSelector("@role")
    public Role: string;

    @XmlXPathSelector("@id")
    public ID: string;
}
