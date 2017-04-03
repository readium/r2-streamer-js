import { Audio } from "./smil-audio";
import { Text } from "./smil-text";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Par {
    @XmlXPathSelector("smil:text")
    public Text: Text;

    @XmlXPathSelector("smil:audio")
    public Audio: Audio;
}
