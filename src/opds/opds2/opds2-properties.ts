// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
} from "ta-json";

import { OPDSIndirectAcquisition } from "./opds2-indirectAcquisition";
import { OPDSPrice } from "./opds2-price";

@JsonObject()
export class OPDSProperties {

    @JsonProperty("numberOfItems")
    public NumberOfItems: number;

    @JsonProperty("price")
    public Price: OPDSPrice;

    @JsonProperty("indirectAcquisition")
    @JsonElementType(OPDSIndirectAcquisition)
    public IndirectAcquisitions: OPDSIndirectAcquisition[];
}
