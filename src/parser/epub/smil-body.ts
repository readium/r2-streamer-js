import {
    XmlObject,
} from "@utils/xml-js-mapper";
import { Seq } from "./smil-seq";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
})
export class Body extends Seq {

    // XPATH ROOT: /smil:smil/smil:body

    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private isBody: boolean = true;
}
