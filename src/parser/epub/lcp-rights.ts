// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

@JsonObject()
export class Rights {
    @JsonProperty("print")
    public Print: number;

    @JsonProperty("copy")
    public Copy: number;

    @JsonProperty("start")
    public Start: Date;

    @JsonProperty("end")
    public End: Date;
}
