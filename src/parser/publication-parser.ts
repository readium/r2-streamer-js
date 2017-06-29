import * as path from "path";

import { Publication } from "@models/publication";
import { CbzParsePromise } from "@parser/cbz";
import { EpubParsePromise } from "@parser/epub";

export async function PublicationParsePromise(filePath: string): Promise<Publication> {

    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    return /\.epub[3]?$/.test(ext) ?
        EpubParsePromise(filePath) :
        CbzParsePromise(filePath);
}
