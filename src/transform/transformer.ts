import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";
import { IStreamAndLength } from "@utils/zip/zip";

import { TransformerLCP } from "./transformer-lcp";
import { TransformerObfAdobe } from "./transformer-obf-adobe";
import { TransformerObfIDPF } from "./transformer-obf-idpf";

export interface ITransformer {
    supports(publication: Publication, link: Link): boolean;

    transformStream(
        publication: Publication, link: Link,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number): Promise<IStreamAndLength>;
    // getDecryptedSizeStream(
    //     publication: Publication, link: Link,
    //     stream: IStreamAndLength): Promise<number>;

    // transformBuffer(publication: Publication, link: Link, data: Buffer): Promise<Buffer>;
    // getDecryptedSizeBuffer(publication: Publication, link: Link, data: Buffer): Promise<number>;
}

export class Transformers {

    public static instance(): Transformers {
        return Transformers._instance;
    }

    // public static async tryBuffer(publication: Publication, link: Link, data: Buffer): Promise<Buffer> {
    //     return Transformers.instance()._tryBuffer(publication, link, data);
    // }

    public static async tryStream(
        publication: Publication, link: Link,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number): Promise<IStreamAndLength> {
        return Transformers.instance()._tryStream(
            publication, link,
            stream,
            isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
    }

    private static _instance: Transformers = new Transformers();

    private transformers: ITransformer[];

    constructor() {
        this.transformers = [];
    }

    public add(transformer: ITransformer) {
        if (this.transformers.indexOf(transformer) < 0) {
            this.transformers.push(transformer);
        }
    }

    // private async _tryBuffer(publication: Publication, link: Link, data: Buffer): Promise<Buffer> {
    //     let transformedData: Promise<Buffer> | undefined;
    //     const transformer = this.transformers.find((t) => {
    //         if (!t.supports(publication, link)) {
    //             return false;
    //         }
    //         transformedData = t.transformBuffer(publication, link, data);
    //         if (transformedData) {
    //             return true;
    //         }
    //         return false;
    //     });
    //     if (transformer && transformedData) {
    //         return transformedData;
    //     }
    //     return Promise.reject("transformers fail (buffer)");
    // }

    private async _tryStream(
        publication: Publication, link: Link,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number, partialByteEnd: number): Promise<IStreamAndLength> {
        let transformedData: Promise<IStreamAndLength> | undefined;
        const transformer = this.transformers.find((t) => {
            if (!t.supports(publication, link)) {
                return false;
            }
            transformedData = t.transformStream(
                publication, link,
                stream,
                isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
            if (transformedData) {
                return true;
            }
            return false;
        });
        if (transformer && transformedData) {
            return transformedData;
        }
        return Promise.reject("transformers fail (stream)");
    }
}

Transformers.instance().add(new TransformerObfAdobe());
Transformers.instance().add(new TransformerObfIDPF());
Transformers.instance().add(new TransformerLCP());
