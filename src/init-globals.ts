import { Collection } from "@models/metadata-collection";
import { JsonCollectionConverter } from "@models/metadata-collection-json-converter";
import { Contributor } from "@models/metadata-contributor";
import { JsonContributorConverter } from "@models/metadata-contributor-json-converter";
import { OPDSCollection } from "@opds/opds2/opds2-collection";
import { JsonOPDSCollectionConverter } from "@opds/opds2/opds2-collection-json-converter";
import { JsonDateConverter } from "@utils/ta-json-date-converter";
import {
    BufferConverter as XmlBufferConverter,
    DateConverter as XmlDateConverter,
    propertyConverters as xmlConverters,
} from "@utils/xml-js-mapper";
import {
    BufferConverter as JsonBufferConverter,
    propertyConverters as jsonConverters,
} from "ta-json";

export function initGlobals() {
    jsonConverters.set(Buffer, new JsonBufferConverter());
    jsonConverters.set(Date, new JsonDateConverter());
    jsonConverters.set(Contributor, new JsonContributorConverter());
    jsonConverters.set(Collection, new JsonCollectionConverter());
    jsonConverters.set(OPDSCollection, new JsonOPDSCollectionConverter());

    xmlConverters.set(Buffer, new XmlBufferConverter());
    xmlConverters.set(Date, new XmlDateConverter());
}
