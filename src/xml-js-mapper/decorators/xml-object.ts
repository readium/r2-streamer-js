import { getDefinition } from "../classes/object-definition";

import { FunctionType, IXmlNamespaces } from "../types";

export function XmlObject(namespaces?: IXmlNamespaces) {
    return (objectType: FunctionType): void => {
        const def = getDefinition(objectType);
        if (namespaces) {
            def.namespaces = namespaces;
        }
    };
}
