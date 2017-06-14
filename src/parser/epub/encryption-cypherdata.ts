import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { CipherReference } from "./encryption-cypherreference";

@XmlObject({
    ds: "http://www.w3.org/2000/09/xmldsig#",
    enc: "http://www.w3.org/2001/04/xmlenc#",
    encryption: "urn:oasis:names:tc:opendocument:xmlns:container",
    ns: "http://www.idpf.org/2016/encryption#compression",
})
export class CipherData {

    // XPATH ROOT: /encryption:encryption/enc:EncryptedData/enc:CipherData

    @XmlXPathSelector("enc:CipherReference")
    public CipherReference: CipherReference;
}
