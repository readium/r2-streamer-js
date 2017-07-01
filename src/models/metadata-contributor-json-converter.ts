import {
    IPropertyConverter,
    JSON as TAJSON,
    JsonValue,
} from "ta-json";

import { Contributor } from "./metadata-contributor";

export class JsonContributorConverter implements IPropertyConverter {
    public serialize(property: Contributor): JsonValue {
        // console.log("JsonContributorConverter.serialize()");

        return TAJSON.serialize(property);
    }

    public deserialize(value: JsonValue): Contributor {
        // console.log("JsonContributorConverter.deserialize()");

        // if (value instanceof Array) {
        //     return value.map((v) => {
        //         return this.deserialize(v);
        //     }) as Contributor[];
        // } else
        if (typeof value === "string") {
            const c = new Contributor();
            c.Name = value as string;
            return c;
        } else {
            return TAJSON.deserialize<Contributor>(value, Contributor);
        }
    }

    public collapseArrayWithSingleItem(): boolean {
        return true;
    }
}
