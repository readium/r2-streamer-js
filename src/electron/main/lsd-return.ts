import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import * as debug_ from "debug";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { IDeviceIDManager } from "./lsd-deviceid-manager";

import URITemplate = require("urijs/src/URITemplate");

const debug = debug_("r2:electron:main:lsd");

export async function lsdReturn(
    lsdJson: any,
    deviceIDManager: IDeviceIDManager): Promise<any> {

    if (!lsdJson.links) {
        return Promise.reject("No LSD links!");
    }

    const licenseReturn = lsdJson.links.find((link: any) => {
        return link.rel === "return";
    });
    if (!licenseReturn) {
        return Promise.reject("No LSD return link!");
    }

    const deviceID = deviceIDManager.getDeviceID();
    const deviceNAME = deviceIDManager.getDeviceNAME();

    let returnURL = licenseReturn.href;
    if (licenseReturn.templated === true || licenseReturn.templated === "true") {
        const urlTemplate = new URITemplate(returnURL);
        returnURL = (urlTemplate as any).expand({ id: deviceID, name: deviceNAME }, { strict: true });

        // url = url.replace("{?end,id,name}", ""); // TODO: smarter regexp?
        // url = new URI(url).setQuery("id", deviceID).setQuery("name", deviceNAME).toString();
    }
    debug("RETURN: " + returnURL);

    return new Promise<any>(async (resolve, reject) => {

        const failure = (err: any) => {
            reject(err);
        };

        const success = async (response: request.RequestResponse) => {

            Object.keys(response.headers).forEach((header: string) => {
                debug(header + " => " + response.headers[header]);
            });

            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }

            let responseData: Buffer;
            try {
                responseData = await streamToBufferPromise(response);
            } catch (err) {
                reject(err);
                return;
            }
            if (!responseData) {
                return;
            }
            const responseStr = responseData.toString("utf8");
            debug(responseStr);
            const responseJson = global.JSON.parse(responseStr);
            debug(responseJson);

            resolve(responseJson);
        };

        const headers = {
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        };

        // No response streaming! :(
        // https://github.com/request/request-promise/issues/90
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.put({
                headers,
                method: "PUT",
                uri: returnURL,
            })
                .on("response", success)
                .on("error", failure);
        } else {
            let response: requestPromise.FullResponse;
            try {
                // tslint:disable-next-line:await-promise no-floating-promises
                response = await requestPromise({
                    headers,
                    method: "PUT",
                    resolveWithFullResponse: true,
                    uri: returnURL,
                });
            } catch (err) {
                failure(err);
                return;
            }

            await success(response);
        }
    });
}
