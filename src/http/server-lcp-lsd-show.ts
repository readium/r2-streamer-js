// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { fromBER } from "asn1js";
import * as crypto from "crypto";
import * as css2json from "css2json";
import * as debug_ from "debug";
import * as DotProp from "dot-prop";
import * as express from "express";
import ec from "js-crypto-ec";
import keyutil from "js-crypto-key-utils";
import rsa from "js-crypto-rsa";
import * as jsonMarkup from "json-markup";
import * as jsrsasign from "jsrsasign";
import * as morgan from "morgan";
import * as path from "path";
import Certificate from "pkijs/build/Certificate";
import CertificateChainValidationEngine from "pkijs/build/CertificateChainValidationEngine";
import CertificateRevocationList from "pkijs/build/CertificateRevocationList";
import { setEngine } from "pkijs/build/common";
import CryptoEngine from "pkijs/build/CryptoEngine";
import * as pvutils from "pvutils";
import * as request from "request";
import * as requestPromise from "request-promise-native";

import { Crypto as CryptoJS } from "@peculiar/webcrypto";
import * as x509 from "@peculiar/x509";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { LSD } from "@r2-lcp-js/parser/epub/lsd";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import {
    encodeURIComponent_RFC3986, ensureAbsolute, isHTTP,
} from "@r2-utils-js/_utils/http/UrlUtils";
import { sortObject, traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

import { jsonSchemaValidate } from "../utils/json-schema-validate";
import { IRequestPayloadExtension, _urlEncoded } from "./request-ext";
import { Server } from "./server";
import { trailingSlashRedirect } from "./server-trailing-slash-redirect";
import { serverRemotePub_PATH } from "./server-url";

const debug = debug_("r2:streamer#http/lcp-lsd-show");

// tslint:disable-next-line:variable-name
export const serverLCPLSD_show_PATH = "/lcp-lsd-show";

const bufferToArrayBuffer = (buf: Buffer) => {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
};
// const bufferToUint8Array = (buf: Buffer) => {
//     const ab = new ArrayBuffer(buf.length);
//     const view = new Uint8Array(ab);
//     for (let i = 0; i < buf.length; ++i) {
//         view[i] = buf[i];
//     }
//     return view;
// };

const arrayBuffersAreEqual = (buf1: ArrayBuffer, buf2: ArrayBuffer) => {
    if (buf1.byteLength !== buf2.byteLength) {
        return false;
    }
    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);
    for (let i = 0; i < view1.length; ++i) {
        if (view1[i] !== view2[i]) {
            return false;
        }
    }
    return true;
};

const DUMMY_CRL =
    `MIICrTCBljANBgkqhkiG9w0BAQQFADBnMQswCQYDVQQGEwJGUjEOMAwGA1UEBxMF
UGFyaXMxDzANBgNVBAoTBkVEUkxhYjESMBAGA1UECxMJTENQIFRlc3RzMSMwIQYD
VQQDExpFRFJMYWIgUmVhZGl1bSBMQ1AgdGVzdCBDQRcNMTcwOTI2MTM1NTE1WhcN
MjcwOTI0MTM1NTE1WjANBgkqhkiG9w0BAQQFAAOCAgEA27f50xnlaKGUdqs6u6rD
WsR75z+tZrH4J2aA5E9I/K5fNe20FftQZb6XNjVQTNvawoMW0q+Rh9dVjDnV5Cfw
ptchu738ZQr8iCOLQHvIM6wqQj7XwMqvyNaaeGMZxfRMGlx7T9DOwvtWFCc5X0ik
YGPPV19CFf1cas8x9Y3LE8GmCtX9eUrotWLKRggG+qRTCri/SlaoicfzqhViiGeL
dW8RpG/Q6ox+tLHti3fxOgZarMgMbRmUa6OTh8pnxrfnrdtD2PbwACvaEMCpNCZR
aSTMRmIxw8UUbUA/JxDIwyISGn3ZRgbFAglYzaX80rSQZr6e0bFlzHl1xZtZ0Raz
GQWP9vvfH5ESp6FsD98g//VYigatoPz/EKU4cfP+1W/Zrr4jRSBFB37rxASXPBcx
L8cerb9nnRbAEvIqxnR4e0ZkhMyqIrLUZ3Jva0fC30kdtp09/KJ22mXKBz85wUQa
7ihiSz7pov0R9hpY93fvt++idHBECRNGOeBC4wRtGxpru8ZUa0/KFOD0HXHMQDwV
cIa/72T0okStOqjIOcWflxl/eAvUXwtet9Ht3o9giSl6hAObAeleMJOB37Bq9ASf
h4w7d5he8zqfsCGjaG1OVQNWVAGxQQViWVysfcJohny4PIVAc9KkjCFa/QrkNGjr
kUiV/PFCwL66iiF666DrXLY=`;

