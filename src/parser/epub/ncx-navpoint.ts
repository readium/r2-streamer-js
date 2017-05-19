import { Content } from "./ncx-content";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
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

    @XmlXPathSelector("@id")
    public ID: string;
}
