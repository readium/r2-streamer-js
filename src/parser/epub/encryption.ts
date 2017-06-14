import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { EncryptedData } from "./encryption-data";

@XmlObject({
    ds: "http://www.w3.org/2000/09/xmldsig#",
    enc: "http://www.w3.org/2001/04/xmlenc#",
    encryption: "urn:oasis:names:tc:opendocument:xmlns:container",
    ns: "http://www.idpf.org/2016/encryption#compression",
})
export class Encryption {

    // XPATH ROOT: /encryption:encryption

    @XmlXPathSelector("enc:EncryptedData")
    @XmlItemType(EncryptedData)
    public EncryptedData: EncryptedData[];

    public ZipPath: string;
}
