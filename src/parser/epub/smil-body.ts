import { Seq } from "./smil-seq";

import {
    XmlObject,
} from "../../xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Body extends Seq {
    // tslint:disable-next-line:no-unused-variable
    private isBody: boolean = true;
}