const CA_ECDSA_PEM =
    `MIIDxDCCAqygAwIBAgIIbAdC85NXQDEwDQYJKoZIhvcNAQELBQAwTjEUMBIGA1UE
ChMLUmVhZGl1bSBMQ1AxGDAWBgNVBAsTD1JlYWRpdW0gTENQIFBLSTEcMBoGA1UE
AxMTUmVhZGl1bSBMQ1AgUm9vdCBDQTAeFw0xNjExMjkxMDAwMDJaFw00NjExMjky
MzU5NTlaMEIxEzARBgNVBAoTCmVkcmxhYi5vcmcxFzAVBgNVBAsTDmVkcmxhYi5v
cmcgTENQMRIwEAYDVQQDEwlFRFJMYWIgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB
DwAwggEKAoIBAQDLuJoDa6bdqNBDjo130aYOVweEFz//+ythWxd9BmWy4QZ4F6kf
U9oTLmgRgZ2LWa48Z4PwmNX04bZ/JeWT3ACAfHZj0JXXc+uz+evVSgiRcxw8k/JS
YMDiCpj8SgP4LVbfO7Pg+LzFBtjiHp/5KZtl3DO/caeWxfBXaxT64CEGqigpLiZ7
EaPp3/mmBAx1n1AJrvyUnJvQ17e5i75WjEnTXybuCGWZMHwtB/qatFp8E5gs52+1
gSlrJzRtE0jAA1AG6wFAb2bXoCheLRR7n3AASezbmE2oEKeJPXDxBGezz+Yqem/1
smTv16AQKo4bfwuSaBQTm8V3um5HlOmW+M5LAgMBAAGjgbEwga4wDgYDVR0PAQH/
BAQDAgGGMB0GA1UdDgQWBBTcXPyT5B+f7rC66lILK8pSXODJhzAfBgNVHSMEGDAW
gBR6reuglOgbGTVJUvMTTwm5teTdMDASBgNVHRMBAf8ECDAGAQH/AgEAMEgGA1Ud
HwRBMD8wPaA7oDmGN2h0dHA6Ly9jcmwuZWRybGFiLnRlbGVzZWMuZGUvcmwvUmVh
ZGl1bV9MQ1BfUm9vdF9DQS5jcmwwDQYJKoZIhvcNAQELBQADggEBALQcmcf1XApy
TkPPmk5noiNuIm9OR7weaU8Wi4h0KxvQnbBX5csWbb3gspDSqUTTFZb7fvuD5U3c
mnuNst8jmJ9J1h7oYkNY8PyAS0CPl9ccG890ObJ7iv4tJ5gEMI83dlFzd8rps08m
uQJNGPbzZUP4WAWAQXS6AHS+cEj+9ykml3lhm6/OpzlMl6CPjdYD8k4eAo4KJlLg
mQKygYoBiVQdl2rmUgrMWv2vLmu5lgrCXfyynobAgHGhB5K0rMtu7moOkwekh1fe
qhGRLy/wMBsZ2AZEux17m6h8ead+1Eh7qCkVtLMPj18zthimKhmAzR9UODNO8adb
28V6rdu3cxE=`;

