import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import { injectBufferInZip } from "@r2-streamer-js/_utils/zip/zipInjector";
import { Publication } from "@r2-streamer-js/models/publication";
import { LCP } from "@r2-streamer-js/parser/epub/lcp";
import * as debug_ from "debug";
import * as fs from "fs";
import * as moment from "moment";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { JSON as TAJSON } from "ta-json";
import { IDeviceIDManager } from "./lsd-deviceid-manager";

import URITemplate = require("urijs/src/URITemplate");

// import URI = require("urijs");

const debug = debug_("r2:electron:main:lsd");

async function tryRegister(
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

async function fetchAndInjectUpdatedLicense(
    publication: Publication,
    publicationPath: string,
    href: string,
    onStatusDocumentProcessingComplete: () => void) {

    debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + href);

    const failure = (err: any) => {
        debug(err);
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
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
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
        }
        if (!lcpl) {
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
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
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete();
                }
            },
            () => {
                debug("EPUB license.lcpl injected.");

                setTimeout(() => {
                    fs.unlinkSync(publicationPath);
                    setTimeout(() => {
                        fs.renameSync(newPublicationPath, publicationPath);
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete();
                        }
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
