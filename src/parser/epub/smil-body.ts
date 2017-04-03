import { Par } from "./smil-par";
import { Seq } from "./smil-seq";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Body {
    @XmlXPathSelector("smil:seq")
    @XmlItemType(Seq)
    public Seq: Seq[];

    @XmlXPathSelector("smil:par")
    @XmlItemType(Par)
    public Par: Par[];

    @XmlXPathSelector("@epub:textref")
    public TextRef: string;
}
