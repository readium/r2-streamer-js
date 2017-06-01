# NodeJS Readium-2 "streamer"

NodeJS implementation (TypeScript transpiled to ECMAScript 2015 / ES6) of https://github.com/readium/readium-2/tree/master/streamer

## Build status
[![David](https://david-dm.org/edrlab/r2-streamer-js/status.svg)](https://david-dm.org/edrlab/r2-streamer-js) [![Travis](https://travis-ci.org/edrlab/r2-streamer-js.svg?branch=develop)](https://travis-ci.org/edrlab/r2-streamer-js) [![NPM](https://img.shields.io/npm/v/r2-streamer-js.svg)](https://www.npmjs.com/package/r2-streamer-js) [![Heroku](https://img.shields.io/badge/app-Heroku-blue.svg)](https://readium2.herokuapp.com) [![Now.sh](https://img.shields.io/badge/app-Now.sh-lightgrey.svg)](https://readium2.now.sh)

THIS IS ALPHA SOFTWARE! Do not use in production. APIs are not stable, the architecture / code organization is likely to change frequently. All builds are from the `develop` branch. Continuous integration via TravisCI. NodeJS package published at the NPM registry. Test server apps deployed at Heroku and Now.sh.

## Prerequisites

1) https://nodejs.org NodeJS >= 6, NPM >= 3 (check with `node --version` and `npm --version` from the command line)
2) https://yarnpkg.com Yarn >= 0.23 (check with `yarn --version` from the command line)

## NPM package usage

https://www.npmjs.com/package/r2-streamer-js

`yarn add r2-streamer-js` or `npm install r2-streamer-js`

...or manually, in your project's `package.json`:
```json
  "dependencies": {
    "r2-streamer-js": "latest"
  }
```

In your Javascript code (ECMAScript 2015 / ES6) or TypeScript code (all `*.d.ts` type definitions are included in `./node_modules/r2-streamer-js/**`):
```javascript
// see r2-streamer-js/dist/src/index.d.ts for exported types:
import { * } from "r2-streamer-js";

// ... or specific, direct type import, e.g.:
import { Publication } from "r2-streamer-js/dist/src/models/publication";
```

## Quick start

Command line steps:

1) `cd r2-streamer-js`
2) `npm update --global` (sync NPM global packages)
3) `yarn global upgrade` (sync Yarn global packages)
4) `yarn install` (initialize local `node_modules` packages from dependencies declared in `package.json`)
5) `yarn upgrade` (sync local packages)
6) `yarn run build` (invoke the main build script: clean, lint, compile)
7) `yarn test` (run the unit tests)
8) `yarn run cli {PATH_TO_EPUB_OR_DIR}` (command line publication "dump") (path is relative or absolute)
9) `yarn run server-debug {PATH_TO_EPUB_OR_DIR}` (HTTP micro-service to serve publication manifest and associated resources)

## Server API, HTTP routes

Two active deployments, at Heroku and Now.sh:

https://readium2.herokuapp.com

https://readium2.now.sh

(all quoted HTTP routes below use the GET verb)

### /opds2/ and /opds2/publications.json

This route serves the list of available publications as an "OPDS 2" JSON file using the `application/opds+json` content type (canonical syntax, keys are recursively alphabetically sorted).
More information about the OPDS format here: https://github.com/opds-community/opds-revision

#### /opds2/publications.json/show

This route serves a pretty-printed representation of the "OPDS 2" JSON, with clickable links for easy navigation (e.g. the cover image of each listed publication).

`/show` is equivalent to `/show/all`. Here is a list of available JSON "filters": Metadata: `/show/metadata`, Links: `/show/links`, Publications: `/show/publications`.

### /pub/{PUB_ID}

`{PUB_ID}` is the base64 encoding of a local publication file (server filesystem, therefore limited to app-approved files), or of any arbitrary HTTP URL (see the "Support for remote publications" section below).

For demonstration purposes, the deployed server apps include `wasteland-otf-obf.epub` and `childrens-literature.epub`, obtained from https://idpf.github.io/epub3-samples/samples.html / https://github.com/IDPF/epub3-samples

#### /pub/{PUB_ID}/manifest.json

This route serves the "webpub manifest" JSON file using the `application/webpub+json` content type (canonical syntax, keys are recursively alphabetically sorted).

#### /pub/{PUB_ID}/manifest.json/show

This route serves a pretty-printed representation of the "webpub manifest" JSON, with clickable links for easy navigation into individual publication assets (see next route below).

`/show` is equivalent to `/show/all`. Here is a list of available JSON "filters": Cover image: `/show/cover`, Table of Contents: `/show/toc`, Metadata: `/show/metadata`, Spine: `/show/spine`, Page List: `/show/pagelist`, Landmarks: `/show/landmarks`, Links: `/show/links`, Resources: `/show/resources`, Media Overlays: `/show/mediaoverlays`.

#### /pub/{PUB_ID}/{ASSET_PATH}

This route serves individual assets (file resources) from the publication archive. `{ASSET_PATH}` is relative to the root of the publication container (e.g. EPUB zip archive), so files like `/META-INF/container.xml` can be requested.

Text files can be rendered in-page (for debugging) rather than processed by the web browser, by using the `?show=1` URL query string parameter.

#### /pub/{PUB_ID}/media-overlay

This route serves the full EPUB3 Media Overlay SMIL data (in its JSON form) using the `application/vnd.readium.mo+json` content type. Single spine item Media Overlays can be requested using the `/media-overlay?resource={ASSET_PATH}` URL query parameter (`{ASSET_PATH}` has the same definition as in the above section).

### /url/ and /url/{ENCODED_URL}

This conveninent micro-service automatically redirects to the base64 route described in the above section (`/pub/{PUB_ID}`). Also see the "Support for remote publications" section below.

### /opds/ and /opds/{ENCODED_URL}

This micro-service provides a basic OPDS reader. See the "Support for OPDS feeds" section below

## Support for remote publications

See: https://github.com/edrlab/r2-streamer-js/blob/develop/docs/remote-epub.md

## Support for OPDS feeds

See: https://github.com/edrlab/r2-streamer-js/blob/develop/docs/opds.md

## Obfuscated fonts and encrypted resources

Both IDPF and Adobe font de-obfuscation schemes are supported.

LCP support temporarily requires (for testing only) passing the base64 encoding of the hexadecimal representation of the SHA256 digest of the user passphrase, in the URL request.

For example: user passphrase `dan` is SHA256 `ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb` which is base64 `ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==`.

The special URL syntax is `http://domain.com/pub/*-{LCP_PASS}-*{PUB_ID}/` where `{LCP_PASS}` is automatically propagated into the webpub manifest.

Concrete example with URLs that do *not* provide the LCP pass (note that the cover image is in fact *not* encrypted):

https://readium2.herokuapp.com/pub/L2FwcC93YXN0ZWxhbmQtb3RmLW9iZl9MQ1BfZGFuLmVwdWI%3D/manifest.json/show/all

Note how the navigation document itself is not encrypted either, but try clicking on navigation links, and see how this fails:

https://readium2.herokuapp.com/pub/L2FwcC93YXN0ZWxhbmQtb3RmLW9iZl9MQ1BfZGFuLmVwdWI%3D/EPUB/wasteland-nav.xhtml

Now let's provide the LCP pass (note how the CSS styles now appear, as they are in fact encrypted):

https://readium2.herokuapp.com/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==-*L2FwcC93YXN0ZWxhbmQtb3RmLW9iZl9MQ1BfZGFuLmVwdWI%3D/EPUB/wasteland-nav.xhtml

