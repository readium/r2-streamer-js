import * as fs from "fs";

import { Publication } from "@models/publication";
import { LCP } from "@parser/epub/lcp";
import { streamToBufferPromise } from "@utils/stream/BufferUtils";
import { injectBufferInZip } from "@utils/zip/zipInjector";
import * as debug_ from "debug";
import * as moment from "moment";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { JSON as TAJSON } from "ta-json";

const debug = debug_("r2:lsd");

export interface IDeviceIDManager {
    getDeviceNAME(): string;

    getDeviceID(): string;

    checkDeviceID(key: string): string;

    recordDeviceID(key: string): void;
}

export async function launchStatusDocumentProcessing(
    publication: Publication,
    publicationPath: string,
    _deviceIDManager: IDeviceIDManager,
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
        onStatusDocumentProcessingComplete();
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
            onStatusDocumentProcessingComplete();
            return;
        }
        if (!responseData) {
            onStatusDocumentProcessingComplete();
            return;
        }
        const responseStr = responseData.toString("utf8");
        debug(responseStr);
        const responseJson = global.JSON.parse(responseStr);
        debug(responseJson);

        // debug(responseJson.id);
        // debug(responseJson.status); // revoked, returned, cancelled, expired
        // debug(responseJson.message);
        // if (responseJson.updated) {
        //     debug(responseJson.updated.license);
        //     debug(responseJson.updated.status);
        // }
        // if (responseJson.links) {
        //     responseJson.links.forEach((link: any) => {
        //         debug(link.rel); // license, register, return, renew
        //         debug(link.href);
        //         debug(link.type);
        //         debug(link.templated);
        //         debug(link.title);
        //         debug(link.profile);
        //     });
        // }
        // if (responseJson.potential_rights) {
        //     debug(responseJson.potential_rights.end);
        // }
        // if (responseJson.events) {
        //     responseJson.events.forEach((event: any) => {
        //         debug(event.type);
        //         debug(event.name);
        //         debug(event.timestamp); // ISO 8601 time and date
        //         debug(event.id);
        //     });
        // }

        if (responseJson.updated && responseJson.updated.license &&
            (publication.LCP.Updated || publication.LCP.Issued)) {
            const updatedLicenseLSD = moment(responseJson.updated.license);
            const updatedLicense = moment(publication.LCP.Updated || publication.LCP.Issued);
            const forceUpdate = false;
            if (forceUpdate || updatedLicense.isBefore(updatedLicenseLSD)) {
                debug("LSD license updating...");
                if (responseJson.links) {
                    const licenseLink = responseJson.links.find((link: any) => {
                        return link.rel === "license";
                    });
                    if (!licenseLink) {
                        debug("LSD license link is missing.");
                        onStatusDocumentProcessingComplete();
                        return;
                    }
                    await fetchAndInjectUpdatedLicense(publication, publicationPath,
                        licenseLink.href, onStatusDocumentProcessingComplete);
                    return;
                }
            }
        }
        onStatusDocumentProcessingComplete();
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

async function fetchAndInjectUpdatedLicense(
    publication: Publication,
    publicationPath: string,
    href: string,
    onStatusDocumentProcessingComplete: () => void) {

    debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + href);

    const failure = (err: any) => {
        debug(err);
        onStatusDocumentProcessingComplete();
    };

    const success = async (response: request.RequestResponse) => {
        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
            if (href.indexOf("/licenses/") > 0) {
                const newHref = href.replace("/licenses/", "/api/v1/purchases/license/");
                debug("TRYING AGAIN: " + newHref);
                await fetchAndInjectUpdatedLicense(publication, publicationPath,
                        newHref, onStatusDocumentProcessingComplete);
            } else {
                failure("HTTP CODE " + response.statusCode);
            }
            return;
        }

        let responseData: Buffer | undefined;
        try {
            responseData = await streamToBufferPromise(response);
        } catch (err) {
            debug(err);
            onStatusDocumentProcessingComplete();
            return;
        }
        if (!responseData) {
            onStatusDocumentProcessingComplete();
            return;
        }
        const lcplStr = responseData.toString("utf8");
        debug(lcplStr);

        const zipEntryPath = "META-INF/license.lcpl";

        let lcpl: LCP | undefined;
        try {
            const lcplJson = global.JSON.parse(lcplStr);
            debug(lcplJson);
            lcpl = TAJSON.deserialize<LCP>(lcplJson, LCP);
        } catch (erorz) {
            debug(erorz);
            onStatusDocumentProcessingComplete();
            return;
        }
        if (!lcpl) {
            onStatusDocumentProcessingComplete();
            return;
        }
        lcpl.ZipPath = zipEntryPath;
        lcpl.JsonSource = lcplStr;
        lcpl.init();
        publication.LCP = lcpl;
        // publication.AddLink("application/vnd.readium.lcp.license-1.0+json", ["license"],
        //     lcpl.ZipPath, false);

        const newPublicationPath = publicationPath + ".new";
        injectBufferInZip(publicationPath, newPublicationPath, responseData, zipEntryPath,
            (err) => {
                debug(err);
                onStatusDocumentProcessingComplete();
            },
            () => {
                debug("EPUB license.lcpl injected.");

                setTimeout(() => {
                    fs.unlinkSync(publicationPath);
                    setTimeout(() => {
                        fs.renameSync(newPublicationPath, publicationPath);
                        onStatusDocumentProcessingComplete();
                    }, 500);
                }, 500);
            });
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
            uri: href,
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
                uri: href,
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