const CA_RSA_PEM =
    `MIIFZzCCA0+gAwIBAgIJAMWdQaWkExQEMA0GCSqGSIb3DQEBCwUAMGcxCzAJBgNV
BAYTAkZSMQ4wDAYDVQQHEwVQYXJpczEPMA0GA1UEChMGRURSTGFiMRIwEAYDVQQL
EwlMQ1AgVGVzdHMxIzAhBgNVBAMTGkVEUkxhYiBSZWFkaXVtIExDUCB0ZXN0IENB
MB4XDTE2MDMyNDIyNTc1OVoXDTM4MDExODIyNTc1OVowZzELMAkGA1UEBhMCRlIx
DjAMBgNVBAcTBVBhcmlzMQ8wDQYDVQQKEwZFRFJMYWIxEjAQBgNVBAsTCUxDUCBU
ZXN0czEjMCEGA1UEAxMaRURSTGFiIFJlYWRpdW0gTENQIHRlc3QgQ0EwggIiMA0G
CSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDfxfveCISAmGDhXcZj+q6cXD3zQDr/
kRG4fnqBm1rxFN1nshI0ObSMNwcV98c3D2swewQ6qFa+4INRakrF4ObtPtiQ7Tti
/qYWf41rez/8x5M+DFeca8SIuf4Wi2u310EoplQm4JX3Qnvax7I/ivl+BtSzDY1h
4bkA9dPPrp/vGa8dh0rIYaclJ9UEW/i4jyQkry36BfGKboOMYZioqPJfOFIIiSTb
0nvHERssaS2MobWACinRRwL7Mih4mUV/v9Vhry3jN+wfxMKA+J/zcsY6p9HVgIhE
kmyDIH4/vw+mLMcUQ4YFQeIOKRBRLHYcLHOUQNNIDw2gJAK/G/rfOeW3zu/tYCpk
hT8PWrhd4zM+TdegpeFkidnNSvYFlKrojWhJisty3HuD+BXQ6ArjikIj4dCYc2BM
ZVUH50FEwl1ZpndQAySMCceOX8t6RX4jqbvhbyXjqR/Nr5SaN8G6gHemX/5LWdOa
5D8dUwOGbQjR7igLQy+4UNefjvFp8Z5/No/vLD/3Ziwau+wFjcGXs9UdpqKgIzfW
KAu77vPVb0vUvDczOU4HRx4bB3eAb4gI6meBYHKroogIpteDOfco48zhweiMGasz
HwBU4rylW/seV/2l5IunsGNRSlVtT4z5xL7kn5fcYy5ZtStJrrOKZSJWaH+3Mvmb
sgwPqlZYMNAoiwIDAQABoxYwFDASBgNVHRMBAf8ECDAGAQH/AgEAMA0GCSqGSIb3
DQEBCwUAA4ICAQCmMGGqjnIo0BgItLmKrXW8yFRncZdjLAS5fCRNO0C34vDrm9N/
y1qhoITqQ+vKVeA+M/sWzTQihPz+pyWGfvjqxdagpepPERX0ZFENMJaP5Sc8R0bL
y96Xxk7L/SnVvJ2jgRP/D7X6jQrLxQbDceFRPelE+KcrcfAQdTLO9VTJEIkr4j6L
BMDjqMcXASo+/t5fAhz3rUlo1gvhgdX+E4iJSoPwimr0pmUWFS473eS8Jrgn5meG
Pq5Kmf3Q+1hYlisIAzRARJXWJxBxeI+VLCF2c90m1MLXpET4tm2s8Ln9ePw4edGM
crwbR4nTEN+aGbPyo0yhs+smQA28B1LRnnZRyj70wHii6PN9+qtbr1S41FzKnLvO
EBU63KxOE+NiN4p8q/Gx2J+lDtNy4OKEjgNNpp9fpzEbcSdnNK1dmZTbdKFV/QqT
DQ8paH3TWX0eel/LeBHyn5W6A6B0maLRKNN98jcbqDyx2RfkEcEqvlQgEThNKH/6
2hfQ8BEAzFdevtenyjKbnHmJ861t/hAnvCbbxMrT0gzgK2+gnqTFJiON3s0SObsG
ivPak5w5wtvreFvEHCntnhIocuqc9AOFoDdQo9idB25YUzwot0NNL6pShMNXNE6F
Imaa1w7gBDc+DVRYAoJzHF+awCOgqEDEXu67GHgcrXpQ9Ts7Eq+wjNy9OQ==`;

