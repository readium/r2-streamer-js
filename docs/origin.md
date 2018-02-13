# The web "origin" issue

## Technical background

Irrespective of whether the "streamer" component is used in the context of an online service, or of an offline self-contained app, the actual HTTP server is bound to a specific IP address (`127.0.0.1` in the "localhost" case, sometimes `0.0.0.0` which automatically binds to the LAN IP, and note that this also applies to Heroku-lilke deployments where secure HTTP is provided via reverse proxy).

Furthermore, every publications' "webpub manifest" JSON (and their linked resources) are served on the random / first-available port number (e.g. `3000`) that the underlying HTTP server is initially started with.

So, the full "origin" of *all* publications looks like (for example): `https://127.0.0.1:8080`, which can be decomposed to the URL format: `SCHEME://IP:PORT`. The URL syntax used to identify specific publications is: `SCHEME://IP:PORT/pub/ID`, and the syntax used to reference specific assets within a given publication is `SCHEME://IP:PORT/pub/ID/PATH/TO/RESOURCE`.

(more information at https://github.com/edrlab/r2-streamer-js/blob/develop/docs/http.md )

## Problem description

The fact that all served publications share the same web "origin" is problematic, because HTML documents from a given publication (e.g. EPUB3 fixed-layout ebook with interactive pages that store user/reader preferences or activity progress) can access ; via Javascript ; the `localStorage` / `indexedDB` / etc. contents of any other publication. Because of that, there is a potential risk of data collision (e.g. concurrent access to same-name properties in a `localStorage` object), and of course this has privacy implications too.

Furthermore, the fact that the HTTP port can change from one reading session to another (depending on the available ports on the user's device, or because of randomization) means that user data can suddenly vanish. For example, users might be forced to re-enter their name at the begining of an interactive book, their "read aloud to me" preference might be lost in their favourite audio book, or their game progress might be reset.

This is not a hypothetical problem. The issue is reproducible with existing commercial fixed-layout EPUB3 publications, and it may also exist with complex reflowable documents (such as in the education sector).

## Possible solutions

Native platforms like Electron provide APIs to implement custom URL "schemes" that enable the same capabilities / privileges as HTTP or HTTPS, which is essential in order for documents loaded in iframes / webviews to be subject to normal web security policies (e.g. use of Service Worker in a secure context, HTTP CORS for cross-origin fetch / XmlHttpRequest, etc.).

For example, a URL such as `SCHEME://IP:PORT/pub/ID/PATH/TO/RESOURCE` (let's say: `https://127.0.0.1:3000/pub/PUB_UUID/contents/chapter1.html`) could be "condensed" to an internal / application-specific format like `readium2://PUB_UUID/contents/chapter1.html`, where the `readium2` URL scheme can be managed under the hood by a "custom protocol handler" that ensures the correct mapping with the "real" HTTP IP+PORT server address. This way, HTML documents and their associated scripts execute within the `readium2://PUB_UUID` origin which is specific to a given publication, and which does not vary when the port number changes over time / from one reading session to another. Of course, it is assumed that the publication ID (in this example: "PUB_UUID") is fixed for the lifetime of the publication stored within the user's library (in other words, this ID may be randomly constructed each time a publication is added to the user's library, consequently the same publication could be associated with different IDs each time it gets imported into the reading system).

## Electron

See: https://github.com/edrlab/r2-navigator-js/issues/2