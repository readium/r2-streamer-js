# HTTP API

`readium2-streamer-js` contains an Express server with support for the following routes:

## GET /opds2/ and /opds2/publications.json

This route serves the list of available publications as an "OPDS 2" JSON file using the `application/opds+json` content type (canonical syntax, keys are recursively alphabetically sorted).
More information about the OPDS format here: https://github.com/opds-community/opds-revision

## GET /opds2/publications.json/show

This route serves a pretty-printed representation of the "OPDS 2" JSON, with clickable links for easy navigation (e.g. the cover image of each listed publication).

`/show` is equivalent to `/show/all`. Here is a list of available JSON "filters": Metadata: `/show/metadata`, Links: `/show/links`, Publications: `/show/publications`.

## GET /pub/{PUB_ID}

`{PUB_ID}` is the base64 encoding of a local publication file (server filesystem, therefore limited to app-approved files), or of any arbitrary HTTP URL (see the "Support for remote publications" section below).

For demonstration purposes, the deployed server apps include `wasteland-otf-obf.epub` and `childrens-literature.epub`, obtained from https://idpf.github.io/epub3-samples/samples.html / https://github.com/IDPF/epub3-samples

### GET /pub/{PUB_ID}/manifest.json

This route serves the "webpub manifest" JSON file using the `application/webpub+json` content type (canonical syntax, keys are recursively alphabetically sorted).

### GET /pub/{PUB_ID}/manifest.json/show

This route serves a pretty-printed representation of the "webpub manifest" JSON, with clickable links for easy navigation into individual publication assets (see next route below).

`/show` is equivalent to `/show/all`. Here is a list of available JSON "filters": Cover image: `/show/cover`, Table of Contents: `/show/toc`, Metadata: `/show/metadata`, Spine: `/show/spine`, Page List: `/show/pagelist`, Landmarks: `/show/landmarks`, Links: `/show/links`, Resources: `/show/resources`, Media Overlays: `/show/mediaoverlays`.

### GET /pub/{PUB_ID}/{ASSET_PATH}

This route serves individual assets (file resources) from the publication archive. `{ASSET_PATH}` is relative to the root of the publication container (e.g. EPUB zip archive), so files like `/META-INF/container.xml` can be requested.

Text files can be rendered in-page (for debugging) rather than processed by the web browser, by using the `?show=1` URL query string parameter.

### GET /pub/{PUB_ID}/media-overlay

This route serves the full EPUB3 Media Overlay SMIL data (in its JSON form) using the `application/vnd.readium.mo+json` content type. Single spine item Media Overlays can be requested using the `/media-overlay?resource={ASSET_PATH}` URL query parameter (`{ASSET_PATH}` has the same definition as in the above section).

## GET /url/ and /url/{ENCODED_URL}

This conveninent micro-service automatically redirects to the base64 route described in the above section (`/pub/{PUB_ID}`). Also see the "Support for remote publications" section below.

## GET /opds/ and /opds/{ENCODED_URL}

This micro-service provides a basic OPDS reader. See the "Support for OPDS feeds" section below
