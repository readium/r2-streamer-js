// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSLink } from "./opds2-link";
import { OPDSMetadata } from "./opds2-metadata";
import { OPDSPublication } from "./opds2-publication";

@JsonObject()
export class OPDSGroup {

    @JsonProperty("metadata")
    public Metadata: OPDSMetadata;

    @JsonProperty("publications")
    @JsonElementType(OPDSPublication)
    public Publications: OPDSPublication[];

    @JsonProperty("links")
    @JsonElementType(OPDSLink)
    public Links: OPDSLink[];

    @JsonProperty("navigation")
    @JsonElementType(OPDSLink)
    public Navigation: OPDSLink[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("OPDSGroup.Metadata is not set!");
        }
    }
}
