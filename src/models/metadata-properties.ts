// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
} from "ta-json";

import { Encrypted } from "./metadata-encrypted";

@JsonObject()
export class Properties {

    @JsonProperty("contains")
    @JsonElementType(String)
    public Contains: string[];

    @JsonProperty("layout")
    public Layout: string;

    @JsonProperty("media-overlay")
    public MediaOverlay: string;

    @JsonProperty("orientation")
    public Orientation: string;

    @JsonProperty("overflow")
    public Overflow: string;

    @JsonProperty("page")
    public Page: string;

    @JsonProperty("spread")
    public Spread: string;

    @JsonProperty("encrypted")
    public Encrypted: Encrypted;
}
