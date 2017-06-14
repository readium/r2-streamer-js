import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";
import { NavPoint } from "./ncx-navpoint";
import { PageList } from "./ncx-pagelist";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class NCX {

    // XPATH ROOT: /ncx:ncx

    @XmlXPathSelector("ncx:navMap/ncx:navPoint")
    @XmlItemType(NavPoint)
    public Points: NavPoint[];

    @XmlXPathSelector("ncx:pageList")
    public PageList: PageList;

    public ZipPath: string;
}
