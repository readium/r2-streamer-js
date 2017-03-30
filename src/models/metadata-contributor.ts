// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

import { IStringMap } from "./metadata-multilang";

@JsonObject()
export class Contributor {

    @JsonProperty("name")
    public Name: string | IStringMap;

    @JsonProperty("sort_as")
    public SortAs: string;

    @JsonProperty("identifier")
    public Identifier: string;

    @JsonProperty("role")
    public Role: string;
}
