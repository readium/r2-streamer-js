import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Text {

    // XPATH ROOT: /smil:smil/smil:body/**/smil:text

    @XmlXPathSelector("@src")
    public Src: string;

    @XmlXPathSelector("@epub:type")
    public EpubType: string;
}
