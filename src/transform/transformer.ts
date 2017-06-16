import { Publication } from "@models/publication";
import { Link } from "@models/publication-link";

import { TransformerLCP } from "./transformer-lcp";
import { TransformerObfAdobe } from "./transformer-obf-adobe";
import { TransformerObfIDPF } from "./transformer-obf-idpf";

export interface ITransformer {
    supports(publication: Publication, link: Link): boolean;
    transform(publication: Publication, link: Link, data: Buffer): Buffer;
}

export class Transformers {

    public static instance(): Transformers {
        return Transformers._instance;
    }

    public static try(publication: Publication, link: Link, data: Buffer): Buffer | undefined {
        return Transformers.instance()._try(publication, link, data);
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

    private _try(publication: Publication, link: Link, data: Buffer): Buffer | undefined {
        let transformedData: Buffer | undefined;
        const transformer = this.transformers.find((t) => {
            if (!t.supports(publication, link)) {
                return false;
            }
            transformedData = t.transform(publication, link, data);
            if (transformedData) {
                return true;
            }
            return false;
        });
        if (transformer && transformedData) {
            return transformedData;
        }
        return undefined;
    }
}

Transformers.instance().add(new TransformerLCP());
Transformers.instance().add(new TransformerObfAdobe());
Transformers.instance().add(new TransformerObfIDPF());
