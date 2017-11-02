import { JsonStringConverter } from "@utils/ta-json-string-converter";
// https://github.com/edcarroll/ta-json
import {
    JsonConverter,
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSProperties } from "./opds2-properties";

@JsonObject()
export class OPDSLink {

    @JsonProperty("href")
    public Href: string;

    @JsonProperty("type")
    public TypeLink: string;

    @JsonProperty("height")
    public Height: number;

    @JsonProperty("width")
    public Width: number;

    @JsonProperty("title")
    public Title: string;

    @JsonProperty("properties")
    public Properties: OPDSProperties;

    @JsonProperty("duration")
    public Duration: number;

    @JsonProperty("templated")
    public Templated: boolean;

    @JsonProperty("children")
    @JsonElementType(OPDSLink)
    public Children: OPDSLink[];

    @JsonProperty("bitrate")
    public Bitrate: number;

    @JsonProperty("rel")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Rel: string[];

    public AddRels(rels: string[]) {
        rels.forEach((rel) => {
            this.AddRel(rel);
        });
    }

    public AddRel(rel: string) {
        if (this.HasRel(rel)) {
            return;
        }
        if (!this.Rel) {
            this.Rel = [rel];
        } else {
            this.Rel.push(rel);
        }
    }

    public HasRel(rel: string): boolean {
        return this.Rel && this.Rel.indexOf(rel) >= 0;
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.Href) {
            console.log("Link.Href is not set!");
        }
    }
}
