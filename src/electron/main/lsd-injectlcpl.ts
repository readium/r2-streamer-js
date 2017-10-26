import { streamToBufferPromise } from "@r2-streamer-js/_utils/stream/BufferUtils";
import { injectBufferInZip } from "@r2-streamer-js/_utils/zip/zipInjector";
import { Publication } from "@r2-streamer-js/models/publication";
import { LCP } from "@r2-streamer-js/parser/epub/lcp";
import * as debug_ from "debug";
import * as fs from "fs";
import * as request from "request";
import * as requestPromise from "request-promise-native";
import { JSON as TAJSON } from "ta-json";

const debug = debug_("r2:electron:main:lsd");

export async function fetchAndInjectUpdatedLicense(
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
