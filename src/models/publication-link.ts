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

    @JsonProperty("height")
    public Height: number;

    @JsonProperty("width")
    public Width: number;

    @JsonProperty("title")
    public Title: string;

    @JsonProperty("properties")
    public Properties: Properties;

    @JsonProperty("duration")
    public Duration: number;

    @JsonProperty("templated")
    public Templated: boolean;

    @JsonProperty("children")
    @JsonElementType(Link)
    public Children: Link[];

    public MediaOverlays: MediaOverlayNode[];

    @JsonProperty("rel")
    @JsonElementType(String)
    public Rel: string | string[];

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
            // this.Rel = [];
            // this.Rel.push(rel);

            this.Rel = rel;
        } else {
            if (this.Rel instanceof Array) {
                this.Rel.push(rel);
            } else {
                const otherRel = this.Rel;

                this.Rel = [];
                this.Rel.push(otherRel);
                this.Rel.push(rel);
            }
        }
    }

    public HasRel(rel: string): boolean {

        if (this.Rel) {
            if (this.Rel instanceof Array) {
                if ((this.Rel as string[]).indexOf(rel) >= 0) {
                    return true;
                }
            } else {
                if ((this.Rel as string) === rel) {
                    return true;
                }
            }
        }
        return false;
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Href) {
            console.log("Link.Href is not set!");
        }
    }
}
