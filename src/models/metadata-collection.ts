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
    // tslint:disable-next-line:no-unused-variable
    // tslint:disable-next-line
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() { // tslint:disable-line
        if (!this.Name) {
            console.log("Collection.Name is not set!");
        }
    }
}
