import * as StreamZip from "node-stream-zip";

export function createZipPromise(filePath: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {

        const zip = new StreamZip({
            file: filePath,
            storeEntries: true,
        });

        zip.on("error", (err: any) => {
            console.log("--ZIP: error");
            console.log(err);

            reject(err);
        });

        zip.on("entry", (entry: any) => {
            // console.log("--ZIP: entry");
            // console.log(entry.name);
        });

        zip.on("extract", (entry: any, file: any) => {
            console.log("--ZIP: extract");
            console.log(entry.name);
            console.log(file);
        });

        zip.on("ready", () => {
            // console.log("--ZIP: ready");
            // console.log(zip.entriesCount);

            // const entries = zip.entries();
            // console.log(entries);

            resolve(zip);
        });
    });
}
