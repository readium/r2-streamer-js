# Remote EPUB URLs

`r2-streamer-js` implements support for web-hosted publications. Visit this link and enter a public EPUB HTTP URL (see examples below):

https://readium2.herokuapp.com/url/

Technical note: EPUB files served by `r2-streamer-js` are normally loaded from the local filesystem. However, remote publications (such as those referenced from OPDS feeds) must be fetched efficiently across the network. This is done using HTTP 1.1 partial requests (arbitrary byte ranges inside EPUB files, instead of downloading the entire publication at once), in order to support large publications with acceptable levels of performance and memory consumption (e.g. audio / video EPUB3 files).

More information about OPDS support here: [opds.md](opds.md)

## A selection of public EPUB URLs:

SMOKE TEST FXL (5MB):
https://raw.githubusercontent.com/readium/readium-test-files/master/functional/smoke-tests/SmokeTestFXL/SmokeTestFXL.epub
=>
https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3JlYWRpdW0vcmVhZGl1bS10ZXN0LWZpbGVzL21hc3Rlci9mdW5jdGlvbmFsL3Ntb2tlLXRlc3RzL1Ntb2tlVGVzdEZYTC9TbW9rZVRlc3RGWEwuZXB1Yg==/

INTERNAL LINK TEST (tiny):
https://readium.firebaseapp.com/epub_content/internal_link.epub
=>
https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yZWFkaXVtLmZpcmViYXNlYXBwLmNvbS9lcHViX2NvbnRlbnQvaW50ZXJuYWxfbGluay5lcHVi/

CC-SHARED-CULTURE (30MB):
https://raw.githubusercontent.com/pmstss/epub-books/master/cc-shared-culture.epub
=>
https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3Btc3Rzcy9lcHViLWJvb2tzL21hc3Rlci9jYy1zaGFyZWQtY3VsdHVyZS5lcHVi/
Note, video streaming:
https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3Btc3Rzcy9lcHViLWJvb2tzL21hc3Rlci9jYy1zaGFyZWQtY3VsdHVyZS5lcHVi/EPUB/video/shared-culture.mp4

MOBY DICK MEDIA OVERLAYS (10MB):
https://raw.githubusercontent.com/pmstss/epub-books/master/moby-dick-mo.epub
=>
https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3Btc3Rzcy9lcHViLWJvb2tzL21hc3Rlci9tb2J5LWRpY2stbW8uZXB1Yg==/

KASAMAKURA (20MB):
https://raw.githubusercontent.com/pmstss/epub-books/master/kusamakura-japanese-vertical-writing.epub
=>
https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3Btc3Rzcy9lcHViLWJvb2tzL21hc3Rlci9rdXNhbWFrdXJhLWphcGFuZXNlLXZlcnRpY2FsLXdyaXRpbmcuZXB1Yg==/

EPUBs available from OPDS feeds: [opds.md](opds.md)
