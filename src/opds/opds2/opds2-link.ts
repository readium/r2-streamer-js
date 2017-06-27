// https://github.com/edcarroll/ta-json
import {
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

    @JsonProperty("rel")
    @JsonElementType(String)
    public Rel: string | string[];

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

    public AddRel(rel: string) {
        if (!this.Rel || this.Rel.indexOf(rel) < 0) {
            if (!this.Rel) {
                this.Rel = [];
            }
            this.Rel.push(rel);
        }
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Href) {
            console.log("Link.Href is not set!");
        }
    }
}
