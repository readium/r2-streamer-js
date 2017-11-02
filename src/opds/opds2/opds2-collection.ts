// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSLink } from "./opds2-link";

@JsonObject()
export class OPDSCollection {

    @JsonProperty("name")
    public Name: string;

    @JsonProperty("sort_as")
    public SortAs: string;

    @JsonProperty("identifier")
    public Identifier: string;

    @JsonProperty("position")
    public Position: number;

    @JsonProperty("links")
    @JsonElementType(OPDSLink)
    public Links: OPDSLink[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.Name) {
            console.log("OPDSCollection.Name is not set!");
        }
    }
}
