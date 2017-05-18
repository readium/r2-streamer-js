# Remote EPUB URLs

`readium2-streamer-js` implements support for web-hosted publications. Visit this link and enter a public EPUB HTTP URL (see examples below):

https://readium2.herokuapp.com/url/

Technical note: EPUB files served by `readium2-streamer-js` are normally fetched from the local filesystem. However, remote publications (such as those referenced from OPDS feeds) must be fetched efficiently across the network. This is done using HTTP partial byte range requests (rather than full EPUB download), in order to support large publications with acceptable levels of performance and memory consumption (e.g. audio / video EPUB3 files).

More information about OPDS support here: https://github.com/edrlab/r2-streamer-js/blob/develop/docs/remote-epub.md

## A selection of public EPUB URLs:


