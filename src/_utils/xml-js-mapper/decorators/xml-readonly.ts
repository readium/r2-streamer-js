import { getDefinition } from "../classes/object-definition";

export function XmlReadonly() {
    return (target: any, key: string): void => {
        const property = getDefinition(target.constructor).getProperty(key);

        property.readonly = true;
    };
}
