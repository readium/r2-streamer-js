# Next

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.15...develop

Changes:
* TODO

# 1.0.15

> Build environment: NodeJS `10.16.0`, NPM `6.10.2`

Changes:
* NPM  updates
* Buffer.from() API to remove deprecation messages

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.15/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.15/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.15

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.14...v1.0.15

# 1.0.14

> Build environment: NodeJS `10.16.0`, NPM `6.9.0`

Changes:
* NPM  updates

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.14/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.14/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.14

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.13...v1.0.14

# 1.0.13

> Build environment: NodeJS `10.15.3`, NPM `6.9.0`

Changes:
* rel=prefetch HTTP header Links now generated based on ordered sequence of supported media types, rather than order of authored JSON resource array / EPUB manifest items (fixed limitation still applies: maximum number of headers).
* Build env update: switched from `uglify-es` to `terser` (ECMAScript-2015 / ES6 minifier for optional bundled app scripts)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.13/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.13/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.13

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.12...v1.0.13

# 1.0.12

> Build environment: NodeJS `10.15.3`, NPM `6.9.0`

Changes:
* Added CLI parameter handling for server's maximum number of rel=prefetch HTTP header Links

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.12/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.12/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.12

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.11...v1.0.12

# 1.0.11

> Build environment: NodeJS `10.15.3`, NPM `6.9.0`

Changes:
* Added server parameter for maximum number of rel=prefetch HTTP header Links

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.11/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.11/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.11

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.10...v1.0.11

# 1.0.10

> Build environment: NodeJS `10.15.3`, NPM `6.9.0`

Changes:
* NPM updates

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.10/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.10/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.10

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.9...v1.0.10

# 1.0.9

> Build environment: NodeJS `8.15.1`, NPM `6.4.1`

Changes:
* NPM updates
* JSON Schema updates

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.9/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.9/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.9

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.8...v1.0.9

# 1.0.8

> Build environment: NodeJS `8.15.1`, NPM `6.4.1`

Changes:
* NPM updates
* JSON Schema updates

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.8/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.8/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.8

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.7...v1.0.8

# 1.0.7

> Build environment: NodeJS `8.14.1`, NPM `6.4.1`

Changes:
* NPM updates
* Minor JSON Schema and documentation updates
* Improved JSON Schema validation reports
* Fixed JSON Schema cache handling (switch between OPDS2 and ReadiumWebPubManifest)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.7/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.7/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.7

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.6...v1.0.7

# 1.0.6

> Build environment: NodeJS `8.14.1`, NPM `6.4.1`

Changes:
* Updated documentation
* NPM 6.5.* has regression bugs for global package installs, so revert back to NPM 6.4.1 (which is officially shipped with the NodeJS installer).
* Now correctly reset LCP basic/test profile userkey when incorrect value passed in URL (used for testing, not real-world usage pattern, not LCP 1.0/production profile)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.6/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.6/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.6

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.5...v1.0.6

# 1.0.5

> Build environment: NodeJS `8.14.0`, NPM `6.5.0`

Changes:
* NPM updates
* Minor documentation fixes

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.5/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.5/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.5

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.4...v1.0.5

# 1.0.4

> Build environment: NodeJS `8.14.0`, NPM `6.5.0`

Changes:
* Fixed regression bug due to the previous base64 pub ID encoding bugfix (slashes). Depending on what lib is used, URLs and URLs components do not necessarilly get automatically decoded/encoded (percent escape for base64 chars, e.g. `=` and `/`). We must be very careful because we pass around both full URLs, and URLs components that require encoding (thus the double-encoding issues).

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.4/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.4/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.4

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.3...v1.0.4

# 1.0.3

> Build environment: NodeJS `8.14.0`, NPM `6.5.0`

Changes:
* NPM updates (r2-xxx-js)
* Fixed nasty Base64 encoding edge case with slash character in URLs
* Moved "secure" HTTP code from navigator to streamer

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.3/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.3/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.3

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.2...v1.0.3

# 1.0.2

> Build environment: NodeJS `8.14.0`, NPM `6.5.0`

Changes:
* NPM updates (minor)
* Replaced deprecated RawGit URLs
* Removed unnecessary TypeScript import aliases
* Fixed OPDS2 links in the doc
* Updated OPDS2 and ReadiumWebPubManifest schemas
* Improved documentation
* Improved EPUB type detection in the CLI (local, remote, packed, exploded)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.2/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.2/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.2

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.1...v1.0.2

# 1.0.1

> Build environment: NodeJS `8.14.0`, NPM `6.5.0`

Changes:
* Removed rogue debug console log

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.1/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.1/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.1

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0...v1.0.1

# 1.0.0

> Build environment: NodeJS `8.14.0`, NPM `6.5.0`

Changes:
* Support for chainable transformers (aka content filters), for example decrypt followed by HTML injection (CSS, etc.)
* NPM updates (minor)
* README info
* VisualStudio code tweaks (developer workflow)
* Semantic versioning bump 1.*.* (3-digit style now, "-alphaX" suffix caused issues with NPM tooling: updates, lockfile, etc.)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0-alpha.6...v1.0.0

# 1.0.0-alpha.6

> Build environment: NodeJS `8.12.0`, NPM `6.4.1`

Changes:
* NPM updates (minor)
* Git revision JSON info now includes NodeJS and NPM version (build environment)
* OPDS v1 to v2 converter micros-service now supports publication/entry display (+JSON validation)
* NYPL and Hadrien demo readers updated for spine+readingOrder support

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0-alpha.6/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0-alpha.6/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0-alpha.6

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0-alpha.5...v1.0.0-alpha.6

# 1.0.0-alpha.5

Changes:
* Dependency "ta-json" GitHub semver dependency becomes "ta-json-x" NPM package (fixes https://github.com/readium/r2-testapp-js/issues/10 )
* Removed TypeScript linter warning message (checks for no unused variables)
* NPM updates related to the Node TypeScript typings
* Fixed TypeScript regression bug (3.0.3 -> 3.1.1) related to XML / HTML DOM typings

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0-alpha.5/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0-alpha.5/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0-alpha.5

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0-alpha.4...v1.0.0-alpha.5

# 1.0.0-alpha.4

Changes:
* OPDS micro-services updates (URL routes / paths, added support for OPDS2 browse, absolute URLs)
* HTML templates, formatted (pretty-print)
* npm updates (external deps)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0-alpha.4/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0-alpha.4/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0-alpha.4

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0-alpha.3...v1.0.0-alpha.4

# 1.0.0-alpha.3

Changes:
* correct version in `package-lock.json`

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0-alpha.3/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0-alpha.3/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0-alpha.3

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0-alpha.2...v1.0.0-alpha.3

# 1.0.0-alpha.2

Changes (NPM updates):
* `@types/node`
* `@types/uuid`
* `r2-utils-js`
* `r2-shared-js`
* `r2-opds-js`
* `r2-lcp-js`

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0-alpha.2/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0-alpha.2/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0-alpha.2

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.0-alpha.1...v1.0.0-alpha.2

# 1.0.0-alpha.1

Changes:
* initial NPM publish

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.0-alpha.1/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.0-alpha.1/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.0-alpha.1

Git diff:
* initial NPM publish
