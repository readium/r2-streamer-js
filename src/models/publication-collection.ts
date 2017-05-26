import { IMeta } from "./metadata";
import { Link } from "./publication-link";

export interface IPublicationCollection {
    Role: string;
    Metadata: IMeta[];
    Links: Link[];
    Children: IPublicationCollection[];
}
