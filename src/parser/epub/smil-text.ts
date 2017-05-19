import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Text {

    // XPATH ROOT: /smil:smil/smil:body/**/smil:text

    @XmlXPathSelector("@src")
    public Src: string;
}
