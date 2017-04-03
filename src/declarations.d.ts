// declare module "*";

declare module "mime-types";
declare module "moment";
declare module "path";
declare module "slugify";
declare module "node-stream-zip";

declare module "xpath";

/* tslint:disable:interface-name no-namespace */

// declare module "xmldom";
declare module "xmldom" {

    interface Node {
        nodeType: number;
        nodeValue: string;
        localName: string;
    }

    interface Document extends Node {
        documentElement: Element;
    }

    interface Element extends Node {
        dummy: boolean;
    }

    interface Attr extends Node {
        value: string;
    }

    interface Text extends Node {
        data: string;
    }

    const DOMParser: DOMParserStatic;
    const XMLSerializer: XMLSerializerStatic;

    interface DOMParserStatic {
        new (options?: Options): DOMParser;
    }

    interface XMLSerializerStatic {
        new (): XMLSerializer;
    }

    interface DOMParser {
        parseFromString(xmlsource: string, mimeType?: string): Document;
    }

    interface XMLSerializer {
        serializeToString(node: Node): string;
    }

    interface Options {
        locator?: any;
        errorHandler?: ErrorHandlerFunction | ErrorHandlerObject;
    }

    type ErrorHandlerFunction = (level: string, msg: any) => any;

    interface ErrorHandlerObject {
        warning?: (msg: any) => any;
        error?: (msg: any) => any;
        fatalError?: (msg: any) => any;
    }
}
