import { NavPoint } from "./ncx-navpoint";
import { PageList } from "./ncx-pagelist";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class NCX {

    @XmlXPathSelector("/ncx:ncx/ncx:navMap/ncx:navPoint")
    @XmlItemType(NavPoint)
    public Points: NavPoint[];

    @XmlXPathSelector("/ncx:ncx/ncx:pageList")
    public PageList: PageList;

    public ZipPath: string;
}
