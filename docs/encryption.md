# Support for encrypted resources

## Obfuscated fonts

Both IDPF and Adobe font de-obfuscation schemes are supported.

## LCP DRM

### Demonstration (LCP test/basic profile, not suitable for production/1.0 profile)

Let's consider the SHA256 hash of the user passphrase (or more precisely, the SHA256 digest / hexadecimal representation of the binary buffer / byte array), and its subsequent base64 encoding. For example, user passphrase `dan` becomes `ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb` (SHA256), which becomes `ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==` (base64).

Now, let's consider the special URL syntax `http://domain.com/pub/*-{LCP_PASS}-*{PUB_ID}/manifest.json`, which references the "webpub manifest" of a particular publication identified by `{PUB_ID}`, and which passes the LCP base64-encoded passphrase into the request, denoted by the delimiters `*-` and `-*` around `{LCP_PASS}`.

Once the above URL request is made, the server stores the LCP passphrase and utilises it for any subsequent requests to resources (e.g. assets such as CSS, HTML, etc.) that belong to the publication identified by `{PUB_ID}`.

Note that this special URL syntax is implemented to enable LCP testing directly from vanilla web browsers. In a real-world application, the underlying programmatic API should be used instead.

Let's look at a concrete example. First, let's reset the LCP passphrase using an incorrect value:

https://readium2.herokuapp.com/pub/*-YmQzZGFlNWZiOTFmODhhNGYwOTc4MjIyZGZkNThmNTlhMTI0MjU3Y2IwODE0ODYzODdjYmFlOWRmMTFmYjg3OQ%3D%3D-*L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

Let's load the manifest without any LCP passphrase:

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

Notice that we did not provide the LCP passphrase in the URL, yet the publication's cover image is displayed correctly. That is because cover images are not encrypted in LCP-protected publications. The same principle applies to the navigation document:

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-nav.xhtml?show=1

Now let's load an encrypted page (it should fail):

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-content.xhtml?show=1

Now let's set the correct passphrase ("dan"):

https://readium2.herokuapp.com/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg%3D%3D-*L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

...and let's load the encrypted page once again (it should succeed):

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-content.xhtml?show=1

Note that in this example fonts are obfuscated (IDPF algorithm), therefore they are not encrypted via LCP. Also note that "streaming" of encrypted audio / video content is supported too, but test files are too large to demonstrate here (strictly-speaking, this is not "streaming", but rather: support for HTTP partial byte ranges, random access into the AES-256-CBC resource).

### Implementation status (TypeScript / JavaScript)

Note that TypeScript / JavaScript implementation is just for demonstration purposes, it only supports the LCP profile test/basic (not production/1.0), and it only handles decryption (no license signature checking, no expiration date/time verification, no Certificate Revocation List processing, no support for LSD License Status Document, etc.)

Currently, the Javascript decryption code utilizes the NodeJS native crypto implementation (which is based on OpenSSL). Performance is acceptable, but of course the private decryption key is not protected (it can easily be debugged / reverse-engineered). This architecture is therefore only suitable for the LCP basic/test profile.

Support for LCP 1.0/production profile relies upon a native C++ module, which replaces the Javascript implementation.
