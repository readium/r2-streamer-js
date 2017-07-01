import { IPropertyConverter } from "./converter";

export class DateConverter implements IPropertyConverter {
    public serialize(property: Date): string {
        return property.toISOString();
    }

    public deserialize(value: string): Date {
        return new Date(value);
    }

    public collapseArrayWithSingleItem(): boolean {
        return false;
    }
}
