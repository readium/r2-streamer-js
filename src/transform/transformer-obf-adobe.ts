import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";

import { ITransformer } from "./transformer";

export class TransformerObfAdobe implements ITransformer {
    public supports(_publication: Publication, link: Link): boolean {
        return link.Properties.Encrypted.Algorithm === "http://ns.adobe.com/pdf/enc#RC";
    }

    public transform(publication: Publication, _link: Link, data: Buffer): Buffer {

        let pubID = publication.Metadata.Identifier;
        pubID = pubID.replace("urn:uuid:", "");
        pubID = pubID.replace(/-/g, "");
        pubID = pubID.replace(/\s/g, "");

        const key = [];
        for (let i = 0; i < 16; i++) {
            const byteHex = pubID.substr(i * 2, 2);
            const byteNumer = parseInt(byteHex, 16);
            key.push(byteNumer);
        }

        const prefixLength = 1024;
        const zipDataPrefix = data.slice(0, prefixLength);

        for (let i = 0; i < prefixLength; i++) {
            /* tslint:disable:no-bitwise */
            zipDataPrefix[i] = zipDataPrefix[i] ^ (key[i % key.length]);
        }

        const zipDataRemainder = data.slice(prefixLength);
        return Buffer.concat([zipDataPrefix, zipDataRemainder]);
    }
}
