// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

@JsonObject()
export class OPDSSubject {

    @JsonProperty("name")
    public Name: string;

    @JsonProperty("sort_as")
    public SortAs: string;

    @JsonProperty("scheme")
    public Scheme: string;

    @JsonProperty("code")
    public Code: string;

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Name) {
            console.log("OPDSSubject.Name is not set!");
        }
    }
}
