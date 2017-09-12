# Support for encrypted resources

## Obfuscated fonts

Both IDPF and Adobe font de-obfuscation schemes are supported.

## LCP DRM

LCP support temporarily requires (for testing only) passing the base64 encoding of the hexadecimal representation of the SHA256 digest of the user passphrase, in the URL request.

For example: user passphrase `dan` is SHA256 `ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb` which is base64 `ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==`.

The special URL syntax is `http://domain.com/pub/*-{LCP_PASS}-*{PUB_ID}/manifest.json` (which sets the active passphrase for all subsequent requests to publication assets, no need to repeat `*-{LCP_PASS}-*` to access individual resources)

Concrete example with URLs that do *not* provide the LCP pass (note that the cover image is indeed *not* encrypted):

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

Note how the navigation document itself is not encrypted either, but try clicking on navigation links, and see how this will fail:

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-nav.xhtml

Now let's set the LCP passphrase:

https://readium2.herokuapp.com/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg%3D%3D-*L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json

...then (note how the CSS styles now appear, as they are now decrypted):

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-nav.xhtml
