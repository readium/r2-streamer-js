import { Author } from "./opds-author";
import { Category } from "./opds-category";
import { Link } from "./opds-link";

import {
    DateConverter,
    XmlConverter,
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

import { ns } from "./opds";

@XmlObject(ns)
export class Entry {

    @XmlXPathSelector("schema:Rating/@schema:ratingValue")
    public SchemaRatingValue: string;
    @XmlXPathSelector("schema:Rating/@schema:additionalType")
    public SchemaRatingAdditionalType: string;

    @XmlXPathSelector("@schema:additionalType")
    public SchemaAdditionalType: string;

    @XmlXPathSelector("atom:title/text()")
    public Title: string;

    @XmlXPathSelector("atom:author")
    @XmlItemType(Author)
    public Authors: Author[];

    @XmlXPathSelector("atom:id/text()")
    public Id: string;

    @XmlXPathSelector("atom:summary/text()")
    public Summary: string;
    @XmlXPathSelector("atom:summary/@type")
    public SummaryType: string;

    @XmlXPathSelector("dcterms:language/text()")
    public DcLanguage: string;

    @XmlXPathSelector("dcterms:extent/text()")
    public DcExtent: string;

    @XmlXPathSelector("dcterms:publisher/text()")
    public DcPublisher: string;

    @XmlXPathSelector("dcterms:issued/text()")
    public DcIssued: string;

    @XmlXPathSelector("dcterms:identifier/text()")
    public DcIdentifier: string;
    @XmlXPathSelector("dcterms:identifier/@xsi:type")
    public DcIdentifierType: string;

    @XmlXPathSelector("bibframe:distribution/@bibframe:ProviderName")
    public BibFrameDistributionProviderName: string;

    @XmlXPathSelector("atom:category")
    @XmlItemType(Category)
    public Categories: Category[];

    @XmlXPathSelector("atom:content/text()")
    public Content: string;
    @XmlXPathSelector("atom:content/@type")
    public ContentType: string;

    @XmlXPathSelector("atom:updated/text()")
    @XmlConverter(DateConverter)
    public Updated: Date;

    @XmlXPathSelector("atom:published/text()")
    @XmlConverter(DateConverter)
    public Published: Date;

    @XmlXPathSelector("atom:link")
    @XmlItemType(Link)
    public Links: Link[];
}
