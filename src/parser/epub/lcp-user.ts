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
export class User {
    @JsonProperty("id")
    public ID: string;

    @JsonProperty("email")
    public Email: string;

    @JsonProperty("name")
    public Name: string;

    @JsonProperty("encrypted")
    @JsonElementType(String)
    public Encrypted: string[];
}
