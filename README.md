# NodeJS / TypeScript Readium-2 "streamer"

NodeJS implementation (written in TypeScript) and HTTP micro-services (Express middleware) for https://github.com/readium/architecture/tree/master/streamer

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](/LICENSE)

## Build status

[![NPM](https://img.shields.io/npm/v/r2-streamer-js.svg)](https://www.npmjs.com/package/r2-streamer-js) [![David](https://david-dm.org/readium/r2-streamer-js/status.svg)](https://david-dm.org/readium/r2-streamer-js) [![Travis](https://travis-ci.org/readium/r2-streamer-js.svg?branch=develop)](https://travis-ci.org/readium/r2-streamer-js) [![Heroku](https://img.shields.io/badge/app-Heroku-blue.svg)](https://readium2.herokuapp.com)

[Changelog](/CHANGELOG.md)

## Prerequisites

1) https://nodejs.org NodeJS >= 8, NPM >= 5 (check with command line `node --version` and `npm --version`)
2) OPTIONAL: https://yarnpkg.com Yarn >= 1.0 (check with command line `yarn --version`)

## GitHub repository

https://github.com/readium/r2-streamer-js

There is no [github.io](https://readium.github.io/r2-streamer-js) site for this project (no [gh-pages](https://github.com/readium/r2-streamer-js/tree/gh-pages) branch).

## NPM package

https://www.npmjs.com/package/r2-streamer-js

Command line install:

`npm install r2-streamer-js`
OR
`yarn add r2-streamer-js`

...or manually add in your `package.json`:
```json
  "dependencies": {
    "r2-streamer-js": "latest"
  }
```

The JavaScript code distributed in the NPM package is usable as-is (no transpilation required), as it is automatically-generated from the TypeScript source.

Several ECMAScript flavours are provided out-of-the-box: ES5, ES6-2015, ES7-2016, ES8-2017:

https://unpkg.com/r2-streamer-js/dist/

(alternatively, GitHub mirror with semantic-versioning release tags: https://github.com/edrlab/r2-streamer-js-dist/tree/develop/dist/ )

The JavaScript code is not bundled, and it uses `require()` statement for imports (NodeJS style).

More information about NodeJS compatibility:

http://node.green

Note that web-browser Javascript is currently not supported (only NodeJS runtimes).

The type definitions (aka "typings") are included as `*.d.ts` files in `./node_modules/r2-streamer-js/dist/**`, so this package can be used directly in a TypeScript project.

Example usage:

```javascript
// from the index file
import { Server } from "r2-streamer-js";

// ES5 import (assuming node_modules/r2-streamer-js/):
import { Server } from "r2-streamer-js/dist/es5/src/http/server";

// ... or alternatively using a convenient path alias in the TypeScript config (+ WebPack etc.):
import { Server } from "@r2-streamer-js/http/server";
```

## Dependencies

https://david-dm.org/readium/r2-streamer-js

A [package-lock.json](https://github.com/readium/r2-streamer-js/blob/develop/package-lock.json) is provided (modern NPM replacement for `npm-shrinkwrap.json`).

A [yarn.lock](https://github.com/readium/r2-streamer-js/blob/develop/yarn.lock) file is currently *not* provided at the root of the source tree.

## Continuous Integration

https://travis-ci.org/readium/r2-streamer-js

TravisCI builds are triggered automatically at every Git "push" in the `develop` branch.

## Live demos

A test server app (not production-ready) is automatically deployed at **Heroku**, at every Git "push" in the `develop` branch:

https://readium2.herokuapp.com

A mirror app used to be deployed at **Now.sh** (https://readium2.now.sh), but this is not available anymore due to technical reasons (i.e. the new Now deployment model does not support our custom Express server)

Deployed servers run NodeJS 10+, and the apps are based on the ES8-2017 code transpiled from TypeScript.

HTTP CORS headers are served to allow cross-origin / remote API requests.

## Version(s), Git revision(s)

NPM package (latest published):

https://unpkg.com/r2-streamer-js/dist/gitrev.json

Alternatively, GitHub mirror with semantic-versioning release tags:

https://raw.githack.com/edrlab/r2-streamer-js-dist/develop/dist/gitrev.json

Heroku app (latest deployed):

https://readium2.herokuapp.com/version

## Developer quick start

Command line steps (NPM, but similar with YARN):

1) `cd r2-streamer-js`
2) `git status` (please ensure there are no local changes, especially in `package-lock.json` and the dependency versions in `package.json`)
3) `rm -rf node_modules` (to start from a clean slate)
4) `npm install`, or alternatively `npm ci` (both commands initialize the `node_modules` tree of package dependencies, based on the strict `package-lock.json` definition)
5) `npm run build:all` (invoke the main build script: clean, lint, compile)
6) `ls dist` (that's the build output which gets published as NPM package)
7) `npm run server-debug -- PATH_TO_EPUB_OR_DIR " -1"` (ES8-2017 dist, path is relative or absolute, -1 means no limits for HTTP header prefetch Links)
8) or: `npm run start -- 99` (ES6-2015 dist, default `./misc/epubs` folder, the 99 value overrides the default maximum number of HTTP header prefetch Links)

## Documentation

### Basic usage

