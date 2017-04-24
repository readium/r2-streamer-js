import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class SpineItem {

    @XmlXPathSelector("@idref")
    public IDref: string;

    @XmlXPathSelector("@linear")
    public Linear: string;

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@properties")
    public Properties: string;
}
