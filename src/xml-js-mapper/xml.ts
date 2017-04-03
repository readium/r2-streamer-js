import * as xmldom from "xmldom";

// import { serialize } from "./methods/serialize";

import { deserialize } from "./methods/deserialize";

import { FunctionType, IParseOptions } from "./types";

export class XML {
    public static deserialize<T>(
        objectInstance: xmldom.Document | xmldom.Element,
        objectType?: FunctionType,
        options?: IParseOptions): T {

        if (objectInstance.nodeType === 9) { // DOCUMENT_NODE
            objectInstance = (objectInstance as xmldom.Document).documentElement;
        }
        return deserialize(objectInstance as xmldom.Element, objectType, options);
    }

    // public static serialize(value: any): XmlValue {
    //     return serialize(value);
    // }
}
