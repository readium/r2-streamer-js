import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import { Server } from "@r2-streamer-js/http/server";
import { Publication } from "@r2-streamer-js/models/publication";
import * as debug_ from "debug";
import { ipcMain } from "electron";
import * as moment from "moment";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import {
    R2_EVENT_LCP_LSD_RENEW,
    R2_EVENT_LCP_LSD_RENEW_RES,
    R2_EVENT_LCP_LSD_RETURN,
    R2_EVENT_LCP_LSD_RETURN_RES,
} from "../common/events";
import { IDeviceIDManager } from "./lsd-deviceid-manager";
import { lsdLcpUpdate, lsdLcpUpdateInject } from "./lsd-injectlcpl";
import { lsdRegister } from "./lsd-register";
import { lsdRenew } from "./lsd-renew";
import { lsdReturn } from "./lsd-return";

const debug = debug_("r2:electron:main:lsd");

export function installLsdHandler(publicationsServer: Server, deviceIDManager: IDeviceIDManager) {

    ipcMain.on(R2_EVENT_LCP_LSD_RETURN, async (event: any, publicationFilePath: string) => {

        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            event.sender.send(R2_EVENT_LCP_LSD_RETURN_RES, false, "Internal error!");
            return;
        }

        let renewResponseJson: any;
        try {
            renewResponseJson = await lsdReturn(publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            event.sender.send(R2_EVENT_LCP_LSD_RETURN_RES, true, "Returned.");
            return;
        } catch (err) {
            debug(err);
            event.sender.send(R2_EVENT_LCP_LSD_RETURN_RES, false, err);
        }
    });

    ipcMain.on(R2_EVENT_LCP_LSD_RENEW, async (event: any, publicationFilePath: string, endDateStr: string) => {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            event.sender.send(R2_EVENT_LCP_LSD_RENEW_RES, false, "Internal error!");
            return;
        }

        const endDate = endDateStr.length ? moment(endDateStr).toDate() : undefined;
        let renewResponseJson: any;
        try {
            renewResponseJson = await lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            event.sender.send(R2_EVENT_LCP_LSD_RENEW_RES, true, "Renewed.");
            return;
        } catch (err) {
            debug(err);
            event.sender.send(R2_EVENT_LCP_LSD_RENEW_RES, false, err);
        }
    });
}

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

        let responseData: Buffer;
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

        publication.LCP.LSDJson = lsdJson;

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

        let licenseUpdateResponseJson: string | undefined;
        try {
            licenseUpdateResponseJson = await lsdLcpUpdate(lsdJson, publication);
        } catch (err) {
            debug(err);
            // if (onStatusDocumentProcessingComplete) {
            //     onStatusDocumentProcessingComplete();
            // }
            // return;
        }
        if (licenseUpdateResponseJson) {
            let res: string;
            try {
                res = await lsdLcpUpdateInject(licenseUpdateResponseJson, publication, publicationPath);
                debug("EPUB SAVED: " + res);
            } catch (err) {
                debug(err);
            }
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
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

        let registerResponseJson: any;
        try {
            registerResponseJson = await lsdRegister(lsdJson, deviceIDManager);
            publication.LCP.LSDJson = registerResponseJson;
        } catch (err) {
            debug(err);
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
        request.get({
            headers,
            method: "GET",
            uri: linkStatus.Href,
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
                uri: linkStatus.Href,
            });
        } catch (err) {
            failure(err);
            return;
        }

        await success(response);
    }
}
