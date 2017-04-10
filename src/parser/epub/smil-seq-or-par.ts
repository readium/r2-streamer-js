import {
    XmlDiscriminatorProperty,
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
@XmlDiscriminatorProperty("localName")
export class SeqOrPar {
    // protected localName: string;
}
