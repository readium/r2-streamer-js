// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { Link } from "../publication-link";
import { OPDSMetadata } from "./opds2-metadata";

@JsonObject()
export class OPDSFacet {

    @JsonProperty("metadata")
    public Metadata: OPDSMetadata;

    @JsonProperty("links")
    @JsonElementType(Link)
    public Links: Link[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("OPDSFacet.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("OPDSFacet.Links is not set!");
        }
    }
}
