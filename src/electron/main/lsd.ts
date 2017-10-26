import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import { Publication } from "@r2-streamer-js/models/publication";
import * as debug_ from "debug";
import * as moment from "moment";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { IDeviceIDManager } from "./lsd-deviceid-manager";
import { fetchAndInjectUpdatedLicense } from "./lsd-injectlcpl";
import { tryRegister } from "./lsd-register";

const debug = debug_("r2:electron:main:lsd");

export async function launchStatusDocumentProcessing(
    publication: Publication,
    publicationPath: string,
    deviceIDManager: IDeviceIDManager,
    onStatusDocumentProcessingComplete: () => void) {

    if (!publication.LCP || !publication.LCP.Links) {
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }
    const linkStatus = publication.LCP.Links.find((link) => {
        return link.Rel === "status";
    });
    if (!linkStatus) {
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }

    debug(linkStatus);

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
        const lsdJson = global.JSON.parse(responseStr);
        debug(lsdJson);

        // debug(lsdJson.id);
        // debug(lsdJson.status); // revoked, returned, cancelled, expired
        // debug(lsdJson.message);
        // if (lsdJson.updated) {
        //     debug(lsdJson.updated.license);
        //     debug(lsdJson.updated.status);
        // }
        // if (lsdJson.links) {
        //     lsdJson.links.forEach((link: any) => {
        //         debug(link.rel); // license, register, return, renew
        //         debug(link.href);
        //         debug(link.type);
        //         debug(link.templated);
        //         debug(link.title);
        //         debug(link.profile);
        //     });
        // }
        // if (lsdJson.potential_rights) {
        //     debug(lsdJson.potential_rights.end);
        // }
        // if (lsdJson.events) {
        //     lsdJson.events.forEach((event: any) => {
        //         debug(event.type);
        //         debug(event.name);
        //         debug(event.timestamp); // ISO 8601 time and date
        //         debug(event.id);
        //     });
        // }

        if (lsdJson.updated && lsdJson.updated.license &&
            (publication.LCP.Updated || publication.LCP.Issued)) {
            const updatedLicenseLSD = moment(lsdJson.updated.license);
            const updatedLicense = moment(publication.LCP.Updated || publication.LCP.Issued);
            const forceUpdate = false;
            if (forceUpdate || // just for testing!
                updatedLicense.isBefore(updatedLicenseLSD)) {
                debug("LSD license updating...");
                if (lsdJson.links) {
                    const licenseLink = lsdJson.links.find((link: any) => {
                        return link.rel === "license";
                    });
                    if (!licenseLink) {
                        debug("LSD license link is missing.");
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete();
                        }
                        return;
                    }
                    await fetchAndInjectUpdatedLicense(publication, publicationPath,
                        licenseLink.href, onStatusDocumentProcessingComplete);
                    return;
                }
            }
        }

        if (lsdJson.status === "revoked"
            || lsdJson.status === "returned"
            || lsdJson.status === "cancelled"
            || lsdJson.status === "expired") {

            debug("What?! LSD " + lsdJson.status);
            // This should really never happen,
            // as the LCP license should not even pass validation
            // due to passed end date / expired timestamp
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
        }

        await tryRegister(lsdJson, publication, publicationPath, deviceIDManager, onStatusDocumentProcessingComplete);
    };

    const headers = {
        "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
    };

    // No response streaming! :(
    // https://github.com/request/request-promise/issues/90
    const needsStreamingResponse = true;
    if (needsStreamingResponse) {
        request.get({
            headers,
            method: "GET",
            uri: linkStatus.Href,
        })
            .on("response", success)
            .on("error", failure);
    } else {
        let response: requestPromise.FullResponse | undefined;
        try {
            // tslint:disable-next-line:await-promise no-floating-promises
            response = await requestPromise({
                headers,
                method: "GET",
                resolveWithFullResponse: true,
                uri: linkStatus.Href,
            });
        } catch (err) {
            failure(err);
            return;
        }

        // To please the TypeScript compiler :(
        response = response as requestPromise.FullResponse;
        await success(response);
    }
}
