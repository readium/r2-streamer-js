import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Audio {

    // XPATH ROOT: /smil:smil/smil:body/**/smil:audio

    @XmlXPathSelector("@src")
    public Src: string;

    @XmlXPathSelector("@clipBegin")
    public ClipBegin: string;

    @XmlXPathSelector("@clipEnd")
    public ClipEnd: string;

    @XmlXPathSelector("@epub:type")
    public EpubType: string;
}
