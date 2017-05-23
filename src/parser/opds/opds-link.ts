import {
    XmlObject,
    XmlXPathSelector,
} from "../../_utils/xml-js-mapper";

@XmlObject({
    app: "http://www.w3.org/2007/app",
    atom: "http://www.w3.org/2005/Atom",
    bibframe: "http://bibframe.org/vocab/",
    dcterms: "http://purl.org/dc/terms/",
    odl: "http://opds-spec.org/odl",
    opds: "http://opds-spec.org/2010/catalog",
    opensearch: "http://a9.com/-/spec/opensearch/1.1/",
    relevance: "http://a9.com/-/opensearch/extensions/relevance/1.0/",
    schema: "http://schema.org",
    thr: "http://purl.org/syndication/thread/1.0",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class Link {

    // XPATH ROOT: /atom:feed/atom:link
    // XPATH ROOT: /atom:feed/atom:entry/atom:link

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
