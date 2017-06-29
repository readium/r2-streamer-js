// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

@JsonObject()
export class Link {
    @JsonProperty("length")
    public Length: number;

    @JsonProperty("href")
    public Href: string;

    @JsonProperty("title")
    public Title: string;

    @JsonProperty("type")
    public Type: string;

    @JsonProperty("templated")
    public Templated: string;

    @JsonProperty("profile")
    public Profile: string;

    @JsonProperty("hash")
    public Hash: string;

    @JsonProperty("rel")
    public Rel: string;

    public HasRel(rel: string): boolean {
        return this.Rel === rel;
    }

    public SetRel(rel: string) {
        this.Rel = rel;
    }
}
