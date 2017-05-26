import { getDefinition } from "../classes/object-definition";
import { IPropertyConverter } from "../converters/converter";
import { IParameterlessConstructor } from "../types";

export function XmlConverter(converter: IPropertyConverter | IParameterlessConstructor<IPropertyConverter>) {
    return (target: any, key: string): void => {
        const property = getDefinition(target.constructor).getProperty(key);

        if (typeof converter === "function") {
            property.converter = new converter();
        } else {
            property.converter = converter;
        }
    };
}
