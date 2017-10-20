import * as fs from "fs";

import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import { injectBufferInZip } from "@r2-streamer-js/_utils/zip/zipInjector";
import { Publication } from "@r2-streamer-js/models/publication";
import { LCP } from "@r2-streamer-js/parser/epub/lcp";
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

        // private void registerDevice(final DoneCallback doneCallback_registerDevice) {

        //             String deviceID = m_deviceIDManager.getDeviceID();
        //             String deviceNAME = m_deviceIDManager.getDeviceNAME();

        //             boolean doRegister = false;
        //             if (m_statusDocument_LINK_REGISTER == null) {
        //                 doRegister = false;
        //             } else if (m_statusDocument_STATUS.equals("ready")) {
        //                 doRegister = true;
        //             } else if (m_statusDocument_STATUS.equals("active")) {

        //                 String deviceIDForStatusDoc = m_deviceIDManager.checkDeviceID(m_statusDocument_ID);

        //                 if (deviceIDForStatusDoc == null) {
        //                     doRegister = true;
        //                 } else if (!deviceIDForStatusDoc.equals(deviceID)) {
            // // this should really never happen ... but let's ensure anyway.
        //                     doRegister = true;
        //                 }
        //             }

        //             if (!doRegister) {
        //                 doneCallback_registerDevice.Done(false);
        //                 return;
        //             }
        //             String url = m_statusDocument_LINK_REGISTER.m_href;
        //             if (m_statusDocument_LINK_REGISTER.m_templated.equals("true")) {

        //     // URLEncoder.encode() doesn't generate %20 for space character (instead: '+')
        //     // So we use android.net.Uri's appendQueryParameter() instead (see below)
        //     //        try {
        //     //            deviceID = URLEncoder.encode(deviceID, "UTF-8");
        //     //            deviceNAME = URLEncoder.encode(deviceNAME, "UTF-8");
        //     //        } catch (Exception ex) {
        //     //            // noop
        //     //        }
        //     //        url = url.replace("{?id,name}", "?id=" + deviceID + "&name=" + deviceNAME);

        //                 url = url.replace("{?id,name}", ""); // TODO: smarter regexp?
        //                 url = Uri.parse(url).buildUpon()
        //                         .appendQueryParameter("id", deviceID)
        //                         .appendQueryParameter("name", deviceNAME)
        //                         .build().toString();
        //             }

        //             Locale currentLocale = getCurrentLocale();
        //             String langCode = currentLocale.toString().replace('_', '-');
        //             langCode = langCode + ",en-US;q=0.7,en;q=0.5";

        //             Future<Response<InputStream>> request = Ion.with(m_context)
        //                     .load("POST", url)
        //                     .setLogging("Readium Ion", Log.VERBOSE)

        //                     //.setTimeout(AsyncHttpRequest.DEFAULT_TIMEOUT) //30000
        //                     .setTimeout(6000)

        //                     // TODO: comment this in production! (this is only for testing a local HTTP server)
        //                     //.setHeader("X-Add-Delay", "2s")

        //                     // LCP / LSD server with message localization
        //                     .setHeader("Accept-Language", langCode)

        //     // QUERY params (templated URI)
        //     //                        .setBodyParameter("id", dID)
        //     //                        .setBodyParameter("name", dNAME)

        //                     .asInputStream()
        //                     .withResponse()

        //                     // UI thread
        //                     .setCallback(new FutureCallback<Response<InputStream>>() {
        //                         @Override
        //                         public void onCompleted(Exception e, Response<InputStream> response) {

        //                             InputStream inputStream = response != null ? response.getResult() : null;
        //                             int httpResponseCode = response != null ? response.getHeaders().code() : 0;
        //                             if (e != null || inputStream == null
        //                                     || httpResponseCode < 200 || httpResponseCode >= 300) {

        //                                 doneCallback_registerDevice.Done(false);
        //                                 return;
        //                             }

        //                             try {

        //                                 StringWriter writer = new StringWriter();
        //                                 IOUtils.copy(inputStream, writer, "UTF-8");
        //                                 String json = writer.toString().trim();

        //                                 boolean okay = parseStatusDocumentJson(json);

        //                                 if (okay && m_statusDocument_STATUS.equals("active")) {
        //                                     m_deviceIDManager.recordDeviceID(m_statusDocument_ID);
        //                                 }

        //                                 doneCallback_registerDevice.Done(true);

        //                             } catch (Exception ex) {
        //                                 ex.printStackTrace();
        //                                 doneCallback_registerDevice.Done(false);
        //                             } finally {
        //                                 try {
        //                                     inputStream.close();
        //                                 } catch (IOException ex) {
        //                                     ex.printStackTrace();
        //                                     // ignore
        //                                 }
        //                             }
        //                         }
        //                     });
        //         }
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
