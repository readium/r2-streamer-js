// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { Publication } from "../publication";
import { Link } from "../publication-link";
import { OPDSFacet } from "./opds2-facet";
import { OPDSGroup } from "./opds2-group";
import { OPDSMetadata } from "./opds2-metadata";

@JsonObject()
export class OPDSFeed {

    @JsonProperty("@context")
    @JsonElementType(String)
    public Context: string[];

    @JsonProperty("metadata")
    public Metadata: OPDSMetadata;

    @JsonProperty("links")
    @JsonElementType(Link)
    public Links: Link[];

    @JsonProperty("publications")
    @JsonElementType(Publication)
    public Publications: Publication[];

    @JsonProperty("navigation")
    @JsonElementType(Link)
    public Navigation: Link[];

    @JsonProperty("facets")
    @JsonElementType(OPDSFacet)
    public Facets: OPDSFacet[];

    @JsonProperty("groups")
    @JsonElementType(OPDSGroup)
    public Groups: OPDSGroup[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("OPDS2Feed.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("OPDS2Feed.Links is not set!");
        }
        if (!this.Context) {
            console.log("OPDS2Feed.Context is not set!");
        }
    }
}
