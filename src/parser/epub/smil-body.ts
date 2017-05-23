import { Seq } from "./smil-seq";

import {
    XmlObject,
} from "../../_utils/xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Body extends Seq {

    // XPATH ROOT: /smil:smil/smil:body

    // tslint:disable-next-line:no-unused-variable
    private isBody: boolean = true;
}
