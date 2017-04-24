import {
    XmlObject,
    XmlXPathSelector,
} from "../../xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
})
export class Manifest {

    @XmlXPathSelector("@id")
    public ID: string;

    @XmlXPathSelector("@href")
    public Href: string;

    @XmlXPathSelector("@media-type")
    public MediaType: string;

    @XmlXPathSelector("@media-fallback")
    public Fallback: string;

    @XmlXPathSelector("@properties")
    public Properties: string;

    @XmlXPathSelector("@media-overlay")
    public MediaOverlay: string;

    // public inspect(depth: number, opts: any): string | null | undefined {
    //     return undefined;
    // }
}
