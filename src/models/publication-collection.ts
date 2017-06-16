import { Link } from "./publication-link";

// import { IMeta } from "./metadata";

/// UNUSED at the moment, see Publication:
///// public OtherCollections: IPublicationCollection[];

export interface IPublicationCollection {
    Role: string;
    // Metadata: IMeta[];
    Links: Link[];
    Children: IPublicationCollection[];
}
