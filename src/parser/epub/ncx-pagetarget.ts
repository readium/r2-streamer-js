import {
    XmlObject,
    XmlXPathSelector,
} from "../../_utils/xml-js-mapper";
import { Content } from "./ncx-content";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class PageTarget {

    // XPATH ROOT: /ncx:ncx/ncx:pageList/ncx:pageTarget

    @XmlXPathSelector("ncx:navLabel/ncx:text/text()")
    public Text: string;

    @XmlXPathSelector("@value")
    public Value: string;

    @XmlXPathSelector("@type")
    public Type: string;

    @XmlXPathSelector("@playOrder")
    public PlayOrder: number;

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("ncx:content")
    public Content: Content;
}
