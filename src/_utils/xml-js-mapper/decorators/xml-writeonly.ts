import { getDefinition } from "../classes/object-definition";

export function XmlWriteonly() {
    return (target: any, key: string): void => {
        const property = getDefinition(target.constructor).getProperty(key);

        property.writeonly = true;
    };
}
