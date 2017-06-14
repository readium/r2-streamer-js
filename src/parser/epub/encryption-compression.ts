import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    ds: "http://www.w3.org/2000/09/xmldsig#",
    enc: "http://www.w3.org/2001/04/xmlenc#",
    encryption: "urn:oasis:names:tc:opendocument:xmlns:container",
    ns: "http://www.idpf.org/2016/encryption#compression",
})
export class Compression {

    // XPATH ROOT: /encryption:encryption/enc:EncryptedData/enc:EncryptionProperties/
    // enc:EncryptionProperty/ns:Compression

    @XmlXPathSelector("@Method")
    public Method: string;

    @XmlXPathSelector("@OriginalLength")
    public OriginalLength: string;
}
