// https://github.com/edcarroll/ta-json
import {
    // IPropertyConverter,
    JsonConverter,
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { DateConverter } from "../xml-js-mapper";

import { IStringMap } from "./metadata-multilang";

import { BelongsTo } from "./metadata-belongsto";
import { Contributor } from "./metadata-contributor";
import { Properties } from "./metadata-properties";
import { Subject } from "./metadata-subject";

export interface IMeta {
    property: string;
    value: string;
    children: IMeta[];
}

@JsonObject()
export class Metadata {
    @JsonProperty("@type")
    public RDFType: string;

    @JsonProperty("title")
    // @JsonConverter(new NotOptional("Title"))
    public Title: string | IStringMap;

    @JsonProperty("identifier")
    // @JsonConverter(new NotOptional("Identifier"))
    public Identifier: string;

    @JsonProperty("author")
    @JsonElementType(Contributor)
    public Author: Contributor[];

    @JsonProperty("translator")
    @JsonElementType(Contributor)
    public Translator: Contributor[];

    @JsonProperty("editor")
    @JsonElementType(Contributor)
    public Editor: Contributor[];

    @JsonProperty("artist")
    @JsonElementType(Contributor)
    public Artist: Contributor[];

    @JsonProperty("illustrator")
    @JsonElementType(Contributor)
    public Illustrator: Contributor[];

    @JsonProperty("letterer")
    @JsonElementType(Contributor)
    public Letterer: Contributor[];

    @JsonProperty("penciler")
    @JsonElementType(Contributor)
    public Penciler: Contributor[];

    @JsonProperty("colorist")
    @JsonElementType(Contributor)
    public Colorist: Contributor[];

    @JsonProperty("inker")
    @JsonElementType(Contributor)
    public Inker: Contributor[];

    @JsonProperty("narrator")
    @JsonElementType(Contributor)
    public Narrator: Contributor[];

    @JsonProperty("contributor")
    @JsonElementType(Contributor)
    public Contributor: Contributor[];

    @JsonProperty("publisher")
    @JsonElementType(Contributor)
    public Publisher: Contributor[];

    @JsonProperty("imprint")
    @JsonElementType(Contributor)
    public Imprint: Contributor[];

    @JsonProperty("language")
    @JsonElementType(String)
    public Language: string[];

    @JsonProperty("modified")
    @JsonConverter(DateConverter)
    public Modified: Date;

    @JsonProperty("published")
    @JsonConverter(DateConverter)
    public PublicationDate: Date;

    @JsonProperty("description")
    public Description: string;

    @JsonProperty("direction")
    public Direction: string;

    @JsonProperty("rendition")
    public Rendition: Properties;

    @JsonProperty("source")
    public Source: string;

    @JsonProperty("epub-type")
    @JsonElementType(String)
    public EpubType: string[];

    @JsonProperty("rights")
    public Rights: string;

    @JsonProperty("subject")
    @JsonElementType(Subject)
    public Subject: Subject[];

    @JsonProperty("belongs_to")
    public BelongsTo: BelongsTo;

    public OtherMetadata: IMeta[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    private _OnDeserialized() {
        if (!this.Title) {
            console.log("Metadata.Title is not set!");
        }
        if (!this.Identifier) {
            console.log("Metadata.Identifier is not set!");
        }
    }
}

// class NotOptional implements IPropertyConverter {
//     constructor(readonly name: string) {
//     }
//     public serialize(property: any): any {
//         console.log(this.name + " >> " + property);
//         if (!property) {
//             console.log("NotOptional! (serialize)");
//         }
//         return property;
//     }

//     public deserialize(value: any): any {
//         console.log(this.name + " << " + value);
//         if (!value) {
//             console.log("NotOptional! (deserialize)");
//         }
//         return value;
//     }
// }
