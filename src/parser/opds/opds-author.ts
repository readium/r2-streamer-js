import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

import { ns } from "./opds";

@XmlObject(ns)
export class Author {

    @XmlXPathSelector("atom:name/text()")
    public Name: string;

    @XmlXPathSelector("atom:uri/text()")
    public Uri: string;

    @XmlXPathSelector("atom:email/text()")
    public Email: string;
}
