import {
    IPropertyConverter,
    JSON as TAJSON,
    JsonValue,
} from "ta-json";

import { OPDSCollection } from "./opds2-collection";

export class JsonOPDSCollectionConverter implements IPropertyConverter {
    public serialize(property: OPDSCollection): JsonValue {
        // console.log("JsonOPDSCollectionConverter.serialize()");

        return TAJSON.serialize(property);
    }

    public deserialize(value: JsonValue): OPDSCollection {
        // console.log("JsonOPDSCollectionConverter.deserialize()");

        // if (value instanceof Array) {
        //     return value.map((v) => {
        //         return this.deserialize(v);
        //     }) as OPDSCollection[];
        // } else
        if (typeof value === "string") {
            const c = new OPDSCollection();
            c.Name = value as string;
            return c;
        } else {
            return TAJSON.deserialize<OPDSCollection>(value, OPDSCollection);
        }
    }

    public collapseArrayWithSingleItem(): boolean {
        return true;
    }
}
