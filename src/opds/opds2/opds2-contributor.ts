// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
} from "ta-json";

import { OPDSLink } from "./opds2-link";
import { IStringMap } from "./opds2-multilang";

@JsonObject()
export class OPDSContributor {

    @JsonProperty("name")
    public Name: string | IStringMap;

    @JsonProperty("sort_as")
    public SortAs: string;

    @JsonProperty("identifier")
    public Identifier: string;

    @JsonProperty("role")
    public Role: string;

    @JsonProperty("links")
    @JsonElementType(OPDSLink)
    public Links: OPDSLink[];
}
