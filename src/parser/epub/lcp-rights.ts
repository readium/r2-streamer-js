// https://github.com/edcarroll/ta-json
import {
    JsonConverter,
    JsonObject,
    JsonProperty,
} from "ta-json";

import { DateConverter } from "../../xml-js-mapper";

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
