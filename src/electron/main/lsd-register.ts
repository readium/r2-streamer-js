import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import { Publication } from "@r2-streamer-js/models/publication";
import * as debug_ from "debug";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { IDeviceIDManager } from "./lsd-deviceid-manager";

import URITemplate = require("urijs/src/URITemplate");

const debug = debug_("r2:electron:main:lsd");

export async function tryRegister(
    lsdJson: any,
    _publication: Publication,
    _publicationPath: string,
    deviceIDManager: IDeviceIDManager,
    onStatusDocumentProcessingComplete: () => void) {

    if (!lsdJson.links) {
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }

    const licenseRegister = lsdJson.links.find((link: any) => {
        return link.rel === "register";
    });
    if (!licenseRegister) {
        debug("LSD register link is not available.");
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }

    const deviceID = deviceIDManager.getDeviceID();
    const deviceNAME = deviceIDManager.getDeviceNAME();

    let doRegister = false;
    if (lsdJson.status === "ready") {
        doRegister = true;
    } else if (lsdJson.status === "active") {
        const deviceIDForStatusDoc = deviceIDManager.checkDeviceID(lsdJson.id);
        if (!deviceIDForStatusDoc) {
            doRegister = true;
        } else if (deviceIDForStatusDoc !== deviceID) {
            debug("LSD registered device ID is different?");
            // this should really never happen ... but let's ensure anyway.
            doRegister = true;
        }
    }

    if (!doRegister) {
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }

    let registerURL = licenseRegister.href;
    if (licenseRegister.templated === true || licenseRegister.templated === "true") {
        const urlTemplate = new URITemplate(registerURL);
        registerURL = (urlTemplate as any).expand({ id: deviceID, name: deviceNAME }, { strict: true });

        // url = url.replace("{?id,name}", ""); // TODO: smarter regexp?
        // url = new URI(url).setQuery("id", deviceID).setQuery("name", deviceNAME).toString();

        const failure = (err: any) => {
            debug(err);
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
        };

        const success = async (response: request.RequestResponse) => {
            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }

            let responseData: Buffer | undefined;
            try {
                responseData = await streamToBufferPromise(response);
            } catch (err) {
                debug(err);
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete();
                }
                return;
            }
            if (!responseData) {
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete();
                }
                return;
            }
            const responseStr = responseData.toString("utf8");
            debug(responseStr);
            const responseJson = global.JSON.parse(responseStr);
            debug(responseJson);

            if (responseJson.status === "active") {
                deviceIDManager.recordDeviceID(responseJson.id);
            }

            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
        };

        const headers = {
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        };

        // No response streaming! :(
        // https://github.com/request/request-promise/issues/90
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.post({
                headers,
                method: "GET",
                uri: registerURL,
            })
                .on("response", success)
                .on("error", failure);
        } else {
            let response: requestPromise.FullResponse | undefined;
            try {
                // tslint:disable-next-line:await-promise no-floating-promises
                response = await requestPromise({
                    headers,
                    method: "POST",
                    resolveWithFullResponse: true,
                    uri: registerURL,
                });
            } catch (err) {
                failure(err);
                return;
            }

            // To please the TypeScript compiler :(
            response = response as requestPromise.FullResponse;
            await success(response);
        }

        return;
    }

    if (onStatusDocumentProcessingComplete) {
        onStatusDocumentProcessingComplete();
    }
}
