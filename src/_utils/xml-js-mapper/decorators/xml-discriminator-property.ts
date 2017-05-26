import { getDefinition } from "../classes/object-definition";
import { FunctionType } from "../types";

export function XmlDiscriminatorProperty(property: string) {
    return (objectType: FunctionType): void => {
        getDefinition(objectType).discriminatorProperty = property;
    };
}
