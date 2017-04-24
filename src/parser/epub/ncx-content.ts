import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class Content {
    @XmlXPathSelector("@src")
    public Src: string;
}
