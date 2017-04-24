// https://github.com/edcarroll/ta-json
import {
    DateConverter,
    JsonConverter,
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
    @JsonConverter(DateConverter)
    public Start: Date;

    @JsonProperty("end")
    @JsonConverter(DateConverter)
    public End: Date;
}
