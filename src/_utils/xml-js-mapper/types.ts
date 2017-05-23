// export type XmlValuePrimitive = string | number | boolean | null;

// export interface IXmlValueObject {
//     [x: string]: XmlValue;
// }

// export interface IXmlValueArray extends Array<XmlValue> {
//     dummy?: boolean;
// }

// export type XmlValue = XmlValuePrimitive | IXmlValueObject | IXmlValueArray;

export interface IXPathSelectorItem {
    isAttribute: boolean;
    isText: boolean;
    localName: string;
    namespacePrefix: string | undefined;
    namespaceUri: string | undefined;
}

export interface IParameterlessConstructor<T> {
    name?: string;
    new (): T;
}

export interface IDynamicObject {
    constructor: FunctionType;
    [name: string]: any;
}

export interface IParseOptions {
    runConstructor?: boolean;
}

export type FunctionType = any;

export interface IXmlNamespaces {
    [ns: string]: string; // local name => namespace URI
}
