import { IPropertyConverter, JSON as TAJSON, JsonValue, propertyConverters } from "ta-json";

import { Contributor } from "./metadata-contributor";

export class JsonContributorConverter implements IPropertyConverter {
    public serialize(property: Contributor | Contributor[]): JsonValue {
        console.log("JsonContributorConverter.serialize()");

        // if (property instanceof Array) {
        //     return (property as Contributor[]).map((p) => {
        //         return this.serialize(p);
        //     });
        // } else { // instanceof Contributor
        //     return TAJSON.serialize(property);
        // }

        return TAJSON.serialize(property);
    }

    public deserialize(value: JsonValue): Contributor | Contributor[] {
        console.log("JsonContributorConverter.deserialize()");

        if (value instanceof Array) {
            return value.map((v) => {
                return this.deserialize(v);
            }) as Contributor[];
        } else if (typeof value === "string") {
            const c = new Contributor();
            c.Name = value as string;
            return c;
        } else {
            return TAJSON.deserialize<Contributor>(value, Contributor);
        }
    }
}

propertyConverters.set(Contributor, new JsonContributorConverter());
