// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as express from "express";

import { mediaOverlayURLParam } from "@r2-shared-js/parser/epub";

// export const _lcpPass64 = "lcpPass64";
export const _pathBase64 = "pathBase64";
export const _asset = "asset";
export const _jsonPath = "jsonPath";
export const _urlEncoded = "urlEncoded";

export const _show = "show";

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
