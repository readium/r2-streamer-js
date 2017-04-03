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
export class ContentKey {
    @JsonProperty("encrypted_value")
    public EncryptedValue: string;

    @JsonProperty("algorithm")
    public Algorithm: string;
}
