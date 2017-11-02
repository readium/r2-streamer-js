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

const debug = debug_("r2:electron:main:lsd");

export async function lsdLcpUpdateInject(
    lcplStr: string,
    publication: Publication,
    publicationPath: string): Promise<string> {

    const lcplJson = global.JSON.parse(lcplStr);
    debug(lcplJson);

    const zipEntryPath = "META-INF/license.lcpl";

    let lcpl: LCP;
    try {
        lcpl = TAJSON.deserialize<LCP>(lcplJson, LCP);
    } catch (erorz) {
        return Promise.reject(erorz);
    }
    lcpl.ZipPath = zipEntryPath;
    lcpl.JsonSource = lcplStr;
    lcpl.init();
    publication.LCP = lcpl;
    // publication.AddLink("application/vnd.readium.lcp.license-1.0+json", ["license"],
    //     lcpl.ZipPath, false);

    return new Promise<any>(async (resolve, reject) => {
        const newPublicationPath = publicationPath + ".new";
        injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath,
            (err) => {
                reject(err);
            },
            () => {
                debug("EPUB license.lcpl injected.");

                setTimeout(() => {
                    fs.unlinkSync(publicationPath);
                    setTimeout(() => {
                        fs.renameSync(newPublicationPath, publicationPath);
                        resolve(publicationPath);
                    }, 500);
                }, 500);
            });
    });
}

export async function lsdLcpUpdate(
    lsdJson: any,
    publication: Publication): Promise<string> {

    if (lsdJson.updated && lsdJson.updated.license &&
        (publication.LCP.Updated || publication.LCP.Issued)) {
        const updatedLicenseLSD = moment(lsdJson.updated.license);
        const updatedLicense = moment(publication.LCP.Updated || publication.LCP.Issued);
        const forceUpdate = false; // just for testing!
        if (forceUpdate ||
            updatedLicense.isBefore(updatedLicenseLSD)) {
            debug("LSD license updating...");
            if (lsdJson.links) {
                const licenseLink = lsdJson.links.find((link: any) => {
                    return link.rel === "license";
                });
                if (!licenseLink) {
                    return Promise.reject("LSD license link is missing.");
                }

                debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink.href);

                return new Promise<any>(async (resolve, reject) => {

                    const failure = (err: any) => {
                        reject(err);
                    };

                    const success = async (response: request.RequestResponse) => {

                        Object.keys(response.headers).forEach((header: string) => {
                            debug(header + " => " + response.headers[header]);
                        });

                        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                            if (licenseLink.href.indexOf("/licenses/") > 0) {
                                licenseLink.href = licenseLink.href.replace("/licenses/", "/api/v1/purchases/license/");
                                debug("TRYING AGAIN: " + licenseLink.href);
                                let newRes: any;
                                try {
                                    newRes = await lsdLcpUpdate(lsdJson, publication); // recursive
                                } catch (err) {
                                    failure(err);
                                    return;
                                }
                                resolve(newRes);
                            } else {
                                failure("HTTP CODE " + response.statusCode);
                            }
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
                        const lcplStr = responseData.toString("utf8");
                        debug(lcplStr);
                        resolve(lcplStr);
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
                            uri: licenseLink.href,
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
                                uri: licenseLink.href,
                            });
                        } catch (err) {
                            failure(err);
                            return;
                        }

                        await success(response);
                    }
                });
            }
        }
    }
    return Promise.reject("No LSD LCP update.");
}