export function serverLCPLSD_show(_server: Server, topRouter: express.Application) {

    // https://github.com/mafintosh/json-markup/blob/master/style.css
    const jsonStyle = `
.json-markup {
    line-height: 17px;
    font-size: 13px;
    font-family: monospace;
    white-space: pre;
}
.json-markup-key {
    font-weight: bold;
}
.json-markup-bool {
    color: firebrick;
}
.json-markup-string {
    color: green;
}
.json-markup-null {
    color: gray;
}
.json-markup-number {
    color: blue;
}
`;

    // tslint:disable-next-line:variable-name
    const routerLCPLSD_show = express.Router({ strict: false });
    routerLCPLSD_show.use(morgan("combined", { stream: { write: (msg: any) => debug(msg) } }));

    routerLCPLSD_show.use(trailingSlashRedirect);

    routerLCPLSD_show.get("/", (_req: express.Request, res: express.Response) => {

        let html = "<html><head>";
        html += `<script type="text/javascript">function encodeURIComponent_RFC3986(str) { ` +
            `return encodeURIComponent(str).replace(/[!'()*]/g, (c) => { ` +
            `return "%" + c.charCodeAt(0).toString(16); }); }` +
            `function go(evt) {` +
            `if (evt) { evt.preventDefault(); } var url = ` +
            `location.origin +` +
            // `location.protocol + '//' + location.hostname + ` +
            // `(location.port ? (':' + location.port) : '') + ` +
            ` '${serverLCPLSD_show_PATH}/' +` +
            ` encodeURIComponent_RFC3986(document.getElementById("url").value);` +
            `location.href = url;}</script>`;
        html += "</head>";

        html += "<body><h1>LCP / LSD examiner</h1>";

        html += `<form onsubmit="go();return false;">` +
            `<input type="text" name="url" id="url" size="80">` +
            `<input type="submit" value="Go!"></form>`;

        html += "</body></html>";

        res.status(200).send(html);
    });

    routerLCPLSD_show.param("urlEncoded", (req, _res, next, value, _name) => {
        (req as IRequestPayloadExtension).urlEncoded = value;
        next();
    });

    routerLCPLSD_show.get("/:" + _urlEncoded + "(*)", async (req: express.Request, res: express.Response) => {

        const reqparams = (req as IRequestPayloadExtension).params;

        if (!reqparams.urlEncoded) {
            reqparams.urlEncoded = (req as IRequestPayloadExtension).urlEncoded;
        }

        const urlDecoded = reqparams.urlEncoded;
        // if (urlDecoded.substr(-1) === "/") {
        //     urlDecoded = urlDecoded.substr(0, urlDecoded.length - 1);
        // }
        debug(urlDecoded);

        const isSecureHttp = req.secure ||
            req.protocol === "https" ||
            req.get("X-Forwarded-Proto") === "https"
            ;
        const rootUrl = (isSecureHttp ? "https://" : "http://")
            + req.headers.host;

        const failure = (err: any) => {
            debug(err);
            res.status(500).send("<html><body><p>Internal Server Error</p><p>"
                + err + "</p></body></html>");
        };

        const success = async (response: request.RequestResponse) => {

            // Object.keys(response.headers).forEach((header: string) => {
            //     debug(header + " => " + response.headers[header]);
            // });

            const isBadStatusCode = response.statusCode && (response.statusCode < 200 || response.statusCode >= 300);
            if (isBadStatusCode) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }

            let responseData: Buffer;
            try {
                responseData = await streamToBufferPromise(response);
            } catch (err) {
                debug(err);
                res.status(500).send("<html><body><p>Internal Server Error</p><p>" + err + "</p></body></html>");
                return;
            }
            const responseStr = responseData.toString("utf8");
            const responseJson = JSON.parse(responseStr);

            const isStatusDoc = responseJson.id &&
                responseJson.status &&
                responseJson.updated &&
                responseJson.links;

            const lcpOrLsd: LCP | LSD =
                isStatusDoc ?
                    // tslint:disable-next-line: max-line-length
                    TaJsonDeserialize<LSD>(responseJson, LSD) : // "application/vnd.readium.license.status.v1.0+json"
                    // tslint:disable-next-line: max-line-length
                    TaJsonDeserialize<LCP>(responseJson, LCP); // "application/vnd.readium.lcp.license.v1.0+json"

            const lcpOrLsdJson = TaJsonSerialize(lcpOrLsd);

            let validationStr: string | undefined;
            const doValidate = !reqparams.jsonPath || reqparams.jsonPath === "all";
            if (doValidate) {

                const jsonSchemasRootpath = path.join(process.cwd(), "misc", "json-schema");
                const jsonSchemasNames = [
                    isStatusDoc ? "lcp/status" : "lcp/license",
                    "lcp/link",
                ];
                // debug(jsonSchemasNames);

                const validationErrors =
                    jsonSchemaValidate(jsonSchemasRootpath, jsonSchemasNames, lcpOrLsdJson);
                if (validationErrors) {
                    validationStr = "";

                    for (const err of validationErrors) {

                        debug("JSON Schema validation FAIL.");
                        debug(err);

                        const val = DotProp.get(lcpOrLsdJson, err.jsonPath);
                        const valueStr = (typeof val === "string") ?
                            `${val}` :
                            ((val instanceof Array || typeof val === "object") ?
                                `${JSON.stringify(val)}` :
                                "");
                        debug(valueStr);

                        validationStr +=
                            // tslint:disable-next-line:max-line-length
                            `\n${err.ajvMessage}: ${valueStr}\n\n'${err.ajvDataPath.replace(/^\./, "")}' (${err.ajvSchemaPath})\n\n`;
                    }
                }

                let signatureVerifMessage: string | undefined;
                if (!isStatusDoc) {
                    if (!validationStr) {
                        validationStr = "<hr><hr>";
                    }
                    const lcp = lcpOrLsd as LCP;
                    const licenseSignature = lcp.Signature?.Value;
                    // "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256" => LCP 1.0 profile
                    const licenseSignatureAlgorithm = lcp.Signature?.Algorithm;
                    const licenseCertificate = lcp.Signature?.Certificate;
                    if (licenseSignature && licenseSignatureAlgorithm && licenseCertificate) {
                        const isECDSA = licenseSignatureAlgorithm === "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256";
                        debug("------ isECDSA: ", isECDSA);

                        const lcpJson = TaJsonSerialize(lcp);
                        delete lcpJson.signature;
                        const lcpCanonical = global.JSON.stringify(sortObject(lcpJson), null, "");
                        debug(lcpCanonical);

                        // const certPEM = "-----BEGIN CERTIFICATE-----\n" +
                        //     (licenseCertificate.match(   /.{0,64}/g) as RegExpMatchArray).join("\n") +
                        //     "-----END CERTIFICATE-----";

                        try {
                            // Without setEngine():
                            // TypeError: Cannot read property 'verifyWithPublicKey' of null
                            //
                            // ECDSA CertificateChainValidationEngine doesn't work
                            // with either CryptoJS or CryptoOpenSSL
                            // probably because of lack of intermediary Cert.
                            // import { Crypto as CryptoOpenSSL } from "node-webcrypto-ossl";
                            // const webcrypto = new CryptoOpenSSL();
                            const webcrypto = new CryptoJS();
                            x509.cryptoProvider.set(webcrypto);
                            setEngine(
                                "peculiar-webcrypto",
                                webcrypto,
                                new CryptoEngine({
                                    crypto: webcrypto,
                                    name: "peculiar-webcrypto-subtle",
                                    subtle: webcrypto.subtle,
                                }),
                            );

                            const b64CRL = DUMMY_CRL.replace(/\n/g, "");
                            // const x509CRL = new x509.X509Certificate(b64CRL);
                            // debug("x509CRL: ", x509CRL);
                            const certDERCRL = Buffer.from(b64CRL, "base64");
                            const certBERCRL1 = new Uint8Array(certDERCRL).buffer;
                            const certBERCRL2 = bufferToArrayBuffer(certDERCRL);
                            const certBERCRL3 = pvutils.stringToArrayBuffer(pvutils.fromBase64(b64CRL));
                            if (!arrayBuffersAreEqual(certBERCRL3, certBERCRL1) ||
                                !arrayBuffersAreEqual(certBERCRL3, certBERCRL2)) {
                                debug("####### certBERCRL DIFF?!");
                            }
                            const asn1CRL = fromBER(certBERCRL3);
                            const crl = new CertificateRevocationList({ schema: asn1CRL.result });
                            debug("crl", crl ? "" : "_"); // bypass

                            const b64ECDSA = CA_ECDSA_PEM.replace(/\n/g, "");
                            const x509ECDSA = new x509.X509Certificate(b64ECDSA);
                            debug("x509ECDSA: ", x509ECDSA);
                            debug("x509ECDSA: ", x509ECDSA.publicKey);
                            const certDERECDSA = Buffer.from(b64ECDSA, "base64");
                            const certBERECDSA1 = new Uint8Array(certDERECDSA).buffer;
                            const certBERECDSA2 = bufferToArrayBuffer(certDERECDSA);
                            const certBERECDSA3 = pvutils.stringToArrayBuffer(pvutils.fromBase64(b64ECDSA));
                            if (!arrayBuffersAreEqual(certBERECDSA3, certBERECDSA1) ||
                                !arrayBuffersAreEqual(certBERECDSA3, certBERECDSA2)) {
                                debug("####### certBERECDSA DIFF?!");
                            }
                            const asn1ECDSA = fromBER(certBERECDSA3);
                            const certificateECDSA = new Certificate({ schema: asn1ECDSA.result });
                            // debug("certificateECDSA", certificateECDSA);

                            const b64RSA = CA_RSA_PEM.replace(/\n/g, "");
                            const x509RSA = new x509.X509Certificate(b64RSA);
                            debug("x509RSA: ", x509RSA);
                            debug("x509RSA: ", x509RSA.publicKey);
                            const certDERRSA = Buffer.from(b64RSA, "base64");
                            const certBERRSA1 = new Uint8Array(certDERRSA).buffer;
                            const certBERRSA2 = bufferToArrayBuffer(certDERRSA);
                            const certBERRSA3 = pvutils.stringToArrayBuffer(pvutils.fromBase64(b64RSA));
                            if (!arrayBuffersAreEqual(certBERRSA3, certBERRSA1) ||
                                !arrayBuffersAreEqual(certBERRSA3, certBERRSA2)) {
                                debug("####### certBERRSA DIFF?!");
                            }
                            const asn1RSA = fromBER(certBERRSA3);
                            const certificateRSA = new Certificate({ schema: asn1RSA.result });
                            // debug("certificateRSA", certificateRSA);

                            const certificateCA = isECDSA ? certificateECDSA : certificateRSA;

                            // tslint:disable-next-line: max-line-length
                            // http://127.0.0.1:3000/lcp-lsd-show/https://front-test.edrlab.org/api/v1/licenses/26f9c160-295d-41b0-80d3-430e63b42d4b
                            // tslint:disable-next-line: max-line-length
                            // http://127.0.0.1:3000/lcp-lsd-show/https%3A%2F%2Fwww.cantook.net%2Fapi%2Flcp%2F0cabbb4d-98d5-4faf-9545-f137dc80b0b5

                            const x509Cert = new x509.X509Certificate(licenseCertificate);
                            debug("x509Cert: ", x509Cert);
                            debug("x509Cert: ", x509Cert.publicKey);
                            const certDER = Buffer.from(licenseCertificate, "base64");
                            const certBER1 = new Uint8Array(certDER).buffer;
                            const certBER2 = bufferToArrayBuffer(certDER);
                            const certBER3 = pvutils.stringToArrayBuffer(pvutils.fromBase64(licenseCertificate));
                            if (!arrayBuffersAreEqual(certBER3, certBER1) ||
                                !arrayBuffersAreEqual(certBER3, certBER2)) {
                                debug("####### certBER DIFF?!");
                            }
                            const asn1 = fromBER(certBER3);
                            const certificate = new Certificate({ schema: asn1.result });
                            // debug("certificate", certificate);

                            const certs: Certificate[] = [];
                            // certs.push(...certificateIntermediates);
                            certs.push(certificateCA);
                            certs.push(certificate);

                            const trustedCerts: Certificate[] = [];
                            trustedCerts.push(certificateCA);

                            const certChainVerificationEngine = new CertificateChainValidationEngine({
                                certs,
                                crls: crl ? [] : [crl], // bypass
                                trustedCerts,
                            });

                            certChainVerificationEngine.verify().then(
                                (value) => {
                                    debug("certificate verify chain", value);
                                },
                                (reason) => {
                                    debug("certificate verify chain", reason);
                                });

                            let certificateVerified: boolean;
                            try {
                                certificateVerified = await new Promise((resolve, reject) => {
                                    certificate.verify(certificateCA).then(
                                        (value) => {
                                            debug("certificate verify", value);
                                            resolve(value);
                                        },
                                        (reason) => {
                                            debug("certificate verify", reason);
                                            reject(reason);
                                        });
                                });
                            } catch (err) {
                                certificateVerified = false;
                                signatureVerifMessage = err;
                            }

                            if (certificateVerified) {

                                // const pem =
                                // "-----BEGIN CERTIFICATE-----\n" +
                                // (isECDSA ? CA_ECDSA_PEM : CA_RSA_PEM) +
                                // "\n-----END CERTIFICATE-----";
                                const pem = "-----BEGIN CERTIFICATE-----\n" + licenseCertificate + "\n-----END CERTIFICATE-----";

                                const pk = crypto.createPublicKey(pem).export({
                                    format: "pem",
                                    type: "spki", // 'pkcs1' | 'spki' | 'pkcs8' | 'sec1'
                                });
                                debug(pk);

                                debug(lcpCanonical);
                                debug(licenseSignature);
                                const hex_ = Buffer.from(licenseSignature, "base64").toString("hex");

                                if (!isECDSA) {
                                    const xCert = new jsrsasign.X509();
                                    xCert.readCertPEM(pem);
                                    debug(xCert.getInfo());
                                    const publicKey = xCert.getPublicKey();
                                    debug(publicKey);
                                    const publicKey_ = jsrsasign.KEYUTIL.getKey(pk as string);
                                    debug(publicKey_);

                                    const alg = isECDSA ? "SHA256withECDSA" : "SHA256withRSA";
                                    const sig = new jsrsasign.KJUR.crypto.Signature({ alg });
                                    sig.setAlgAndProvider(alg, "cryptojs/jsrsa");
                                    sig.init(publicKey);
                                    sig.updateString(lcpCanonical);
                                    const hex = jsrsasign.b64utohex(licenseSignature);
                                    debug(hex);
                                    if (hex_ !== hex) {
                                        debug("HEX DIFF??!!");
                                    }
                                    // jsrsasign does not support secp521r1 ECDSA P-521 signature
                                    const sigValid = sig.verify(hex);
                                    debug(sigValid);
                                }

                                // debug(crypto.getCiphers());
                                // debug(crypto.getHashes());
                                const alg_ = isECDSA ? "sha256" : "RSA-SHA256";
                                const cryptoVerify = crypto.createVerify(alg_);
                                cryptoVerify.update(lcpCanonical, "utf8");
                                cryptoVerify.end();
                                const sigValid_ = cryptoVerify.verify(crypto.createPublicKey(pem), hex_, "hex");
                                debug(sigValid_);

                                const publicJwk = new keyutil.Key("pem", pk);
                                debug(publicJwk);
                                const jwk = await publicJwk.jwk as JsonWebKey;
                                debug(jwk);

                                // const pk = crypto.createPublicKey(pem).export({
                                //     format: "der",
                                //     type: "spki", // 'pkcs1' | 'spki' | 'pkcs8' | 'sec1'
                                // });
                                // const publicJwk = new keyutil.Key("der", pk);

                                let valid = false;
                                if (!isECDSA) {
                                    const sigValidz = await rsa.verify(
                                        Buffer.from(lcpCanonical, "utf8"),
                                        // bufferToUint8Array(Buffer.from(lcpCanonical, "utf8")),
                                        Buffer.from(licenseSignature, "base64"),
                                        // bufferToUint8Array(Buffer.from(licenseSignature, "base64")),
                                        jwk,
                                        "SHA-256",
                                        {
                                            name: "RSASSA-PKCS1-v1_5", // 'RSA-PSS'
                                        },
                                    );
                                    debug(sigValidz);
                                    valid = sigValidz;
                                } else {
                                    const sigValidzz = await ec.verify(
                                        Buffer.from(lcpCanonical, "utf8"),
                                        // bufferToUint8Array(Buffer.from(lcpCanonical, "utf8")),
                                        Buffer.from(licenseSignature, "base64"),
                                        // bufferToUint8Array(Buffer.from(licenseSignature, "base64")),
                                        jwk,
                                        "SHA-256",
                                        "raw", // "der"
                                    );
                                    debug(sigValidzz);
                                    valid = sigValidzz;
                                }

                                signatureVerifMessage = valid ?
                                    "License Signature OK" : "License Signature INVALID";
                            }

                            // import * as forge from "node-forge";
                            //     const certDER = forge.util.decode64(licenseCertificate);
                            //     // debug(forge.util.bytesToHex(certDER));
                            //     const certAsn1 = forge.asn1.fromDer(certDER);
                            //     debug(certAsn1);
                            //     if ((forge.asn1 as any).prettyPrint) { // not TS typed
                            //         (forge.asn1 as any).prettyPrint(certAsn1);
                            //     }
                            //     // NO ECDSA support https://github.com/digitalbazaar/forge/issues/532
                            //     // const cert = forge.pki.certificateFromPem(certPEM);
                            //     const cert = forge.pki.certificateFromAsn1(certAsn1);
                            //     // const certPEM = forge.pki.certificateToPem(cert);
                            //     // debug(certPEM);
                            //     debug(cert.publicKey);
                            //     debug(cert.privateKey);
                            //     forge.pki.publicKeyToPem(cert.publicKey);
                        } catch (err) {
                            debug("err?!", err);
                            signatureVerifMessage = err && toString ? err.toString() : err.message;
                        }
                        validationStr += signatureVerifMessage;
                        validationStr += "<hr><hr>";
                    }
                }
            }

            const funk = (obj: any) => {
                if ((obj.href && typeof obj.href === "string") ||
                    (obj.Href && typeof obj.Href === "string")) {

                    let fullHref = obj.href ? obj.href as string : obj.Href as string;

                    const isDataUrl = /^data:/.test(fullHref);
                    const isMailUrl = /^mailto:/.test(fullHref);
                    const notFull = !isDataUrl && !isMailUrl && !isHTTP(fullHref);
                    if (notFull) {
                        fullHref = ensureAbsolute(urlDecoded, fullHref);
                    }

                    if ((obj.type === "application/vnd.readium.license.status.v1.0+json" && obj.rel === "status") ||
                        (obj.type === "application/vnd.readium.lcp.license.v1.0+json" && obj.rel === "license")) {

                        obj.__href__ = rootUrl + req.originalUrl.substr(0,
                            req.originalUrl.indexOf(serverLCPLSD_show_PATH + "/")) +
                            serverLCPLSD_show_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

                    } else if (obj.type === "application/epub+zip" && obj.rel === "publication") {

                        obj.__href__ = rootUrl + req.originalUrl.substr(0,
                            req.originalUrl.indexOf(serverLCPLSD_show_PATH + "/")) +
                            serverRemotePub_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

                    } else if (isDataUrl) {
                        // obj.href = obj.href.substr(0, 100) + "(...)";
                        // obj.__href__ = rootUrl + req.originalUrl.substr(0,
                        //     req.originalUrl.indexOf(serverLCPLSD_show_PATH + "/")) +
                        //     serverLCPLSD_dataUrl_PATH + "/" + encodeURIComponent_RFC3986(fullHref);

                    } else if (notFull && !isMailUrl) {
                        obj.__href__ = fullHref;
                    }
                }
            };
            traverseJsonObjects(lcpOrLsdJson, funk);

            const css = css2json(jsonStyle);
            const jsonPretty = jsonMarkup(lcpOrLsdJson, css);

            res.status(200).send("<html><body>" +
                "<h1>" +
                (isStatusDoc ? "LSD" : "LCP") +
                " JSON" + "</h1>" +
                "<h2><a href=\"" + urlDecoded + "\">" + urlDecoded + "</a></h2>" +
                "<hr>" +
                "<div style=\"overflow-x: auto;margin:0;padding:0;width:100%;height:auto;\">" +
                jsonPretty + "</div>" +
                // tslint:disable-next-line:max-line-length
                (doValidate ? (validationStr ? ("<hr><p><pre>" + validationStr + "</pre></p>") : ("<hr><p>JSON SCHEMA OK.</p>")) : "") +
                // "<p><pre>" + jsonPretty + "</pre></p>" +
                // "<hr><p><pre>" + jsonStr + "</pre></p>" +
                // "<p><pre>" + dumpStr + "</pre></p>" +
                "</body></html>");
        };

        const headers = {
            "Accept": "application/json,application/xml",
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
            "User-Agent": "READIUM2",
        };

        // No response streaming! :(
        // https://github.com/request/request-promise/issues/90
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.get({
                headers,
                method: "GET",
                uri: urlDecoded,
            })
                .on("response", success)
                .on("error", failure);
        } else {
            let response: requestPromise.FullResponse;
            try {
                // tslint:disable-next-line:await-promise no-floating-promises
                response = await requestPromise({
                    headers,
                    method: "GET",
                    resolveWithFullResponse: true,
                    uri: urlDecoded,
                });
            } catch (err) {
                failure(err);
                return;
            }

            await success(response);
        }
    });

    topRouter.use(serverLCPLSD_show_PATH, routerLCPLSD_show);
}
