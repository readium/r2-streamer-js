import * as xpath from "xpath";

import { ObjectDefinition, getTypedInheritanceChain, objectDefinitions } from "../classes/object-definition";
import { PropertyDefinition } from "../classes/property-definition";
import { propertyConverters } from "../converters/converter";
import { IDynamicObject, IParseOptions } from "../types";
import { FunctionType, IXPathSelectorItem } from "../types";

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

    // // tslint:disable-next-line:no-string-literal
    // const debug = process.env["OPF_PARSE"] === "true";

    if (!objectDefinitions.has(objectType)) {
        return undefined;
    }

    const [objectType2, ...superTypes] = getTypedInheritanceChain(objectType, objectInstance);

    const output = Object.create(objectType2.prototype);

    const definitions = [...superTypes.reverse(), objectType2]
        .map((t) => objectDefinitions.get(t))
        .filter((t) => !!t) as ObjectDefinition[];

    definitions.forEach((d) => {
        if (!d) {
            return;
        }

        if (options.runConstructor) {
            d.ctr.call(output);
        }

        d.beforeDeserialized.call(output);

        // if (debug) {
        //     console.log("======== PROPS: " + objectInstance.localName);
        // }

        d.properties.forEach((p, key) => {
            if (!p.objectType) {
                throw new Error(`Cannot deserialize property "${key}" without type!`);
            }

            if (p.readonly) {
                return;
            }

            // const namespaces: IXmlNamespaces = {};
            // if (d.namespaces) {
            //     for (const prop in d.namespaces) {
            //         if (d.namespaces.hasOwnProperty(prop)) {
            //             namespaces[prop] = d.namespaces[prop];
            //         }
            //     }
            // }
            // if (p.namespaces) {
            //     for (const prop in p.namespaces) {
            //         if (p.namespaces.hasOwnProperty(prop)) {
            //             namespaces[prop] = p.namespaces[prop];
            //         }
            //     }
            // }

            // if (debug) {
            //     console.log(`${p.xpathSelector}`);
            // }

            if (p.xpathSelectorParsed) {

                const xpathMatched: Node[] = [];

                let currentNodes = [objectInstance];

                p.xpathSelectorParsed.forEach((item: IXPathSelectorItem, index: number) => {
                    const nextCurrentNodes: Node[] = [];

                    currentNodes.forEach((currentNode) => {

                        if (item.isText) {
                            let textNode = currentNode.firstChild;
                            if (currentNode.childNodes && currentNode.childNodes.length) {
                                for (let i = 0; i < currentNode.childNodes.length; i++) {
                                    const childNode = currentNode.childNodes.item(i);
                                    if (childNode.nodeType === 3) { // TEXT_NODE
                                        textNode = childNode;
                                        break;
                                    }
                                }
                            }
                            if (textNode) {
                                xpathMatched.push(textNode);
                            }
                        } else if (item.isAttribute) {
                            if (currentNode.attributes) {

                                const attr = item.namespaceUri ?
                                    currentNode.attributes.getNamedItemNS(item.namespaceUri, item.localName) :
                                    currentNode.attributes.getNamedItem(item.localName);

                                if (attr) {
                                    xpathMatched.push(attr);
                                }
                            }
                        } else {
                            if (currentNode.childNodes && currentNode.childNodes.length) {
                                for (let i = 0; i < currentNode.childNodes.length; i++) {
                                    const childNode = currentNode.childNodes.item(i);
                                    if (childNode.nodeType !== 1) { // ELEMENT_NODE
                                        continue;
                                    }
                                    if (childNode.localName !== item.localName) {
                                        continue;
                                    }
                                    if (item.namespaceUri && item.namespaceUri !== childNode.namespaceURI) {
                                        continue;
                                    }

                                    nextCurrentNodes.push(childNode);
                                }
                            }
                        }
                    });

                    currentNodes = nextCurrentNodes;

                    if (index === p.xpathSelectorParsed.length - 1) {
                        currentNodes.forEach((node) => {
                            xpathMatched.push(node);
                        });
                    }
                });

                // // CHECKING ...
                // const select = xpath.useNamespaces(p.namespaces || {});
                // const xPathSelected = select(p.xpathSelector, objectInstance);
                // if (xPathSelected && xPathSelected.length) {
                //     const xpathMatchedCheck: Node[] = [];
                //     if (!(xPathSelected instanceof Array)) {
                //         xpathMatchedCheck.push(xPathSelected);
                //     } else {
                //         xPathSelected.forEach((item: Node) => {
                //             // console.log(item.nodeValue || item.localName);
                //             xpathMatchedCheck.push(item);
                //         });
                //     }
                //     if (!xpathMatched || !xpathMatched.length) {
                //         console.log("########################## XPATH NO MATCH 1 !!!!!!");
                //         console.log(p.xpathSelector);
                //     } else if (xpathMatchedCheck.length !== xpathMatched.length) {
                //         console.log("########################## XPATH NO MATCH 2 !!!!!!");
                //     } else {
                //         xpathMatchedCheck.forEach((item: Node, index: number) => {
                //             if (item !== xpathMatched[index]) {
                //                 console.log("########################## XPATH NO MATCH 3 !!!!!!");
                //             }
                //         });
                //     }
                // } else {
                //     if (xpathMatched && xpathMatched.length) {
                //         console.log("########################## XPATH NO MATCH 4 !!!!!!");
                //     }
                // }

                if (xpathMatched && xpathMatched.length) {

                    if (p.array || p.set) {
                        output[key] = []; // Array<IDynamicObject>();
                        xpathMatched.forEach((item) => {
                            output[key].push(deserializeObject(item, p, options));
                        });

                        if (p.set) {
                            output[key] = new Set(output[key]);
                        }
                        return;
                    }

                    output[key] = deserializeObject(xpathMatched[0], p, options);
                }
            } else {
                // console.log("########### USING XPATH!");
                // console.log(`${p.xpathSelector}`);

                // const timeBegin = process.hrtime();
                // console.log(namespaces);
                // console.log(p.xpathSelector);
                const select = xpath.useNamespaces(p.namespaces || {});
                const xPathSelected = select(p.xpathSelector, objectInstance) as Node[];

                if (xPathSelected && xPathSelected.length) {

                    // const timeElapsed = process.hrtime(timeBegin);
                    // if (debug) {
                    //     console.log(`=-------- ${timeElapsed[0]} seconds + ${timeElapsed[1]} nanoseconds`);
                    // }
                    // if (timeElapsed[0] > 1) {
                    //     process.exit(1);
                    // }

                    const xpathMatched: Node[] = [];

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
                        output[key] = []; // Array<IDynamicObject>();
                        xpathMatched.forEach((item) => {
                            output[key].push(deserializeObject(item, p, options));
                        });

                        if (p.set) {
                            output[key] = new Set(output[key]);
                        }
                        return;
                    }

                    output[key] = deserializeObject(xpathMatched[0], p, options);
                }
            }
        });

        d.onDeserialized.call(output);
    });

    return output;
}

function deserializeObject(
    objectInstance: Node,
    definition: PropertyDefinition,
    _options: IParseOptions): IDynamicObject {

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
