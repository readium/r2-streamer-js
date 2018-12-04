# NodeJS / TypeScript Readium-2 "streamer"

NodeJS implementation (written in TypeScript) and HTTP micro-services (Express middleware) for https://github.com/readium/architecture/tree/master/streamer

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](/LICENSE)

## Build status

[![NPM](https://img.shields.io/npm/v/r2-streamer-js.svg)](https://www.npmjs.com/package/r2-streamer-js) [![David](https://david-dm.org/readium/r2-streamer-js/status.svg)](https://david-dm.org/readium/r2-streamer-js) [![Travis](https://travis-ci.org/readium/r2-streamer-js.svg?branch=develop)](https://travis-ci.org/readium/r2-streamer-js) [![Heroku](https://img.shields.io/badge/app-Heroku-blue.svg)](https://readium2.herokuapp.com) [![Now.sh](https://img.shields.io/badge/app-Now.sh-lightgrey.svg)](https://readium2.now.sh)

[Changelog](/CHANGELOG.md)

## Prerequisites

1) https://nodejs.org NodeJS >= 8, NPM >= 5 (check with command line `node --version` and `npm --version`)
2) OPTIONAL: https://yarnpkg.com Yarn >= 1.0 (check with command line `yarn --version`)

## GitHub repository

https://github.com/readium/r2-streamer-js

There is no [github.io](https://readium.github.io/r2-streamer-js) site for this project (no [gh-pages](https://github.com/readium/r2-streamer-js/tree/gh-pages) branch).

Wiki documentation is not used, instead there are Markdown files inside the repository ([docs](https://github.com/readium/r2-streamer-js/tree/develop/docs) folder).

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

A mirror app is also deployed at **Now.sh**:

https://readium2.now.sh

Both servers run NodeJS 8, and the apps are based on the ES8-2017 code transpiled from TypeScript.

HTTP CORS headers are served to allow cross-origin / remote API requests.

## Version(s), Git revision(s)

NPM package (latest published):

https://unpkg.com/r2-streamer-js/dist/gitrev.json

Alternatively, GitHub mirror with semantic-versioning release tags:

https://rawgit.com/edrlab/r2-streamer-js-dist/develop/dist/gitrev.json

Heroku app (latest deployed):

https://readium2.herokuapp.com/version

Now app (latest deployed):

https://readium2.now.sh/version

## Developer quick start

Command line steps (NPM, but similar with YARN):

1) `cd r2-streamer-js`
2) `git status` (please ensure there are no local changes, especially in `package-lock.json` and the dependency versions in `package.json`)
3) `rm -rf node_modules` (to start from a clean slate)
4) `npm install`, or alternatively `npm ci` (both commands initialize the `node_modules` tree of package dependencies, based on the strict `package-lock.json` definition)
5) `npm run build:all` (invoke the main build script: clean, lint, compile)
6) `ls dist` (that's the build output which gets published as NPM package)
7) `npm run server-debug PATH_TO_EPUB_OR_DIR` (path is relative or absolute)

## Documentation

### HTTP API

https://github.com/readium/r2-streamer-js/blob/develop/docs/http.md

### Support for remote publications

https://github.com/readium/r2-streamer-js/blob/develop/docs/remote-epub.md

### Support for OPDS feeds

https://github.com/readium/r2-streamer-js/blob/develop/docs/opds.md

### Support for encrypted content

https://github.com/readium/r2-streamer-js/blob/develop/docs/encryption.md
