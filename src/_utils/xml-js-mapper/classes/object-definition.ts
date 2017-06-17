import { FunctionType, IXmlNamespaces } from "../types"; // IXmlValueObject
import { PropertyDefinition } from "./property-definition";

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

interface IFunctionTypeAndObjectDefinition {
    functionType: FunctionType;
    objectDefinition: ObjectDefinition;
}

function getChildObjectTypeDefinitions(parentObjectType: FunctionType): IFunctionTypeAndObjectDefinition[] {
    const childDefs: IFunctionTypeAndObjectDefinition[] = [];

    objectDefinitions.forEach((def, objectType) => {
        const superObjectType = Object.getPrototypeOf(objectType.prototype).constructor;

        if (superObjectType === parentObjectType) {
            childDefs.push({ functionType: objectType, objectDefinition: def });
        }
    });

    return childDefs;
}

export function getTypedInheritanceChain(
    objectType: FunctionType,
    objectInstance?: Node, // IXmlValueObject
): FunctionType[] {

    const parentDef = objectDefinitions.get(objectType);

    let childDefs: IFunctionTypeAndObjectDefinition[] = [];

    if (objectInstance && parentDef && parentDef.discriminatorProperty) {
        childDefs = childDefs.concat(getChildObjectTypeDefinitions(objectType));
    }

    let actualObjectType: FunctionType | undefined;

    while (childDefs.length !== 0 && !actualObjectType) {
        const ifo = childDefs.shift();
        const objectType2 = ifo ? ifo.functionType : undefined;
        const def = ifo ? ifo.objectDefinition : undefined;

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
