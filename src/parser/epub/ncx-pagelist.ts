import { PageTarget } from "./ncx-pagetarget";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class PageList {

    @XmlXPathSelector("ncx:pageTarget")
    @XmlItemType(PageTarget)
    public PageTarget: PageTarget[];

    @XmlXPathSelector("@class")
    public Class: string;

    @XmlXPathSelector("@id")
    public ID: string;
}
