import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class Content {

    // XPATH ROOT: /ncx:ncx/ncx:pageList/ncx:pageTarget/ncx:content
    // XPATH ROOT: /ncx:ncx/ncx:navMap/ncx:navPoint/ncx:content

    @XmlXPathSelector("@src")
    public Src: string;
}
