// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

@JsonObject()
export class Encrypted {

    @JsonProperty("scheme")
    public Scheme: string;

    @JsonProperty("profile")
    public Profile: string;

    @JsonProperty("algorithm")
    public Algorithm: string;

    @JsonProperty("compression")
    public Compression: string;

    @JsonProperty("original-length")
    public OriginalLength: number;

    public DecryptedLengthBeforeInflate: number = -1;
    public CypherBlockPadding: number = -1;
    public CypherBlockIV: string; // Buffer | undefined;
}
