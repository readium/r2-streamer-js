// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSBelongsTo } from "./opds2-belongsTo";
import { OPDSContributor } from "./opds2-contributor";
import { IStringMap } from "./opds2-multilang";
import { OPDSSubject } from "./opds2-subject";

@JsonObject()
export class OPDSPublicationMetadata {
    @JsonProperty("@type")
    public RDFType: string;

    @JsonProperty("title")
    // @JsonType(String)
    // not needed because primitive string union with
    // simple object type (string keys, string values)
    public Title: string | IStringMap; // | string[] | IStringMap[]

    @JsonProperty("identifier")
    public Identifier: string;

    @JsonProperty("author")
    @JsonElementType(OPDSContributor)
    public Author: OPDSContributor[];

    @JsonProperty("translator")
    @JsonElementType(OPDSContributor)
    public Translator: OPDSContributor[];

    @JsonProperty("editor")
    @JsonElementType(OPDSContributor)
    public Editor: OPDSContributor[];

    @JsonProperty("artist")
    @JsonElementType(OPDSContributor)
    public Artist: OPDSContributor[];

    @JsonProperty("illustrator")
    @JsonElementType(OPDSContributor)
    public Illustrator: OPDSContributor[];

    @JsonProperty("letterer")
    @JsonElementType(OPDSContributor)
    public Letterer: OPDSContributor[];

    @JsonProperty("penciler")
    @JsonElementType(OPDSContributor)
    public Penciler: OPDSContributor[];

    @JsonProperty("colorist")
    @JsonElementType(OPDSContributor)
    public Colorist: OPDSContributor[];

    @JsonProperty("inker")
    @JsonElementType(OPDSContributor)
    public Inker: OPDSContributor[];

    @JsonProperty("narrator")
    @JsonElementType(OPDSContributor)
    public Narrator: OPDSContributor[];

    @JsonProperty("contributor")
    @JsonElementType(OPDSContributor)
    public OPDSContributor: OPDSContributor[];

    @JsonProperty("publisher")
    @JsonElementType(OPDSContributor)
    public Publisher: OPDSContributor[];

    @JsonProperty("imprint")
    @JsonElementType(OPDSContributor)
    public Imprint: OPDSContributor[];

    @JsonProperty("language")
    @JsonElementType(String)
    public Language: string[];

    @JsonProperty("modified")
    public Modified: Date;

    @JsonProperty("published")
    public PublicationDate: Date;

    @JsonProperty("description")
    public Description: string;

    @JsonProperty("source")
    public Source: string;

    @JsonProperty("rights")
    public Rights: string;

    @JsonProperty("subject")
    @JsonElementType(OPDSSubject)
    public Subject: OPDSSubject[];

    @JsonProperty("belongs_to")
    public BelongsTo: OPDSBelongsTo;

    @JsonProperty("duration")
    public Duration: number;

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.Title) {
            console.log("OPDSPublicationMetadata.Title is not set!");
        }
        if (!this.Identifier) {
            console.log("OPDSPublicationMetadata.Identifier is not set!");
        }
    }
}
