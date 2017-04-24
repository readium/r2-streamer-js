// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

@JsonObject()
export class ContentKey {
    @JsonProperty("encrypted_value")
    public EncryptedValue: string;

    @JsonProperty("algorithm")
    public Algorithm: string;
}
