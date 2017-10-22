import * as crypto from "crypto";
import * as debug_ from "debug";

import { Server } from "@r2-streamer-js/http/server";
import { ipcMain } from "electron";

import { R2_EVENT_TRY_LCP_PASS, R2_EVENT_TRY_LCP_PASS_RES } from "../common/events";

const debug = debug_("r2:electron:main:lcp");

export function installLcpHandler(_publicationsServer: Server) {

    ipcMain.on(R2_EVENT_TRY_LCP_PASS, async (
        event: any,
        publicationFilePath: string,
        lcpPass: string,
        isSha256Hex: boolean) => {

        // debug(publicationFilePath);
        // debug(lcpPass);
        let okay = false;
        try {
            okay = await tryLcpPass(publicationFilePath, lcpPass, isSha256Hex);
        } catch (err) {
            debug(err);
            okay = false;
        }

        let passSha256Hex: string | undefined;
        if (okay) {
            if (isSha256Hex) {
                passSha256Hex = lcpPass;
            } else {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(lcpPass);
                passSha256Hex = checkSum.digest("hex");
                // const lcpPass64 = new Buffer(hash).toString("base64");
                // const lcpPassHex = new Buffer(lcpPass64, "base64").toString("utf8");
            }
        }

        event.sender.send(R2_EVENT_TRY_LCP_PASS_RES,
            okay,
            (okay ? "Correct." : "Please try again."),
            passSha256Hex ? passSha256Hex : "xxx",
        );
    });

    async function tryLcpPass(publicationFilePath: string, lcpPass: string, isSha256Hex: boolean): Promise<boolean> {
        const publication = _publicationsServer.cachedPublication(publicationFilePath);
        if (!publication) {
            return false;
        }

        let lcpPassHex: string | undefined;

        if (isSha256Hex) {
            lcpPassHex = lcpPass;
        } else {
            const checkSum = crypto.createHash("sha256");
            checkSum.update(lcpPass);
            lcpPassHex = checkSum.digest("hex");
            // const lcpPass64 = new Buffer(hash).toString("base64");
            // const lcpPassHex = new Buffer(lcpPass64, "base64").toString("utf8");
        }

        const okay = await publication.LCP.setUserPassphrase(lcpPassHex);
        if (!okay) {
            debug("FAIL publication.LCP.setUserPassphrase()");
        }
        return okay;
    }
}
