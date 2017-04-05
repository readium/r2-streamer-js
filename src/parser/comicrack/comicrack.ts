import { Page } from "./comicrack-page";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    xsd: "http://www.w3.org/2001/XMLSchema",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class ComicInfo {

    @XmlXPathSelector("ComicInfo/Title")
    public Title: string;

    @XmlXPathSelector("ComicInfo/Series")
    public Series: string;

    @XmlXPathSelector("ComicInfo/Volume")
    public Volume: number;

    @XmlXPathSelector("ComicInfo/Number")
    public Number: number;

    @XmlXPathSelector("ComicInfo/Writer")
    public Writer: string;

    @XmlXPathSelector("ComicInfo/Penciller")
    public Penciller: string;

    @XmlXPathSelector("ComicInfo/Inker")
    public Inker: string;

    @XmlXPathSelector("ComicInfo/Colorist")
    public Colorist: string;

    @XmlXPathSelector("ComicInfo/ScanInformation")
    public ScanInformation: string;

    @XmlXPathSelector("ComicInfo/Summary")
    public Summary: string;

    @XmlXPathSelector("ComicInfo/Year")
    public Year: number;

    @XmlXPathSelector("ComicInfo/PageCount")
    public PageCount: number;

    @XmlXPathSelector("ComicInfo/Pages/Page")
    @XmlItemType(Page)
    public Pages: Page[];
}
