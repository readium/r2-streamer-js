import { Par } from "./smil-par";
import { SeqOrPar } from "./smil-seq-or-par";

import {
    XmlDiscriminatorValue,
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
@XmlDiscriminatorValue("seq")
export class Seq extends SeqOrPar {

    @XmlXPathSelector("smil:par|smil:seq")
    @XmlItemType(SeqOrPar)
    public Children: SeqOrPar[];

    // @XmlXPathSelector("smil:seq")
    // @XmlItemType(Seq)
    // public Seq: Seq[];

    // @XmlXPathSelector("smil:par")
    // @XmlItemType(Par)
    // public Par: Par[];

    @XmlXPathSelector("@epub:textref")
    public TextRef: string;

    // constructor() {
    //     super();
    //     this.localName = "seq";
    // }
}
