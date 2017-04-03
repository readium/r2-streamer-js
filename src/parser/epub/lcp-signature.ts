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
export class Signature {
    @JsonProperty("algorithm")
    public Algorithm: string;

    @JsonProperty("certificate")
    public Certificate: string;

    @JsonProperty("value")
    public Value: string;
}
