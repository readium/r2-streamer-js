# NodeJS / TypeScript Readium-2 "streamer"

NodeJS implementation (written in TypeScript) and HTTP micro-services (Express middleware) for https://github.com/readium/readium-2/tree/master/streamer

## Build status

[![NPM](https://img.shields.io/npm/v/r2-streamer-js.svg)](https://www.npmjs.com/package/r2-streamer-js) [![David](https://david-dm.org/edrlab/r2-streamer-js/status.svg)](https://david-dm.org/edrlab/r2-streamer-js) [![Travis](https://travis-ci.org/edrlab/r2-streamer-js.svg?branch=develop)](https://travis-ci.org/edrlab/r2-streamer-js) [![Heroku](https://img.shields.io/badge/app-Heroku-blue.svg)](https://readium2.herokuapp.com) [![Now.sh](https://img.shields.io/badge/app-Now.sh-lightgrey.svg)](https://readium2.now.sh)

THIS SOFTWARE IS **ALPHA**!

Public APIs are not stable. The internal logical architecture and physical code organization is changing frequently.

## Prerequisites

1) https://nodejs.org NodeJS >= 6, NPM >= 3 (check with command line `node --version` and `npm --version`)
2) NOW OPTIONAL https://yarnpkg.com Yarn >= 0.23 (check with command line `yarn --version`)

## GitHub repository

https://github.com/edrlab/r2-streamer-js

There is no [github.io](https://edrlab.github.io/r2-streamer-js) site for this project (no [gh-pages](https://github.com/edrlab/r2-streamer-js/tree/gh-pages) branch).

Wiki documentation is not used, instead there are Markdown files inside the repository ([docs](https://github.com/edrlab/r2-streamer-js/tree/develop/docs) folder).

Note that there are currently no API docs for the source code.

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

More information about NodeJS compatibility:

http://node.green

Note that web-browser Javascript is not supported (only NodeJS runtimes).

 The type definitions (aka "typings") are included as `*.d.ts` files in `./node_modules/r2-streamer-js/dist/**`, so this package can be used directly in a TypeScript project. Example usage (subject to change, as the APIs and module structure is not finalized yet):

```javascript
import { * } from "r2-streamer-js";

// or:
import { Publication } from "r2-streamer-js/dist/es5/src/models/publication";
```

## Dependencies

https://david-dm.org/edrlab/r2-streamer-js

A [package-lock.json](https://github.com/edrlab/r2-streamer-js/blob/develop/package-lock.json) is provided (modern NPM alternative to `npm-shrinkwrap.json`).

A [yarn.lock](https://github.com/edrlab/r2-streamer-js/blob/develop/yarn.lock) file is also provided at the root of the source tree (Yarn is not recommended anymore to manage this project's NPM dependencies, due to several experienced build-breaking bugs).

## Continuous Integration

https://travis-ci.org/edrlab/r2-streamer-js

TravisCI builds are triggered automatically at every Git "push" in the `develop` branch.

The target runtime is NodeJS 8, and the test runners use the ES8-2017 code transpiled from TypeScript. Note that unit-tests are currently **very incomplete**.

## Live demos

A test server app (not production-ready) is automatically deployed at **Heroku**, at every Git "push" in the `develop` branch:

https://readium2.herokuapp.com

A backup / redundant app is manually deployed at **Now.sh**:

https://readium2.now.sh

Both servers run NodeJS 8, and the apps are based on the ES8-2017 code transpiled from TypeScript.

HTTP CORS headers are served to allow cross-origin / remote API requests.

## Version(s), Git revision(s)

NPM package (latest published):

https://unpkg.com/r2-streamer-js/dist/gitrev.json

GitHub "dist" repository (latest pushed):

https://rawgit.com/edrlab/r2-streamer-js-dist/master/dist/gitrev.json

Heroku app (latest deployed):

https://readium2.herokuapp.com/version

Now app (latest deployed):

https://readium2.now.sh/version

## Quick start

Command line steps (default NPM):

1) `cd r2-streamer-js`
2) `npm update --global` (sync NPM global packages)
4) `npm install` (initialize local `node_modules` packages from dependencies declared in `package-lock.json`)
5) `npm update` (sync local packages)
6) `npm run build:all` (invoke the main build script: clean, lint, compile)
7) `npm test` (run the unit tests)
8) `npm run server-debug {PATH_TO_EPUB_OR_DIR}` (path is relative or absolute)

Command line steps (optional Yarn):

1) `cd r2-streamer-js`
2) `npm update --global` (sync NPM global packages)
3) `yarn global upgrade` (sync Yarn global packages)
4) `yarn install` (initialize local `node_modules` packages from dependencies declared in `package.json`)
5) `yarn upgrade` (sync local packages)
6) `yarn run build:all` (invoke the main build script: clean, lint, compile)
7) `yarn test` (run the unit tests)
8) `yarn run server-debug {PATH_TO_EPUB_OR_DIR}` (path is relative or absolute)

## Documentation

### HTTP API

https://github.com/edrlab/r2-streamer-js/blob/develop/docs/http.md

### Support for remote publications

https://github.com/edrlab/r2-streamer-js/blob/develop/docs/remote-epub.md

### Support for OPDS feeds

https://github.com/edrlab/r2-streamer-js/blob/develop/docs/opds.md

### Support for encrypted content

https://github.com/edrlab/r2-streamer-js/blob/develop/docs/encryption.md
