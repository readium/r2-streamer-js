// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
} from "ta-json";

// http://www.idpf.org/epub/31/spec/epub-mediaoverlays.html#app-clock-examples
// https://www.w3.org/TR/2008/REC-SMIL3-20081201/smil-timing.html#q22
export function timeStrToSeconds(timeStr: string): number {
    if (!timeStr) {
        return 0;
    }

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    try {
        const iMin = timeStr.indexOf("min");
        if (iMin > 0) {
            // time.fraction(min)
            const minsStr = timeStr.substr(0, iMin);
            minutes = parseFloat(minsStr);
        } else {
            const iMs = timeStr.indexOf("ms");
            if (iMs > 0) {
                // time.fraction(ms)
                const msStr = timeStr.substr(0, iMs);
                const ms = parseFloat(msStr);
                seconds = ms / 1000;
            } else {
                const iS = timeStr.indexOf("s");
                if (iS > 0) {
                    // time.fraction(s)
                    const sStr = timeStr.substr(0, iS);
                    seconds = parseFloat(sStr);
                } else {
                    const iH = timeStr.indexOf("h");
                    if (iH > 0) {
                        // time.fraction(h)
                        const hStr = timeStr.substr(0, iH);
                        hours = parseFloat(hStr);
                    } else {
                        const arr = timeStr.split(":");
                        if (arr.length === 1) {
                            // ss.fraction
                            seconds = parseFloat(arr[0]);

                        } else if (arr.length === 2) {
                            // mm:ss.fraction
                            minutes = parseFloat(arr[0]);
                            seconds = parseFloat(arr[1]);

                        } else if (arr.length === 3) {
                            // hh:mm:ss.fraction
                            hours = parseFloat(arr[0]);
                            minutes = parseFloat(arr[1]);
                            seconds = parseFloat(arr[2]);

                        } else {
                            console.log("SMIL TIME CLOCK SYNTAX PARSING ERROR ??");
                            console.log(timeStr);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
        console.log("SMIL TIME CLOCK SYNTAX PARSING ERROR!");
        console.log(timeStr);
        return 0;
    }

    return (hours * 3600) + (minutes * 60) + seconds; // total in seconds
}

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

    public SmilPathInZip: string;

    public initialized: boolean;

    // public inspect(depth: number, opts: any): string | null | undefined {
    //     return "MediaOverlay: " + this.SmilPathInZip;
    // }

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
    //// tslint:disable-next-line:no-unused-variable
    // private _OnDeserialized() {
    //     console.log("_OnDeserialized");
    //     console.log("==> " + this.info);
    // }

    // public get info(): string {
    //     return `${this.Text} + ${this.Audio} - ` + (this.Children ? this.Children.length : "0");
    // }
}
