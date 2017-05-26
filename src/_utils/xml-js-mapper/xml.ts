// import { serialize } from "./methods/serialize";

import { deserialize } from "./methods/deserialize";
import { FunctionType, IParseOptions } from "./types";

export class XML {
    public static deserialize<T>(
        objectInstance: Document | Element,
        objectType?: FunctionType,
        options?: IParseOptions): T {

        if (objectInstance.nodeType === 9) { // DOCUMENT_NODE
            objectInstance = (objectInstance as Document).documentElement;
        }
        return deserialize(objectInstance as Element, objectType, options);
    }

    // public static serialize(value: any): XmlValue {
    //     return serialize(value);
    // }
}
