import { IPropertyConverter } from "../converters/converter";
import { FunctionType, IXPathSelectorItem, IXmlNamespaces } from "../types";

export class PropertyDefinition {
    public objectType: FunctionType | undefined;
    public array: boolean = false;
    public set: boolean = false;
    public readonly: boolean = false;
    public writeonly: boolean = false;
    public converter: IPropertyConverter | undefined;
    public xpathSelector: string;
    public xpathSelectorParsed: IXPathSelectorItem[];
    public namespaces: IXmlNamespaces | undefined;
}
