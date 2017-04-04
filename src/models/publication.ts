// https://github.com/edcarroll/ta-json
import {
    JsonElementType,
    JsonObject,
    JsonProperty,
    OnDeserialized,
} from "ta-json";

import { Link } from "./publication-link";

import { IMeta, Metadata } from "./metadata";

import { MediaOverlayNode } from "./media-overlay";

interface IInternal {
    Name: string;
    Value: any;
}

interface IPublicationCollection {
    Role: string;
    Metadata: IMeta[];
    Links: Link[];
    Children: IPublicationCollection[];
}

@JsonObject()
export class Publication {

    @JsonProperty("@context")
    @JsonElementType(String)
    public Context: string[];

    @JsonProperty("metadata")
    public Metadata: Metadata;

    @JsonProperty("links")
    @JsonElementType(Link)
    public Links: Link[];

    @JsonProperty("spine")
    @JsonElementType(Link)
    public Spine: Link[];

    @JsonProperty("resources")
    @JsonElementType(Link)
    public Resources: Link[];

    @JsonProperty("toc")
    @JsonElementType(Link)
    public TOC: Link[];

    @JsonProperty("page-list")
    @JsonElementType(Link)
    public PageList: Link[];

    @JsonProperty("landmarks")
    @JsonElementType(Link)
    public Landmarks: Link[];

    @JsonProperty("loi")
    @JsonElementType(Link)
    public LOI: Link[];

    @JsonProperty("loa")
    @JsonElementType(Link)
    public LOA: Link[];

    @JsonProperty("lov")
    @JsonElementType(Link)
    public LOV: Link[];

    @JsonProperty("lot")
    @JsonElementType(Link)
    public LOT: Link[];

    public OtherLinks: Link[];
    public OtherCollections: IPublicationCollection[];

    public Internal: IInternal[];

    public findFromInternal(key: string): IInternal | undefined {
        if (this.Internal) {
            const found = this.Internal.find((internal) => {
                return internal.Name === key;
            });
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    public AddToInternal(key: string, value: any) {
        if (!this.Internal) {
            this.Internal = Array<IInternal>();
        }

        let internal: IInternal;
        internal = { Name: key, Value: value };

        this.Internal.push(internal);
    }

    public findLinKByHref(href: string): Link | undefined {
        if (this.Spine) {
            const ll = this.Spine.find((link) => {
                if (link.Href && href.indexOf(link.Href) >= 0) {
                    return true;
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }
        return undefined;
    }

    public GetCover(): Link | undefined {
        return this.searchLinkByRel("cover");
    }

    public GetNavDoc(): Link | undefined {
        return this.searchLinkByRel("contents");
    }

    public searchLinkByRel(rel: string): Link | undefined {
        if (this.Resources) {
            const ll = this.Resources.find((link) => {
                if (link.Rel) {
                    const rr = link.Rel.find((r) => {
                        if (r === rel) {
                            return true;
                        }
                        return false;
                    });
                    if (rr) {
                        return true;
                    }
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        if (this.Spine) {
            const ll = this.Spine.find((link) => {
                if (link.Rel) {
                    const rr = link.Rel.find((r) => {
                        if (r === rel) {
                            return true;
                        }
                        return false;
                    });
                    if (rr) {
                        return true;
                    }
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        if (this.Links) {
            const ll = this.Links.find((link) => {
                if (link.Rel) {
                    const rr = link.Rel.find((r) => {
                        if (r === rel) {
                            return true;
                        }
                        return false;
                    });
                    if (rr) {
                        return true;
                    }
                }
                return false;
            });
            if (ll) {
                return ll;
            }
        }

        return undefined;
    }

    public AddLink(typeLink: string, rel: string[], url: string, templated: boolean) {
        const link = new Link();
        link.Rel = rel;
        link.Href = url;
        link.TypeLink = typeLink;

        link.Templated = templated;

        if (!this.Links) {
            this.Links = Array<Link>();
        }
        this.Links.push(link);
    }

    public FindAllMediaOverlay(): MediaOverlayNode[] {
        const mos = Array<MediaOverlayNode>();

        if (this.Spine) {
            this.Spine.forEach((link) => {
                if (link.MediaOverlays) {
                    link.MediaOverlays.forEach((mo) => {
                        mos.push(mo);
                    });
                }
            });
        }

        return mos;
    }

    public FindMediaOverlayByHref(href: string): MediaOverlayNode[] {
        const mos = Array<MediaOverlayNode>();

        if (this.Spine) {
            this.Spine.forEach((link) => {
                if (link.MediaOverlays && link.Href.indexOf(href) >= 0) {
                    link.MediaOverlays.forEach((mo) => {
                        mos.push(mo);
                    });
                }
            });
        }

        return mos;
    }

    public GetPreFetchResources(): Link[] {
        const links = Array<Link>();

        if (this.Resources) {
            const mediaTypes = ["text/css", "application/vnd.ms-opentype", "text/javascript"];

            this.Resources.forEach((link) => {
                mediaTypes.forEach((mediaType) => {
                    if (link.TypeLink === mediaType) {
                        links.push(link);
                    }
                });
            });
        }

        return links;
    }

    @OnDeserialized()
    private _OnDeserialized() {
        if (!this.Metadata) {
            console.log("Publication.Metadata is not set!");
        }
        if (!this.Links) {
            console.log("Publication.Links is not set!");
        }
        if (!this.Spine) {
            console.log("Publication.Spine is not set!");
        }
    }
}
