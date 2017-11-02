// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSContributor } from "./opds2-contributor";

@JsonObject()
export class OPDSMetadata {

    @JsonProperty("author")
    @JsonElementType(OPDSContributor)
    public Author: OPDSContributor[];

    @JsonProperty("@type")
    public RDFType: string;

    @JsonProperty("title")
    public Title: string;

    @JsonProperty("numberOfItems")
    public NumberOfItems: number;

    @JsonProperty("itemsPerPage")
    public ItemsPerPage: number;

    @JsonProperty("currentPage")
    public CurrentPage: number;

    @JsonProperty("modified")
    public Modified: Date;

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.Title) {
            console.log("OPDSMetadata.Title is not set!");
        }
    }
}
