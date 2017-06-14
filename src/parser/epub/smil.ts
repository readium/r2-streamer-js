import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { Body } from "./smil-body";
import { Par } from "./smil-par";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class SMIL {

    // XPATH ROOT: /smil:smil

    @XmlXPathSelector("smil:body")
    public Body: Body;

    // Bug with Javascript / Typescript @ANNOTATION() !
    // Requires the class hierarchy to explicitely include all object types
    // (see SeqOrPar)
    @XmlXPathSelector("dummy")
    public Par: Par;

    public ZipPath: string;
}
