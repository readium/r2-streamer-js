import * as express from "express";

import {
    mediaOverlayURLParam,
} from "@parser/epub";

// export const _lcpPass64 = "lcpPass64";
export const _pathBase64 = "pathBase64";
export const _asset = "asset";
export const _jsonPath = "jsonPath";
export const _urlEncoded = "urlEncoded";

export const _show = "show";
export const _version = "version";

export interface IRequestPayloadExtension extends express.Request {
    lcpPass64: string;
    pathBase64: string;
    asset: string;
    jsonPath: string;
    urlEncoded: string;
    [mediaOverlayURLParam]: string;
}

export interface IRequestQueryParams {
    show: string;
    canonical: string;
    [mediaOverlayURLParam]: string;
}
