// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { MediaOverlayNode } from "./media-overlay";
import { Properties } from "./metadata-properties";

@JsonObject()
export class Link {

    @JsonProperty("href")
    public Href: string;

    @JsonProperty("type")
    public TypeLink: string;

    @JsonProperty("rel")
    @JsonElementType(String)
    public Rel: string[];

    @JsonProperty("height")
    public Height: number;

    @JsonProperty("width")
    public Width: number;

    @JsonProperty("title")
    public Title: string;

    @JsonProperty("properties")
    public Properties: Properties;

    @JsonProperty("duration")
    public Duration: string;

    @JsonProperty("templated")
    public Templated: boolean;

    @JsonProperty("children")
    @JsonElementType(Link)
    public Children: Link[];

    public MediaOverlays: MediaOverlayNode[];

    public AddRel(rel: string) {
        if (!this.Rel || this.Rel.indexOf(rel) < 0) {
            if (!this.Rel) {
                this.Rel = Array<string>();
            }
            this.Rel.push(rel);
        }
    }

    @OnDeserialized()
    private _OnDeserialized() {
        if (!this.Href) {
            console.log("Link.Href is not set!");
        }
    }
}
