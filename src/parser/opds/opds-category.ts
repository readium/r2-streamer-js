import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

import { ns } from "./opds";

@XmlObject(ns)
export class Category {

    @XmlXPathSelector("@term")
    public Term: string;

    @XmlXPathSelector("@scheme")
    public Scheme: string;

    @XmlXPathSelector("@label")
    public Label: string;
}
