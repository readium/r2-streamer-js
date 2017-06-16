import { JsonDateConverter } from "@utils/ta-json-date-converter";
// https://github.com/edcarroll/ta-json
import {
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
    @JsonConverter(JsonDateConverter)
    public Start: Date;

    @JsonProperty("end")
    @JsonConverter(JsonDateConverter)
    public End: Date;
}
