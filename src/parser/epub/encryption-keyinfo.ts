import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { RetrievalMethod } from "./encryption-retrievalmethod";

@XmlObject({
    ds: "http://www.w3.org/2000/09/xmldsig#",
    enc: "http://www.w3.org/2001/04/xmlenc#",
    encryption: "urn:oasis:names:tc:opendocument:xmlns:container",
    ns: "http://www.idpf.org/2016/encryption#compression",
})
export class KeyInfo {

    // XPATH ROOT: /encryption:encryption/enc:EncryptedData/ds:KeyInfo

    @XmlXPathSelector("ds:RetrievalMethod")
    public RetrievalMethod: RetrievalMethod;
}
