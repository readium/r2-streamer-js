import {
    XmlObject,
    XmlXPathSelector,
} from "@utils/xml-js-mapper";

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
export class Author {

    // XPATH ROOT: /atom:feed/atom:author
    // XPATH ROOT: /atom:feed/atom:entry/atom:author

    @XmlXPathSelector("atom:name/text()")
    public Name: string;

    @XmlXPathSelector("atom:uri/text()")
    public Uri: string;

    @XmlXPathSelector("atom:email/text()")
    public Email: string;
}
