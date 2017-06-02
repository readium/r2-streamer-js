# Support for encrypted resources

## Obfuscated fonts

Both IDPF and Adobe font de-obfuscation schemes are supported.

## LCP DRM

LCP support temporarily requires (for testing only) passing the base64 encoding of the hexadecimal representation of the SHA256 digest of the user passphrase, in the URL request.

For example: user passphrase `dan` is SHA256 `ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb` which is base64 `ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==`.

The special URL syntax is `http://domain.com/pub/*-{LCP_PASS}-*{PUB_ID}/` where `{LCP_PASS}` is automatically propagated into the webpub manifest.

Concrete example with URLs that do *not* provide the LCP pass (note that the cover image is in fact *not* encrypted):

https://readium2.herokuapp.com/pub/L2FwcC93YXN0ZWxhbmQtb3RmLW9iZl9MQ1BfZGFuLmVwdWI%3D/manifest.json/show/all

Note how the navigation document itself is not encrypted either, but try clicking on navigation links, and see how this fails:

https://readium2.herokuapp.com/pub/L2FwcC93YXN0ZWxhbmQtb3RmLW9iZl9MQ1BfZGFuLmVwdWI%3D/EPUB/wasteland-nav.xhtml

Now let's provide the LCP pass (note how the CSS styles now appear, as they are in fact encrypted):

https://readium2.herokuapp.com/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==-*L2FwcC93YXN0ZWxhbmQtb3RmLW9iZl9MQ1BfZGFuLmVwdWI%3D/EPUB/wasteland-nav.xhtml
