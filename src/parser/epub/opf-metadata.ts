import { Identifier } from "./opf-identifier";
import { Subject } from "./opf-subject";

import {
    XmlItemType,
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Metadata {

    // Title       []Title      `xml:"title"`

    @XmlXPathSelector("dc:language/text()")
    @XmlItemType(String)
    public Language: string[];

    @XmlXPathSelector("dc:identifier")
    @XmlItemType(Identifier)
    public Identifier: Identifier[];

    // Creator     []Author     `xml:"creator"`

    @XmlXPathSelector("dc:subject")
    @XmlItemType(Subject)
    public Subject: Subject[];

    @XmlXPathSelector("dc:description/text()")
    @XmlItemType(String)
    public Description: string[];

    @XmlXPathSelector("dc:publisher/text()")
    @XmlItemType(String)
    public Publisher: string[];

    // Contributor []Author     `xml:"contributor"`
    // Date        []Date       `xml:"date"`

    @XmlXPathSelector("dc:type/text()")
    @XmlItemType(String)
    public Type: string[];

    @XmlXPathSelector("dc:format/text()")
    @XmlItemType(String)
    public Format: string[];

    @XmlXPathSelector("dc:source/text()")
    @XmlItemType(String)
    public Source: string[];

    @XmlXPathSelector("dc:relation/text()")
    @XmlItemType(String)
    public Relation: string[];

    @XmlXPathSelector("dc:coverage/text()")
    @XmlItemType(String)
    public Coverage: string[];

    @XmlXPathSelector("dc:rights/text()")
    @XmlItemType(String)
    public Rights: string[];

    // Meta        []Metafield  `xml:"meta"`
}
