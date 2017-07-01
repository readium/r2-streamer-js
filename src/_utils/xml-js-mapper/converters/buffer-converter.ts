import { IPropertyConverter } from "./converter";

export class BufferConverter implements IPropertyConverter {
    private encoding: string = "utf8";

    // constructor(encoding: string = "json") {
    //     this.encoding = encoding;
    // }

    public serialize(property: Buffer): string {
        // if (this.encoding === "json") {
        //     return property.toJSON();
        // }
        return property.toString(this.encoding);
    }

    public deserialize(value: string): Buffer {
        // if (this.encoding === "json") {
        //     return Buffer.from((value as any).data);
        // }
        return Buffer.from(value as string, this.encoding);
    }

    public collapseArrayWithSingleItem(): boolean {
        return false;
    }
}
