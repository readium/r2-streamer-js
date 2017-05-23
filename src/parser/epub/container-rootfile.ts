import { XmlObject, XmlXPathSelector } from "../../_utils/xml-js-mapper";

@XmlObject()
export class Rootfile {

    // XPATH ROOT: /epub:container/epub:rootfiles/epub:rootfile

    @XmlXPathSelector("@full-path")
    public Path: string;

    @XmlXPathSelector("@media-type")
    public Type: string;

    @XmlXPathSelector("@version")
    public Version: string;
}
