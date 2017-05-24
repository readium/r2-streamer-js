import { isHTTP } from "../http/UrlUtils";
import { IZip } from "./zip";
import { Zip1 } from "./zip1";
import { Zip2 } from "./zip2";

export async function zipLoadPromise(filePath: string): Promise<IZip> {
    if (isHTTP(filePath)) {
        return Zip2.loadPromise(filePath);
    }
    return Zip1.loadPromise(filePath);
}
