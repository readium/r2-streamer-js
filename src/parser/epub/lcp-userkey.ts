// https://github.com/edcarroll/ta-json
import {
    DateConverter,
    // IPropertyConverter,
    JsonConverter,
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
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
