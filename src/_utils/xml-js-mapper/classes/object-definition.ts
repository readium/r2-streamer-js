import { PropertyDefinition } from "./property-definition";

import { FunctionType, IXmlNamespaces } from "../types"; // IXmlValueObject

export class ObjectDefinition {
    public ctr: () => void;
    public beforeDeserialized: () => void;
    public onDeserialized: () => void;
    public discriminatorProperty: string;
    public discriminatorValue: any;
    public properties: Map<string, PropertyDefinition>;
    public namespaces: IXmlNamespaces | undefined;

    constructor() {
        this.ctr = () => undefined;
        this.beforeDeserialized = () => undefined;
        this.onDeserialized = () => undefined;
        this.properties = new Map<string, PropertyDefinition>();
    }

    public getProperty(key: string) {
        let property = this.properties.get(key);
        if (!property) {
            property = new PropertyDefinition();
            this.properties.set(key, property);
        }
        return property;
    }
}

export const objectDefinitions: Map<FunctionType, ObjectDefinition> = new Map<FunctionType, ObjectDefinition>();

export function getDefinition(objectType: FunctionType): ObjectDefinition {

    let definition = objectDefinitions.get(objectType);
    if (!definition) {
        definition = new ObjectDefinition();
        objectDefinitions.set(objectType, definition);
    }
    return definition;
}

export function getInheritanceChain(objectType: object): FunctionType[] {
    if (!objectType) {
        return [];
    }
    const parent = Object.getPrototypeOf(objectType);
    return [objectType.constructor].concat(getInheritanceChain(parent));
}

function getChildObjectTypeDefinitions(parentObjectType: FunctionType): Array<[FunctionType, ObjectDefinition]> {
    const childDefs = Array<[FunctionType, ObjectDefinition]>();

    objectDefinitions.forEach((def, objectType) => {
        const superObjectType = Object.getPrototypeOf(objectType.prototype).constructor;

        if (superObjectType === parentObjectType) {
            childDefs.push([objectType, def]);
        }
    });

    return childDefs;
}

export function getTypedInheritanceChain(
    objectType: FunctionType,
    objectInstance?: Node, // IXmlValueObject
): FunctionType[] {

    const parentDef = objectDefinitions.get(objectType);

    let childDefs = Array<[FunctionType, ObjectDefinition]>();

    if (objectInstance && parentDef && parentDef.discriminatorProperty) {
        childDefs = childDefs.concat(getChildObjectTypeDefinitions(objectType));
    }

    let actualObjectType: FunctionType | undefined;

    while (childDefs.length !== 0 && !actualObjectType) {
        const arr = childDefs.shift();
        const objectType2 = arr ? arr[0] : undefined;
        const def = arr ? arr[1] : undefined;

        if (def && def.hasOwnProperty("discriminatorValue")) {
            if (objectInstance
                && parentDef
                && def.discriminatorValue === (objectInstance as any)[parentDef.discriminatorProperty]) {
                if (def.hasOwnProperty("discriminatorProperty")) {
                    return getTypedInheritanceChain(objectType2, objectInstance);
                }
                actualObjectType = objectType2;
            }
        } else {
            childDefs = childDefs.concat(getChildObjectTypeDefinitions(objectType2));
        }
    }

    if (!actualObjectType) {
        actualObjectType = objectType;
    }

    const inheritanceChain = new Set<FunctionType>(getInheritanceChain(Object.create(actualObjectType.prototype)));
    return Array.from(inheritanceChain).filter((t) => objectDefinitions.has(t));
}
