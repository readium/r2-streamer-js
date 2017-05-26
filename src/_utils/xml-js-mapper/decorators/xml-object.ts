import { getDefinition } from "../classes/object-definition";
import { FunctionType, IXmlNamespaces } from "../types";

export function XmlObject(namespaces?: IXmlNamespaces) {
    return (objectType: FunctionType): void => {

        // console.log("########################## XmlObject NS");
        // console.log(objectType);
        const def = getDefinition(objectType);
        // console.log(def);
        if (namespaces) {
            def.namespaces = namespaces;
            // console.log(namespaces);
        }
        if (def.namespaces && def.properties) {
            def.properties.forEach((propDef) => {
                if (def.namespaces) { // redundant ... TypeScript compile check :(
                    for (const prop in def.namespaces) {
                        if (def.namespaces.hasOwnProperty(prop)) {
                            if (!propDef.namespaces || !propDef.namespaces[prop]) {
                                if (!propDef.namespaces) {
                                    propDef.namespaces = {};
                                }
                                propDef.namespaces[prop] = def.namespaces[prop];
                            }
                        }
                    }
                    if (propDef.xpathSelectorParsed) {
                        propDef.xpathSelectorParsed.forEach((xp) => {
                            if (xp.namespacePrefix && !xp.namespaceUri) {
                                xp.namespaceUri = propDef.namespaces ?
                                    propDef.namespaces[xp.namespacePrefix] :
                                    undefined;
                                // console.log("+++ " + xp.namespaceUri);
                            }
                        });
                    }
                }
            });
        }
        // if (def.properties) {
        //     def.properties.forEach((propDef) => {
        //         console.log(propDef.xpathSelectorParsed);
        //     });
        // }
    };
}
