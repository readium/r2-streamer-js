import { JsonStringConverter } from "@utils/ta-json-string-converter";
// https://github.com/edcarroll/ta-json
import {
    JsonConverter,
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { OPDSFacet } from "./opds2-facet";
import { OPDSGroup } from "./opds2-group";
import { OPDSLink } from "./opds2-link";
import { OPDSMetadata } from "./opds2-metadata";
import { OPDSPublication } from "./opds2-publication";

@JsonObject()
export class OPDSFeed {

    @JsonProperty("@context")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Context: string[];

    @JsonProperty("metadata")
    public Metadata: OPDSMetadata;

    @JsonProperty("links")
    @JsonElementType(OPDSLink)
    public Links: OPDSLink[];

    @JsonProperty("publications")
    @JsonElementType(OPDSPublication)
    public Publications: OPDSPublication[];

    @JsonProperty("navigation")
    @JsonElementType(OPDSLink)
    public Navigation: OPDSLink[];

    @JsonProperty("facets")
    @JsonElementType(OPDSFacet)
    public Facets: OPDSFacet[];

    @JsonProperty("groups")
    @JsonElementType(OPDSGroup)
    public Groups: OPDSGroup[];

    public findFirstLinkByRel(rel: string): OPDSLink | undefined {

        return this.Links ? this.Links.find((l) => {
            return l.HasRel(rel);
        }) : undefined;
    }

    public AddLink(href: string, rel: string, typeLink: string, templated: boolean) {
        const l = new OPDSLink();
        l.Href = href;
        l.AddRel(rel);
        l.TypeLink = typeLink;
        if (templated) {
            l.Templated = true;
        }
        if (!this.Links) {
            this.Links = [];
        }
        this.Links.push(l);
    }

    public AddNavigation(title: string, href: string, rel: string, typeLink: string) {
        const l = new OPDSLink();
        l.Href = href;
        l.TypeLink = typeLink;
        l.AddRel(rel);
        if (title) {
            l.Title = title;
        }
        if (!this.Navigation) {
            this.Navigation = [];
        }
        this.Navigation.push(l);
    }

    public AddPagination(
        numberItems: number, itemsPerPage: number, currentPage: number,
        nextLink: string, prevLink: string,
        firstLink: string, lastLink: string) {

        if (!this.Metadata) {
            this.Metadata = new OPDSMetadata();
        }
        this.Metadata.CurrentPage = currentPage;
        this.Metadata.ItemsPerPage = itemsPerPage;
        this.Metadata.NumberOfItems = numberItems;

        if (nextLink) {
            this.AddLink(nextLink, "next", "application/opds+json", false);
        }
        if (prevLink) {
            this.AddLink(prevLink, "previous", "application/opds+json", false);
        }
        if (firstLink) {
            this.AddLink(firstLink, "first", "application/opds+json", false);
        }
        if (lastLink) {
            this.AddLink(lastLink, "last", "application/opds+json", false);
        }
    }

    public AddFacet(link: OPDSLink, group: string) {

        if (this.Facets) {
            const found = this.Facets.find((f) => {
                if (f.Metadata && f.Metadata.Title === group) {
                    if (!f.Links) {
                        f.Links = [];
                    }
                    f.Links.push(link);
                    return true;
                }
                return false;
            });
            if (found) {
                return;
            }
        }

        const facet = new OPDSFacet();

        facet.Metadata = new OPDSMetadata();
        facet.Metadata.Title = group;

        facet.Links = [];
        facet.Links.push(link);

        if (!this.Facets) {
            this.Facets = [];
        }
        this.Facets.push(facet);
    }

    public AddPublicationInGroup(publication: OPDSPublication, collLink: OPDSLink) {

        if (this.Groups) {
            const found1 = this.Groups.find((g) => {
                if (g.Links) {
                    const found2 = g.Links.find((l) => {

                        if (l.Href === collLink.Href) {
                            if (!g.Publications) {
                                g.Publications = [];
                            }
                            g.Publications.push(publication);
                            return true;
                        }
                        return false;
                    });
                    if (found2) {
                        return true;
                    }
                }
                return false;
            });

            if (found1) {
                return;
            }
        }

        const group = new OPDSGroup();
        group.Metadata = new OPDSMetadata();
        group.Metadata.Title = collLink.Title;

        group.Publications = [];
        group.Publications.push(publication);

        const linkSelf = new OPDSLink();
        linkSelf.AddRel("self");
        linkSelf.Title = collLink.Title;
        linkSelf.Href = collLink.Href;

        group.Links = [];
        group.Links.push(linkSelf);

        if (!this.Groups) {
            this.Groups = [];
        }
        this.Groups.push(group);
    }

    public AddNavigationInGroup(link: OPDSLink, collLink: OPDSLink) {

        if (this.Groups) {
            const found1 = this.Groups.find((g) => {
                if (g.Links) {
                    const found2 = g.Links.find((l) => {

                        if (l.Href === collLink.Href) {
                            if (!g.Navigation) {
                                g.Navigation = [];
                            }
                            g.Navigation.push(link);
                            return true;
                        }
                        return false;
                    });
                    if (found2) {
                        return true;
                    }
                }
                return false;
            });

            if (found1) {
                return;
            }
        }

        const group = new OPDSGroup();
        group.Metadata = new OPDSMetadata();
        group.Metadata.Title = collLink.Title;

        group.Navigation = [];
        group.Navigation.push(link);

        const linkSelf = new OPDSLink();
        linkSelf.AddRel("self");
        linkSelf.Title = collLink.Title;
        linkSelf.Href = collLink.Href;

        group.Links = [];
        group.Links.push(link);

        if (!this.Groups) {
            this.Groups = [];
        }
        this.Groups.push(group);
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("OPDS2Feed.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("OPDS2Feed.Links is not set!");
        }
    }
}
