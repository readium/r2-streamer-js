// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

@JsonObject()
export class OPDSIndirectAcquisition {

    @JsonProperty("type")
    public TypeAcquisition: string;

    @JsonProperty("child")
    @JsonElementType(OPDSIndirectAcquisition)
    public Children: OPDSIndirectAcquisition[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.TypeAcquisition) {
            console.log("OPDSIndirectAcquisition.TypeAcquisition is not set!");
        }
    }
}
