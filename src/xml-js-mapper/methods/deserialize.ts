import * as xpath from "xpath";

import { IDynamicObject, IParseOptions } from "../types";

import { getTypedInheritanceChain, objectDefinitions } from "../classes/object-definition";

import { PropertyDefinition } from "../classes/property-definition";

import { propertyConverters } from "../converters/converter";

import { FunctionType, IXmlNamespaces } from "../types";

export function deserialize(
    objectInstance: Node,
    objectType: FunctionType | undefined,
    options: IParseOptions = { runConstructor: false }): any {

    // if (objectInstance && objectInstance.constructor === Array) {
    //     return (objectInstance as IXmlValueArray).map((o) => deserializeRootObject(o, objectType, options));
    // }

    return deserializeRootObject(objectInstance, objectType, options);
}

function deserializeRootObject(
    objectInstance: Node,
    objectType: FunctionType = Object,
    options: IParseOptions): any {

    if (!objectDefinitions.has(objectType)) {
        return undefined;
    }

    const [objectType2, ...superTypes] = getTypedInheritanceChain(objectType, objectInstance);

    const output = Object.create(objectType2.prototype);

    const definitions = [...superTypes.reverse(), objectType2].map((t) => objectDefinitions.get(t));

    definitions.forEach((d) => {
        if (!d) {
            return;
        }

        if (options.runConstructor) {
            d.ctr.call(output);
        }

        d.beforeDeserialized.call(output);

        d.properties.forEach((p, key) => {
            if (!p.objectType) {
                throw new Error(`Cannot deserialize property "${key}" without type!`);
            }

            if (p.readonly) {
                return;
            }

            const namespaces: IXmlNamespaces = {};
            if (d.namespaces) {
                for (const prop in d.namespaces) {
                    if (d.namespaces.hasOwnProperty(prop)) {
                        namespaces[prop] = d.namespaces[prop];
                    }
                }
            }
            if (p.namespaces) {
                for (const prop in p.namespaces) {
                    if (p.namespaces.hasOwnProperty(prop)) {
                        namespaces[prop] = p.namespaces[prop];
                    }
                }
            }
            // console.log(namespaces);
            const select = xpath.useNamespaces(namespaces);

            const xPathSelected = select(p.xpathSelector, objectInstance);
            if (xPathSelected && xPathSelected.length) {
                const xpathMatched = Array<Node>();

                // console.log("XPATH MATCH: " + p.xpathSelector
                //     + " == " + (xPathSelected instanceof Array)
                //     + " -- " + xPathSelected.length);

                if (!(xPathSelected instanceof Array)) {
                    xpathMatched.push(xPathSelected);
                } else {
                    xPathSelected.forEach((item: Node) => {
                        // console.log(item.nodeValue || item.localName);
                        xpathMatched.push(item);
                    });
                }

                if (p.array || p.set) {
                    output[key] = Array<IDynamicObject>();
                    xpathMatched.forEach((item) => {
                        output[key].push(deserializeObject(item, p, options));
                    });

                    if (p.set) {
                        output[key] = new Set(output[key]);
                    }
                    return;
                }

                output[key] = deserializeObject(xpathMatched[0], p, options);
            } else {
                // console.log("XPATH NO MATCH: " + p.xpathSelector);
                return;
            }
        });

        d.onDeserialized.call(output);
    });

    return output;
}

function deserializeObject(
    objectInstance: Node,
    definition: PropertyDefinition,
    options: IParseOptions): IDynamicObject {

    const primitive = definition.objectType === String
        || definition.objectType === Boolean
        || definition.objectType === Number;

    const value: any =
        // objectInstance.nodeValue;
        objectInstance.nodeType === 3 ? // TEXT_NODE
            (objectInstance as Text).data :
            (objectInstance.nodeType === 2 ? // ATTRIBUTE_NODE
                (objectInstance as Attr).value :
                (objectInstance.nodeType === 1 ? // ELEMENT_NODE
                    (objectInstance as Element).localName :
                    objectInstance.nodeValue));

    const converter = definition.converter || propertyConverters.get(definition.objectType);
    if (converter) {
        return converter.deserialize(value);
    }

    if (!primitive) {
        const objDefinition = objectDefinitions.get(definition.objectType);

        if (objDefinition) {
            return deserialize(objectInstance, definition.objectType);
        }
    }

    return value;
}
