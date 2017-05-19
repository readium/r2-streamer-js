import { Rootfile } from "./container-rootfile";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dummyNS: "dummyURI",
    epub: "wrong2",
    rendition: "wrong1",
})
export class Container {

    // XPATH ROOT: /epub:container

    @XmlXPathSelector("epub:rootfiles/epub:rootfile",
        {
            epub: "urn:oasis:names:tc:opendocument:xmlns:container",
            rendition: "http://www.idpf.org/2013/rendition",
        })
    @XmlItemType(Rootfile)
    public Rootfile: Rootfile[];

    public ZipPath: string;
}
