// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { Link } from "../publication-link";

import { Publication } from "../publication";

import { OPDSMetadata } from "./opds2-metadata";

@JsonObject()
export class OPDSGroup {

    @JsonProperty("metadata")
    public Metadata: OPDSMetadata;

    @JsonProperty("publications")
    @JsonElementType(Publication)
    public Publications: Publication[];

    @JsonProperty("links")
    @JsonElementType(Link)
    public Links: Link[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("OPDSGroup.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("OPDSGroup.Links is not set!");
        }
        if (!this.Publications) {
            console.log("OPDSGroup.Publications is not set!");
        }
    }
}
