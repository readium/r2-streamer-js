// https://github.com/edcarroll/ta-json
import {
    // BeforeDeserialized,
    // JsonConstructor,
    JsonElementType,
    JsonObject,
    JsonProperty,
    // OnDeserialized,
} from "ta-json";

@JsonObject()
export class MediaOverlayNode {
    @JsonProperty("text")
    public Text: string;

    @JsonProperty("audio")
    public Audio: string;

    @JsonProperty("role")
    @JsonElementType(String)
    public Role: string[];

    @JsonProperty("children")
    @JsonElementType(MediaOverlayNode)
    public Children: MediaOverlayNode[];

    // constructor(text: string = "T3") {
    //     this._JsonConstructor(text);
    // }

    // @JsonConstructor()
    // private _JsonConstructor(text: string = "T2") {
    //     console.log("_JsonConstructor");
    //     console.log("!!!! " + text);

    //     this.Text = text;
    // }

    // @BeforeDeserialized()
    // private _BeforeDeserialized() {
    //     console.log("_BeforeDeserialized");

    //     this.Text = "T1";
    //     // this.Audio = "";
    // }

    // @OnDeserialized()
    // private _OnDeserialized() {
    //     console.log("_OnDeserialized");
    //     console.log("==> " + this.info);
    // }

    // public get info(): string {
    //     return `${this.Text} + ${this.Audio} - ` + (this.Children ? this.Children.length : "0");
    // }
}
