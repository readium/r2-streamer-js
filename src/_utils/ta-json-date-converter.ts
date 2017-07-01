import { IPropertyConverter, JsonValue } from "ta-json";

export class JsonDateConverter implements IPropertyConverter {
    public serialize(property: Date): JsonValue {
        return property.toISOString();
    }

    public deserialize(value: JsonValue): Date {
        return new Date(value as string);
    }

    public collapseArrayWithSingleItem(): boolean {
        return false;
    }
}
