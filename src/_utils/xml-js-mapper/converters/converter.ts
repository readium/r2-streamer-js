import { FunctionType } from "../types";
import { BufferConverter } from "./buffer-converter";
import { DateConverter } from "./date-converter";

export interface IPropertyConverter {
    serialize(property: any): string;
    deserialize(value: string): any;
}

export const propertyConverters: Map<FunctionType, IPropertyConverter> = new Map<FunctionType, IPropertyConverter>();

propertyConverters.set(Buffer, new BufferConverter());
propertyConverters.set(Date, new DateConverter());
