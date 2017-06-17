// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSLink } from "./opds2-link";
import { OPDSPublicationMetadata } from "./opds2-publicationMetadata";

@JsonObject()
export class OPDSPublication {

    @JsonProperty("metadata")
    public Metadata: OPDSPublicationMetadata;

    @JsonProperty("links")
    @JsonElementType(OPDSLink)
    public Links: OPDSLink[];

    @JsonProperty("images")
    @JsonElementType(OPDSLink)
    public Images: OPDSLink[];

    public findFirstLinkByRel(rel: string): OPDSLink | undefined {

        return this.Links ? this.Links.find((l) => {
            return l.Rel && typeof l.Rel.find((r) => {
                return r === rel;
            }) !== "undefined";
        }) : undefined;
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("OPDSPublication.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("OPDSPublication.Links is not set!");
        }
        if (!this.Images) {
            console.log("OPDSPublication.Images is not set!");
        }
    }
}
