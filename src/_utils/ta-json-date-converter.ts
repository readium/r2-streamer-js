import { IPropertyConverter, JsonValue, propertyConverters } from "ta-json";

export class JsonDateConverter implements IPropertyConverter {
    public serialize(property: Date): JsonValue {
        return property.toISOString();
    }

    public deserialize(value: JsonValue): Date {
        return new Date(value as string);
    }
}

propertyConverters.set(Date, new JsonDateConverter());
