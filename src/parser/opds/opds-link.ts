import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

import { ns } from "./opds";

@XmlObject(ns)
export class Link {

    @XmlXPathSelector("opds:price/text()")
    public OpdsPrice: string;

    @XmlXPathSelector("opds:price/@currencycode")
    public OpdsPriceCurrencyCode: string;

    @XmlXPathSelector("opds:indirectAcquisition/@type")
    public OpdsIndirectAcquisitionType: string;

    @XmlXPathSelector("opds:indirectAcquisition/opds:indirectAcquisition/@type")
    public OpdsIndirectAcquisitionType_: string;

    @XmlXPathSelector("@type")
    public Type: string;

    // and .='hqdefault'
    // @XmlXPathSelector("@*[local-name()='count' and namespace-uri()='http://purl.org/syndication/thread/1.0']")
    @XmlXPathSelector("@thr:count")
    public ThrCount: string;

    @XmlXPathSelector("@opds:facetGroup")
    public FacetGroup: string;

    @XmlXPathSelector("@href")
    public Href: string;

    @XmlXPathSelector("@rel")
    public Rel: string;

    @XmlXPathSelector("@title")
    public Title: string;
}
