// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
} from "ta-json";

import { OPDSCollection } from "./opds2-collection";

@JsonObject()
export class OPDSBelongsTo {

    @JsonProperty("series")
    @JsonElementType(OPDSCollection)
    public Series: OPDSCollection[];

    @JsonProperty("collection")
    @JsonElementType(OPDSCollection)
    public Collection: OPDSCollection[];
}
