import { JsonDateConverter } from "@utils/ta-json-date-converter";
// https://github.com/edcarroll/ta-json
import {
    JsonConverter,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

@JsonObject()
export class OPDSMetadata {

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
    @JsonConverter(JsonDateConverter)
    public Modified: Date;

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Title) {
            console.log("OPDSMetadata.Title is not set!");
        }
    }
}
