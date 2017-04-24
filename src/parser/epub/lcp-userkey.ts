// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

@JsonObject()
export class UserKey {
    @JsonProperty("text_hint")
    public TextHint: string;

    @JsonProperty("algorithm")
    public Algorithm: string;

    @JsonProperty("key_check")
    public KeyCheck: string;
}
