import * as querystring from "querystring";

export function isHTTP(urlOrPath: string): boolean {
    // TODO: smarter regexp
    return urlOrPath.indexOf("http") === 0;
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
