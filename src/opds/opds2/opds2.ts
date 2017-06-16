// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSFacet } from "./opds2-facet";
import { OPDSGroup } from "./opds2-group";
import { OPDSLink } from "./opds2-link";
import { OPDSMetadata } from "./opds2-metadata";
import { OPDSPublication } from "./opds2-publication";

@JsonObject()
export class OPDSFeed {

    @JsonProperty("@context")
    @JsonElementType(String)
    public Context: string[];

    @JsonProperty("metadata")
    public Metadata: OPDSMetadata;

    @JsonProperty("links")
    @JsonElementType(OPDSLink)
    public Links: OPDSLink[];

    @JsonProperty("publications")
    @JsonElementType(OPDSPublication)
    public Publications: OPDSPublication[];

    @JsonProperty("navigation")
    @JsonElementType(OPDSLink)
    public Navigation: OPDSLink[];

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
    }
}
