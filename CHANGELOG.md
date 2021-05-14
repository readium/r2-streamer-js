# Next

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.34...develop

Changes:
* TODO

# 1.0.34

> Build environment: NodeJS `14.16.1`, NPM `6.14.13`

Changes:
* NPM package updates

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.34/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.34/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.34

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.33...v1.0.34

# 1.0.33

> Build environment: NodeJS `14.15.5`, NPM `6.14.11`

Changes:
* NPM package updates
* Workaround for badly-authored publication relative URLs (double slashes), now route paths automatically collapse multiple slashes in addition to normalising dot segments
* OPDS browser micro service: added support for LCP license links
* OPDS samples: added more v1 and v2 feeds, plus convenient browser link of OPDS v2

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.33/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.33/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.33

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.32...v1.0.33

# 1.0.32

> Build environment: NodeJS `14.15.4`, NPM `6.14.11`

Changes:
* NPM package updates
* Updated OPDS documentation / references
* HTTP caching is now disabled for encrypted resources
* Updated JSON Schemas for OPDS2, ReadiumWebPubManifest, and LCP/LSD
* New LCP/LSD "micro service" to visualize JSON (same principles as existing OPDS browser/converter, etc.)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.32/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.32/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.32

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.31...v1.0.32

# 1.0.31

> Build environment: NodeJS `12.18.2`, NPM `6.14.7`

Changes:
* NPM package updates
* Added Spanish OPDS feed
* Support for Divina Readium webpub manifest
* Support for Link Alternate and Children (publication resources integrity check, recursive links)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.31/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.31/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.31

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.30...v1.0.31

# 1.0.30

> Build environment: NodeJS `12.18.2`, NPM `6.14.5`

Changes:
* NPM package updates
* TypeScript const enum safeguard (isolated modules)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.30/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.30/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.30

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.29...v1.0.30

# 1.0.29

> Build environment: NodeJS `12.18.1`, NPM `6.14.5`

Changes:
* NPM package updates
* OPDS samples in doc

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.29/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.29/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.29

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.28...v1.0.29

# 1.0.28

> Build environment: NodeJS `12.16.3`, NPM `6.14.5`

Changes:
* NPM package updates
* W3C Sync Media + Media Overlays alignment

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.28/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.28/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.28

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.27...v1.0.28

# 1.0.27

> Build environment: NodeJS `12.16.1`, NPM `6.14.4`

Changes:
* NPM package updates
* Now.sh deployment removal (new model incompatible with the streamer's Express server)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.27/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.27/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.27

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.26...v1.0.27

# 1.0.26

> Build environment: NodeJS `12.16.1`, NPM `6.14.4`

Changes:
* NPM package updates
* added no-cache to HTTP headers for byte range requests, and added HTTP status 416 for non-supported range
* added error logging for response streaming
* added new URL parameter to transformer

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.26/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.26/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.26

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.25...v1.0.26

# 1.0.25

> Build environment: NodeJS `12.15.0`, NPM `6.13.7`

Changes:
* NPM package update: UUID (breaking API change)
* Fixed Travis script and Heroku + Now deployment

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.25/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.25/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.25

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.24...v1.0.25

# 1.0.24

> Build environment: NodeJS `12.15.0`, NPM `6.13.7`

Changes:
* NPM package updates
* Content transformers now pass "session info" semantic-agnostic data (serialized string) so that anonymous HTTP requests can be correlated with specific publications and with their reading session (multiple readers scenario). Also see changes in r2-shared, and of course r2-navigator.
* Support for AudioBook serving/streaming, local-packed (zipped), local-exploded (unzipped), and remote-exploded.
* OPDS browse micro-service: OAuth token-based authentication and refresh support.

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.24/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.24/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.24

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.23...v1.0.24

# 1.0.23

> Build environment: NodeJS `12.13.0`, NPM `6.12.0`

Changes:
* NPM package updates
* TAJSON now parses/generates arbitrary JSON properties with typed object
* OPDS2 browser (with data:image/xxx,Base64 handling, and navigation into the v1-v2 converter / inspector)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.23/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.23/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.23

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.22...v1.0.23

# 1.0.22

> Build environment: NodeJS `12.13.0`, NPM `6.12.0`

Changes:
* NPM updates (OPDS, Shared-JS)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.22/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.22/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.22

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.21...v1.0.22

# 1.0.21

> Build environment: NodeJS `12.13.0`, NPM `6.12.0`

Changes:
* HTTP server CORS preflight support (options method)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.21/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.21/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.21

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.20...v1.0.21

# 1.0.20

> Build environment: NodeJS `12.13.0`, NPM `6.12.0`

Changes:
* NPM updates

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.20/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.20/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.20

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.19...v1.0.20

# 1.0.19

> Build environment: NodeJS `10.16.3`, NPM `6.12.0`

Changes:
* HTTP request headers for OPDS fetch, as some servers reject missing UserAgent, etc.
* Added 3 new test OPDS feeds in documentation
* NPM updates (including NodeJS v12 for Electron v6)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.19/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.19/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.19

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.18...v1.0.19

# 1.0.18

> Build environment: NodeJS `10.16.3`, NPM `6.11.3`

Changes:
* NPM updates
* Fixed JSON validator schemas order

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.18/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.18/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.18

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.17...v1.0.18

# 1.0.17

> Build environment: NodeJS `10.16.3`, NPM `6.11.3`

Changes:
* NPM  updates
* TypeScript sort imports

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.17/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.17/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.17

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.16...v1.0.17

# 1.0.16

> Build environment: NodeJS `10.16.3`, NPM `6.11.3`

Changes:
* NPM  updates
* Fixed OPDS GitBook URL (doc)

Git revision info:
* https://unpkg.com/r2-streamer-js@1.0.16/dist/gitrev.json
* https://github.com/edrlab/r2-streamer-js-dist/blob/v1.0.16/dist/gitrev.json

Git commit history:
* https://github.com/readium/r2-streamer-js/commits/v1.0.16

Git diff:
* https://github.com/readium/r2-streamer-js/compare/v1.0.15...v1.0.16

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
