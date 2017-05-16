import { Author } from "./opds-author";
import { Entry } from "./opds-entry";
import { Link } from "./opds-link";

import {
    DateConverter,
    XmlConverter,
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    app: "http://www.w3.org/2007/app",
    atom: "http://www.w3.org/2005/Atom",
    bibframe: "http://bibframe.org/vocab/",
    dcterms: "http://purl.org/dc/terms/",
    odl: "http://opds-spec.org/odl",
    opds: "http://opds-spec.org/2010/catalog",
    opensearch: "http://a9.com/-/spec/opensearch/1.1/",
    schema: "http://schema.org",
    thr: "http://purl.org/syndication/thread/1.0",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class OPDS {

    @XmlXPathSelector("/atom:feed/opensearch:totalResults/text()")
    public OpensearchTotalResults: string;

    @XmlXPathSelector("/atom:feed/opensearch:itemsPerPage/text()")
    public OpensearchItemsPerPage: string;

    @XmlXPathSelector("/atom:feed/atom:id/text()")
    public Id: string;

    @XmlXPathSelector("/atom:feed/atom:title/text()")
    public Title: string;

    @XmlXPathSelector("/atom:feed/atom:updated/text()")
    @XmlConverter(DateConverter)
    public Updated: Date;

    @XmlXPathSelector("/atom:feed/atom:icon/text()")
    public Icon: string;

    @XmlXPathSelector("/atom:feed/atom:author")
    @XmlItemType(Author)
    public Authors: Author[];

    @XmlXPathSelector("/atom:feed/@lang")
    public Lang: string;

    @XmlXPathSelector("/atom:feed/atom:link")
    @XmlItemType(Link)
    public Links: Link[];

    @XmlXPathSelector("/atom:feed/atom:entry")
    @XmlItemType(Entry)
    public Entries: Entry[];
}
