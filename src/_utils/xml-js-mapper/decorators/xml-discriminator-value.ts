import { getDefinition } from "../classes/object-definition";
import { FunctionType } from "../types";

export function XmlDiscriminatorValue(value: any) {
    return (objectType: FunctionType): void => {
        getDefinition(objectType).discriminatorValue = value;
    };
}
