import { Link } from "./publication-link";

import { IMeta } from "./metadata";

export interface IPublicationCollection {
    Role: string;
    Metadata: IMeta[];
    Links: Link[];
    Children: IPublicationCollection[];
}
