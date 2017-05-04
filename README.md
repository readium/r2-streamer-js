# Readium 2 NodeJS "streamer"

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/edrlab/r2-streamer-js.svg?branch=develop)](https://travis-ci.org/edrlab/r2-streamer-js)

## NPM package usage

https://www.npmjs.com/package/r2-streamer-js

in your project's `package.json`:
```json
  "dependencies": {
    "r2-streamer-js": "latest"
  }
```

in your Javascript code (ES6+) or TypeScript code (all `*.d.ts` type definitions included in `./node_modules/r2-streamer-js/**`):
```javascript
// see r2-streamer-js/dist/src/index.d.ts to see exported types
import { * } from "r2-streamer-js";

//or specific, direct type import, e.g.:
import { Publication } from "r2-streamer-js/dist/src/models/publication";
```

## Prerequisites

1) https://nodejs.org NodeJS >= 6, NPM >= 3 (check with `node --version` and `npm --version` from the command line)
2) https://yarnpkg.com Yarn >= 0.23 (check with `yarn --version` from the command line)

## Quick start

Command line steps:

1) `cd r2-streamer-js`
2) `npm update --global` (sync NPM global packages)
3) `yarn global upgrade` (sync Yarn global packages)
4) `yarn install` (initialize local `node_modules` packages from dependencies declared in `package.json`)
5) `yarn upgrade` (sync local packages)
6) `yarn start` (invoke the main build script)
7) `yarn test` (run the unit tests)
8) `yarn run cli {PATH_TO_EPUB}` (relative or absolute path to a publication)
