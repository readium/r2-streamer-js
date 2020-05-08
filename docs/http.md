# HTTP API

`r2-streamer-js` contains an Express server with support for the following routes:

## GET /opds2/publications.json

This route serves the list of available publications as an "OPDS 2" JSON file using the `application/opds+json` content type.

More information about the OPDS format here: https://github.com/opds-community/

The `?canonical=true` URL query string parameter can be used to generate a sorted JSON with no pretty-printing (no indentation).

## GET /opds2/publications.json/show (also redirect from /opds2)

This route serves a pretty-printed representation of the "OPDS 2" JSON, with clickable links for easy navigation / visualization (e.g. the cover image of each listed publication).

`/show` is equivalent to `/show/all`. Here is a list of available JSON "filters": Metadata = `/show/metadata`, Links = `/show/links`, Publications = `/show/publications`.

Alternatively, the `show` URL query string parameter can be used (e.g. `/opds2/publications.json?show=all`).

A JSON-Schema validation report is presented at the bottom of the page, based on the official OPDS2 schema (see `./misc/json-schema/opds/`).

## GET /pub/{PUB_ID}

`{PUB_ID}` is the base64 encoding of a local publication file (server filesystem, therefore limited to app-approved files), or of any arbitrary HTTP URL (see [remote-epub.md](remote-epub.md)).

For demonstration purposes, the deployed server apps include `wasteland-otf-obf.epub` and `childrens-literature.epub`, obtained from https://idpf.github.io/epub3-samples/samples.html / https://github.com/IDPF/epub3-samples

For testing purposes, the served HTML page contains a list of links to available online readers / Readium2 navigators.

### GET /pub/{PUB_ID}/manifest.json

This route serves the "webpub manifest" JSON file using the `application/webpub+json` content type.

The `?canonical=true` URL query string parameter can be used to generate a sorted JSON with no pretty-printing (no indentation).

### GET /pub/{PUB_ID}/manifest.json/show

This route serves a pretty-printed representation of the "webpub manifest" JSON, with clickable links for easy navigation into individual publication assets (see next route below).

`/show` is equivalent to `/show/all`. Here is a list of available JSON "filters": Cover image = `/show/cover`, Table of Contents = `/show/toc`, Metadata = `/show/metadata`, Spine = `/show/spine`, Page List = `/show/pagelist`, Landmarks = `/show/landmarks`, Links = `/show/links`, Resources = `/show/resources`, Media Overlays = `/show/mediaoverlays`.

Alternatively, the `show` URL query string parameter can be used (e.g. `/pub/{PUB_ID}/manifest.json?show=all`).

The cover image (if any) is always displayed at the top of the served HTML page.

A JSON-Schema validation report is presented at the bottom of the page, based on the official ReadiumWebPubManifest schema (see `./misc/json-schema/webpub-manifest/`).

### GET /pub/{PUB_ID}/{ASSET_PATH}

This route serves individual assets (file resources) from the publication. `{ASSET_PATH}` is relative to the root of the ebook container (e.g. EPUB zip archive), so files like `/META-INF/container.xml` can be requested.

Text files can be rendered in-page (for debugging) rather than processed by the web browser, by using the `?show=1` URL query string parameter.

### GET /pub/{PUB_ID}/media-overlay

This route serves the full EPUB3 Media Overlay SMIL data (in its JSON form) using the `application/vnd.syncnarr+json` content type. Single spine item Media Overlays can be requested using the `/media-overlay?resource={ASSET_PATH}` URL query parameter (`{ASSET_PATH}` has the same definition as in the above section).

The `?canonical=true` URL query string parameter can be used to generate a sorted JSON with no pretty-printing (no indentation).

### GET /pub/{PUB_ID}/media-overlay/show

This route serves a pretty-printed representation of the Media Overlays JSON, with clickable links for easy navigation / visualization (e.g. clipped audio files playback directly in the web browsers).

Alternatively, the `show` URL query string parameter can be used (e.g. `/pub/{PUB_ID}/media-overlay?show=1`).

Warning: large SMIL files are likely to crush performance when pretty-printing the outputed JSON.

## GET /url/ and /url/{ENCODED_URL}

This conveninent micro-service automatically redirects to the base64 route described in the above section (`/pub/{PUB_ID}`). See [remote-epub.md](remote-epub.md).

## GET /opds-v1-browse/ and /opds-v1-browse/{ENCODED_URL}

This micro-service provides a basic OPDS1 (XML/Atom) browser. See [opds.md](opds.md).

## GET /opds-v2-browse/ and /opds-v2-browse/{ENCODED_URL}

Same as above, for OPDS2 (JSON)

## GET /opds-v1-v2-convert/ and /opds-v1-v2-convert/{ENCODED_URL}

This micro-service loads an OPDS1 feed (XML/Atom), converts it to OPDS2 (JSON), and displays both in a browsable "compare" view.
