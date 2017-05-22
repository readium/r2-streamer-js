// https://github.com/edcarroll/ta-json
import {
    // IPropertyConverter,
    JsonConverter,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { DateConverter } from "../../xml-js-mapper";

@JsonObject()
export class OPDSMetadata {

    @JsonProperty("@type")
    public RDFType: string;

    @JsonProperty("title")
    public Title: string;

    @JsonProperty("numberOfItems")
    public NumberOfItems: number;

    @JsonProperty("modified")
    @JsonConverter(DateConverter)
    public Modified: Date;

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Title) {
            console.log("OPDSMetadata.Title is not set!");
        }
    }
}