```javascript
// ES5 import (assuming node_modules/r2-streamer-js/):
import { Server } from "r2-streamer-js/dist/es5/src/http/server";

// ... or alternatively using a convenient path alias in the TypeScript config (+ WebPack etc.):
import { Server } from "@r2-streamer-js/http/server";

// Constructor parameter is optional:
// disableDecryption: true
// disableOPDS
// disableReaders: true
// disableRemotePubUrl: true to deactivate
const server = new Server({
  disableDecryption: false, // deactivates the decryption of encrypted resources (Readium LCP).
  disableOPDS: true, // deactivates the HTTP routes for the OPDS "micro services" (browser, converter)
  disableReaders: true, // deactivates the built-in "readers" for ReadiumWebPubManifest (HTTP static host / route).
  disableRemotePubUrl: true, // deactivates the HTTP route for loading a remote publication.
  maxPrefetchLinks: 5, // Link HTTP header, with rel = prefetch, see server.ts MAX_PREFETCH_LINKS (default = 10)
});

// First parameter: port number, zero means default (3000),
// unless specified via the environment variable `PORT` (process.env.PORT).
// Tip: the NPM package `portfinder` can be used to automatically find an available port number.
const url = await server.start(3000, false);

// Second constructor parameter: if true, HTTPS instead of HTTP, using a randomly-generated self-signed certificate.
// Also validates encrypted HTTP header during request-request cycles, so should only be used in runtime
// contexts where the client side has access to the private encryption key (i.e. Electron app, see r2-navigator-js)
console.log(server.isSecured()); // false

// A client app that is capable of setting HTTP headers for every request originating from content webviews
// can obtain the special encrypted header using this function:
// (as used internally by the Electron-based `r2-navigator-js` component to secure the transport layer)
const nameValuePair = server.getSecureHTTPHeader(url + "/PATH_TO_RESOURCE");
console.log(nameValuePair.name);
console.log(nameValuePair.value);

// http://127.0.0.1:3000
// Note that ports 80 and 443 (HTTPS) are always implicit (ommitted).
console.log(url);

// `serverInfo.urlScheme` ("http")
// `serverInfo.urlHost` ("127.0.0.1")
// `serverInfo.urlPort` (3000)
console.log(server.serverInfo());

// Calls `uncachePublications()` (see below)
server.stop();

console.log(server.isStarted()); // false
```

To serve a `/robots.txt` file that completely disables search robots:

```javascript
// Call this before `server.start()`
server.preventRobots();
```

To add custom HTTP routes:

```javascript
// Call these before `server.start()`.
// They are equivalent to `app.use()` and `app.get()`, where `app` is the underlying Express instance:

server.expressUse("/static-files", express.static("/path/to/files", {
  dotfiles: "ignore",
  etag: true,
  fallthrough: false,
  immutable: true,
  index: false,
  maxAge: "1d",
  redirect: false,
}));

server.expressGet(["/hello.html"], (req: express.Request, res: express.Response) => {

  // Optionally, to add permissive CORS headers to the HTTP response
  server.setResponseCORS(res);

  res.status(200).send("<html><body>Hello</body></html>");
});
```

To register publications references (local filesystem paths) inside the internal server state
(which is used to create the OPDS2 feed, see below):

```javascript
// This can be called before or after `server.start()`:

// the returned array contains URL routes to the ReadiumWebPubManifests,
// e.g. `/pub/ID/manifest.json`, where `ID` is the base64 encoding of the registered path.
// Note that the returned base64 URL path components are already URI-encoded (escaped).
// (`=` and `/` are typically problematic edge-cases)
const publicationURLs = server.addPublications(["/path/to/book.epub"]);

// ...then:
const publicationPaths = server.getPublications(); // ["/path/to/book.epub"]

// ...and (calls `uncachePublication()`, see below):
const publicationURLs = server.removePublications(["/path/to/book.epub"]);
```

To get the OPDS2 feed for the currently registered publications:

```javascript
// This launches a potentially time-consuming Node process that scans (loads) each registered Publication,
// and stores the generated OPDS2 feed inside a temporary filesystem location.
// So this returns `undefined` at the first call, and the client must invoke the function again later.
// Note that both `addPublications()` and `removePublications()` clear the OPDS2 feed entirely,
// requiring its subsequent re-generation (full scan of registered publication paths).
// (poor design, but at this stage really just an OPDS2 demo without real use-case)
const opds2 = server.publicationsOPDS();
```

To actually load+parse a publication reference (local filesystem path) into a ReadiumWebPubManifest
Publication instance, stored in the server's state:

```javascript
// The Publication object model is defined in `r2-shared-js`
const publication = await server.loadOrGetCachedPublication("/path/to/book.epub");

// The above is basically a lazy-loader that checks the cache before loading+parsing a publication,
// equivalent to:
const publication = server.cachedPublication("/path/to/book.epub");
if (!publication) {
  publication = ...; // load and parse "/path/to/book.epub"
  server.cachePublication("/path/to/book.epub", publication);
}

console.log(server.isPublicationCached("/path/to/book.epub")); // true

// see also:
// (calls `publication.freeDestroy()` to cleanup allocated objects in the Publication,
// particularly the file handle to the underlying zip/EPUB/CBZ file)
server.uncachePublication("/path/to/book.epub");
server.uncachePublications();
```

Note that HTTP/remote publications URLs can be loaded into the server's cache
and subsequently served by the streamer without prior registration via `addPublications()`.
However, publications from the local filesytem will only be served when registered,
even if they are cached (in other words, the HTTP route is disabled when the publication is non-registered).

### HTTP API (built-in routes / micro-services)

[docs/http.md](/docs/http.md)

### Support for remote publications

[docs/remote-epub.md](/docs/remote-epub.md)

### Support for OPDS feeds

[docs/opds.md](/docs/opds.md)

### Support for encrypted content

[docs/encryption.md](/docs/encryption.md)
