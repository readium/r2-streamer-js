// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
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
