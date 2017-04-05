import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    xsd: "http://www.w3.org/2001/XMLSchema",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class Page {

    @XmlXPathSelector("@Image")
    public Image: number;

    @XmlXPathSelector("@Bookmark")
    public Bookmark: string;

    @XmlXPathSelector("@Type")
    public Type: string;

    @XmlXPathSelector("@ImageSize")
    public ImageSize: number;

    @XmlXPathSelector("@ImageWidth")
    public ImageWidth: number;

    @XmlXPathSelector("@ImageHeight")
    public ImageHeight: number;
}
