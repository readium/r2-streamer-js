import { OPDS } from "./opds1/opds";
import { OPDSFeed } from "./opds2/opds2";
import { OPDSBelongsTo } from "./opds2/opds2-belongsTo";
import { OPDSCollection } from "./opds2/opds2-collection";
import { OPDSContributor } from "./opds2/opds2-contributor";
import { OPDSIndirectAcquisition } from "./opds2/opds2-indirectAcquisition";
import { OPDSLink } from "./opds2/opds2-link";
import { OPDSMetadata } from "./opds2/opds2-metadata";
import { OPDSPrice } from "./opds2/opds2-price";
import { OPDSProperties } from "./opds2/opds2-properties";
import { OPDSPublication } from "./opds2/opds2-publication";
import { OPDSPublicationMetadata } from "./opds2/opds2-publicationMetadata";
import { OPDSSubject } from "./opds2/opds2-subject";

// https://github.com/opds-community/opds-revision
export function convertOpds1ToOpds2(feed: OPDS): OPDSFeed {
    const opds2feed = new OPDSFeed();

    opds2feed.Metadata = new OPDSMetadata();
    opds2feed.Metadata.Title = feed.Title;
    opds2feed.Metadata.Modified = feed.Updated;
    if (feed.OpensearchTotalResults) {
        opds2feed.Metadata.NumberOfItems = feed.OpensearchTotalResults;
    }
    if (feed.OpensearchItemsPerPage) {
        opds2feed.Metadata.ItemsPerPage = feed.OpensearchItemsPerPage;
    }
    if (feed.Authors) {
        feed.Authors.forEach((aut) => {

            const cont = new OPDSContributor();
            cont.Name = aut.Name;
            cont.Identifier = aut.Uri;
            if (!opds2feed.Metadata.Author) {
                opds2feed.Metadata.Author = [];
            }
            opds2feed.Metadata.Author.push(cont);
        });
    }
    if (feed.Entries) {
        feed.Entries.forEach((entry) => {
            let isAnNavigation = true;
            const collLink = new OPDSLink();

            if (entry.Links) {
                entry.Links.forEach((l) => {

                    if (l.HasRel("http://opds-spec.org/acquisition")) {
                        isAnNavigation = false;
                    }
                    if (l.HasRel("collection") || l.HasRel("http://opds-spec.org/group")) {
                        collLink.AddRel("collection");
                        collLink.Href = l.Href;
                        collLink.Title = l.Title;
                    }
                });
            }

            if (!isAnNavigation) {
                const p = new OPDSPublication();
                p.Metadata = new OPDSPublicationMetadata();
                p.Metadata.Title = entry.Title;
                if (entry.DcIdentifier) {
                    p.Metadata.Identifier = entry.DcIdentifier;
                } else {
                    p.Metadata.Identifier = entry.Id;
                }
                p.Metadata.Language = [entry.DcLanguage];
                p.Metadata.Modified = entry.Updated;
                p.Metadata.PublicationDate = entry.Published;
                p.Metadata.Rights = entry.DcRights;
                if (entry.Series) {
                    entry.Series.forEach((s) => {
                        const coll = new OPDSCollection();
                        coll.Name = s.Name;
                        coll.Position = s.Position;
                        const link = new OPDSLink();
                        link.Href = s.Url;
                        coll.Links = [];
                        coll.Links.push(link);

                        if (!p.Metadata.BelongsTo) {
                            p.Metadata.BelongsTo = new OPDSBelongsTo();
                        }
                        if (!p.Metadata.BelongsTo.Series) {
                            p.Metadata.BelongsTo.Series = [];
                        }
                        p.Metadata.BelongsTo.Series.push(coll);
                    });
                }
                if (entry.DcPublisher) {
                    const c = new OPDSContributor();
                    c.Name = entry.DcPublisher;
                    if (!p.Metadata.Publisher) {
                        p.Metadata.Publisher = [];
                    }
                    p.Metadata.Publisher.push(c);
                }

                if (entry.Categories) {
                    entry.Categories.forEach((cat) => {
                        const subj = new OPDSSubject();
                        subj.Code = cat.Term;
                        subj.Name = cat.Label;
                        subj.Scheme = cat.Scheme;
                        if (!p.Metadata.Subject) {
                            p.Metadata.Subject = [];
                        }
                        p.Metadata.Subject.push(subj);
                    });
                }
                if (entry.Authors) {
                    entry.Authors.forEach((aut) => {

                        const cont = new OPDSContributor();
                        cont.Name = aut.Name;
                        cont.Identifier = aut.Uri;
                        if (!p.Metadata.Author) {
                            p.Metadata.Author = [];
                        }
                        p.Metadata.Author.push(cont);
                    });
                }

                if (entry.Content) {
                    p.Metadata.Description = entry.Content;
                } else if (entry.Summary) {
                    p.Metadata.Description = entry.Summary;
                }

                if (entry.Links) {
                    entry.Links.forEach((link) => {
                        const l = new OPDSLink();
                        l.Href = link.Href;
                        l.TypeLink = link.Type;
                        l.AddRel(link.Rel);
                        l.Title = link.Title;

                        if (link.OpdsIndirectAcquisitions && link.OpdsIndirectAcquisitions.length) {
                            if (!l.Properties) {
                                l.Properties = new OPDSProperties();
                            }

                            link.OpdsIndirectAcquisitions.forEach((ia) => {
                                const ind = new OPDSIndirectAcquisition();
                                ind.TypeAcquisition = ia.OpdsIndirectAcquisitionType;
                                if (ia.OpdsIndirectAcquisitions && ia.OpdsIndirectAcquisitions.length) {
                                    ia.OpdsIndirectAcquisitions.forEach((iac) => {

                                        const cia = new OPDSIndirectAcquisition();
                                        cia.TypeAcquisition = iac.OpdsIndirectAcquisitionType;
                                        if (!ind.Children) {
                                            ind.Children = [];
                                        }
                                        ind.Children.push(cia);
                                    });
                                }
                                if (!l.Properties.IndirectAcquisitions) {
                                    l.Properties.IndirectAcquisitions = [];
                                }
                                l.Properties.IndirectAcquisitions.push(ind);
                            });
                        }

                        if (link.OpdsPrice && link.OpdsPriceCurrencyCode) {
                            if (!l.Properties) {
                                l.Properties = new OPDSProperties();
                            }
                            l.Properties.Price = new OPDSPrice();
                            l.Properties.Price.Currency = link.OpdsPriceCurrencyCode;
                            l.Properties.Price.Value = link.OpdsPrice;
                        }

                        if (link.HasRel("collection") || link.HasRel("http://opds-spec.org/group")) {
                            // NOOP
                        } else if (link.HasRel("http://opds-spec.org/image") ||
                            link.HasRel("http://opds-spec.org/image/thumbnail")) {
                            if (!p.Images) {
                                p.Images = [];
                            }
                            p.Images.push(l);
                        } else {
                            if (!p.Links) {
                                p.Links = [];
                            }
                            p.Links.push(l);
                        }
                    });
                }

                if (collLink.Href) {
                    opds2feed.AddPublicationInGroup(p, collLink);
                } else {
                    if (!opds2feed.Publications) {
                        opds2feed.Publications = [];
                    }
                    opds2feed.Publications.push(p);
                }
            } else {
                const linkNav = new OPDSLink();
                linkNav.Title = entry.Title;
                if (entry.Links && entry.Links[0]) {
                    linkNav.AddRel(entry.Links[0].Rel);
                    linkNav.TypeLink = entry.Links[0].Type;
                    linkNav.Href = entry.Links[0].Href;
                }

                if (collLink.Href) {
                    opds2feed.AddNavigationInGroup(linkNav, collLink);
                } else {
                    if (!opds2feed.Navigation) {
                        opds2feed.Navigation = [];
                    }
                    opds2feed.Navigation.push(linkNav);
                }
            }
        });
    }

    if (feed.Links) {
        feed.Links.forEach((l) => {

            const linkFeed = new OPDSLink();
            linkFeed.Href = l.Href;
            linkFeed.AddRel(l.Rel);
            linkFeed.TypeLink = l.Type;
            linkFeed.Title = l.Title;

            if (l.HasRel("http://opds-spec.org/facet")) {
                linkFeed.Properties = new OPDSProperties();
                linkFeed.Properties.NumberOfItems = l.ThrCount;
                opds2feed.AddFacet(linkFeed, l.FacetGroup);
            } else {
                if (!opds2feed.Links) {
                    opds2feed.Links = [];
                }
                opds2feed.Links.push(linkFeed);
            }
        });
    }

    return opds2feed;
}
