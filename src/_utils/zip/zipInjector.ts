import * as fs from "fs";

import * as debug_ from "debug";
import * as yauzl from "yauzl";
import * as yazl from "yazl";

const debug = debug_("r2:zipInjector");

export function injectInZip(
    destPathTMP: string,
    destPathFINAL: string,
    filePath: string,
    zipEntryPath: string,
    zipError: any,
    doneCallback: () => void) {

    yauzl.open(destPathTMP, { lazyEntries: true, autoClose: false }, (err: any, zip: any) => {
        if (err) {
            debug("yauzl init ERROR");
            zipError(err);
            return;
        }

        const zipfile = new yazl.ZipFile();

        zip.on("error", (erro: any) => {
            debug("yauzl ERROR");
            zipError(erro);
        });

        zip.readEntry(); // next (lazyEntries)
        zip.on("entry", (entry: any) => {
            // if (/\/$/.test(entry.fileName)) {
            if (entry.fileName[entry.fileName.length - 1] === "/") {
                // skip directories / folders
            } else {
                // debug(entry.fileName);
                // debug(entry);
                zip.openReadStream(entry, (errz: any, stream: NodeJS.ReadableStream) => {
                    if (err) {
                        debug("yauzl openReadStream ERROR");
                        debug(errz);
                        zipError(errz);
                        return;
                    }
                    // entry.uncompressedSize
                    const compress = entry.fileName !== "mimetype";
                    zipfile.addReadStream(stream, entry.fileName, { compress });
                });
            }
            zip.readEntry(); // next (lazyEntries)
        });

        zip.on("end", () => {
            debug("yauzl END");
            zipfile.addFile(filePath, zipEntryPath);
            zipfile.end();

            const destStream2 = fs.createWriteStream(destPathFINAL);
            zipfile.outputStream.pipe(destStream2);
            // response.on("end", () => {
            // });
            destStream2.on("finish", () => {
                doneCallback();
            });
            destStream2.on("error", (ere: any) => {
                zipError(ere);
            });
        });

        zip.on("close", () => {
            debug("yauzl CLOSE");
        });
    });
}
