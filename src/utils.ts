import * as querystring from "querystring";

interface IStringKeyedObject { [key: string]: any; }

export function sortObject(obj: any): any {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sortObject(obj[i]);
        }
        return obj;
    } else if (typeof obj !== "object") {
        return obj;
    }

    const newObj: IStringKeyedObject = {};

    Object.keys(obj).sort().forEach((key) => {
        newObj[key] = sortObject(obj[key]);
    });

    return newObj;
}

export function encodeURIComponent_RFC3986(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c: string) => {
            return "%" + c.charCodeAt(0).toString(16);
        });
}

export function encodeURIComponent_RFC5987(str: string): string {
    return encodeURIComponent(str).
        replace(/['()]/g, querystring.escape). // i.e., %27 %28 %29
        replace(/\*/g, "%2A").
        // |`^
        replace(/%(?:7C|60|5E)/g, querystring.unescape);
}
