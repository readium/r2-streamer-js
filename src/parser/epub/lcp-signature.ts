// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
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
