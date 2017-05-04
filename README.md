# Readium 2 "streamer" for NodeJS (TypeScript, ECMAScript 2015 / ES6)

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/edrlab/r2-streamer-js.svg?branch=develop)](https://travis-ci.org/edrlab/r2-streamer-js)

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
8) `yarn run cli {PATH_TO_EPUB}` (command line publication "dump") (path is relative or absolute)
9) `yarn run server {PATH_TO_EPUB}` (HTTP service to serve publication manifest and associated resources)
