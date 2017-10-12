import * as fs from "fs";

import * as debug_ from "debug";
import * as yauzl from "yauzl";
import * as yazl from "yazl";

const debug = debug_("r2:zipInjector");

enum InjectType {
    FILE,
    BUFFER,
    STREAM,
}

export function injectStreamInZip(
    destPathTMP: string,
    destPathFINAL: string,
    stream: NodeJS.ReadableStream,
    zipEntryPath: string,
    zipError: (e: any) => void,
    doneCallback: () => void) {

    injectObjectInZip(destPathTMP, destPathFINAL,
        stream, InjectType.STREAM,
        zipEntryPath, zipError, doneCallback);
}

export function injectBufferInZip(
    destPathTMP: string,
    destPathFINAL: string,
    buffer: Buffer,
    zipEntryPath: string,
    zipError: (e: any) => void,
    doneCallback: () => void) {

    injectObjectInZip(destPathTMP, destPathFINAL,
        buffer, InjectType.BUFFER,
        zipEntryPath, zipError, doneCallback);
}

export function injectFileInZip(
    destPathTMP: string,
    destPathFINAL: string,
    filePath: string,
    zipEntryPath: string,
    zipError: (e: any) => void,
    doneCallback: () => void) {

    injectObjectInZip(destPathTMP, destPathFINAL,
        filePath, InjectType.FILE,
        zipEntryPath, zipError, doneCallback);
}

function injectObjectInZip(
    destPathTMP: string,
    destPathFINAL: string,
    contentsToInject: any,
    typeOfContentsToInject: InjectType,
    zipEntryPath: string,
    zipError: (e: any) => void,
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
            } else if (entry.fileName === zipEntryPath) {
                // skip injected entry
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

            if (typeOfContentsToInject === InjectType.FILE) {
                zipfile.addFile(contentsToInject as string, zipEntryPath);

            } else if (typeOfContentsToInject === InjectType.BUFFER) {
                zipfile.addBuffer(contentsToInject as Buffer, zipEntryPath);

            } else if (typeOfContentsToInject === InjectType.STREAM) {
                zipfile.addReadStream(contentsToInject as NodeJS.ReadableStream, zipEntryPath);

            } else {
                debug("yazl FAIL to inject! (unknown type)");
            }

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
