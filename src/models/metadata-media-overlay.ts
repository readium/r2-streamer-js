// https://github.com/edcarroll/ta-json
import {
    JsonObject,
    JsonProperty,
} from "ta-json";

@JsonObject()
export class MediaOverlay {

    @JsonProperty("active-class")
    public ActiveClass: string;

    @JsonProperty("playback-active-class")
    public PlaybackActiveClass: string;
}
