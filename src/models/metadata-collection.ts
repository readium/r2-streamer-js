// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

@JsonObject()
export class Collection {

    @JsonProperty("name")
    public Name: string;

    @JsonProperty("sort_as")
    public SortAs: string;

    @JsonProperty("identifier")
    public Identifier: string;

    @JsonProperty("position")
    public Position: number;

    @OnDeserialized()
    private _OnDeserialized() {
        if (!this.Name) {
            console.log("Collection.Name is not set!");
        }
    }
}
