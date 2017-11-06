import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { Content } from "./ncx-content";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class NavPoint {

    // XPATH ROOT: /ncx:ncx/ncx:navMap/ncx:navPoint

    @XmlXPathSelector("ncx:navPoint")
    @XmlItemType(NavPoint)
    public Points: NavPoint[];

    @XmlXPathSelector("ncx:navLabel/ncx:text/text()")
    public Text: string;

    @XmlXPathSelector("ncx:content")
    public Content: Content;

    @XmlXPathSelector("@playOrder")
    public PlayerOrder: number;

    @XmlXPathSelector("@id | @xml:id")
    public ID: string;
}
