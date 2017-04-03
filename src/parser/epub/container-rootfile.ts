import { XmlObject, XmlXPathSelector } from "../../xml-js-mapper";

@XmlObject()
export class Rootfile {

    @XmlXPathSelector("@full-path")
    public Path: string;

    @XmlXPathSelector("@media-type")
    public Type: string;

    @XmlXPathSelector("@version")
    public Version: string;
}
