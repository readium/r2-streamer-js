import { Body } from "./smil-body";
import { Par } from "./smil-par";

import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class SMIL {

    @XmlXPathSelector("/smil:smil/smil:body")
    public Body: Body;

    // Bug with Javascript / Typescript @ANNOTATION() !
    // Requires the class hierarchy to explicitely include all object types
    // (see SeqOrPar)
    @XmlXPathSelector("dummy")
    public Par: Par;
}
