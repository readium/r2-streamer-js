import { Body } from "./smil-body";

import {
    XmlItemType,
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
}
