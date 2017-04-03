import "reflect-metadata";

import { getDefinition } from "../classes/object-definition";

import { FunctionType, IXmlNamespaces } from "../types";

export function XmlXPathSelector(selector: string, namespaces?: IXmlNamespaces) {
    return (target: any, key: string): void => {
        const objectType = Reflect.getMetadata("design:type", target, key);

        const property = getDefinition(target.constructor).getProperty(key);
        property.xpathSelector = selector;
        if (namespaces) {
            property.namespaces = namespaces;
        }
        property.array = objectType === Array;
        property.set = objectType === Set;
        if (!property.array && !property.set && !property.objectType) {
            property.objectType = objectType;
        }
    };
}
