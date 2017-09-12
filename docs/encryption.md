# Support for encrypted resources

## Obfuscated fonts

Both IDPF and Adobe font de-obfuscation schemes are supported.

## LCP DRM

### Demonstration

Let's consider the base64 encoding of the hexadecimal representation of the SHA256 digest of the user passphrase. For example, user passphrase `dan` becomes `ec4f2dbb3b140095550c9afbbb69b5d6fd9e814b9da82fad0b34e9fcbe56f1cb` (SHA256), which becomes `ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg==` (base64).

Now, let's consider the special URL syntax `http://domain.com/pub/*-{LCP_PASS}-*{PUB_ID}/manifest.json`, which references the "webpub manifest" of a particular publication identified by `{PUB_ID}`, and which passes the LCP base64-encoded passphrase into the request, denoted by the delimiters `*-` and `-*` around `{LCP_PASS}`.

Once the above URL request is made, the server stores the LCP passphrase and utilises it for any subsequent requests to resources (e.g. assets such as CSS, HTML, etc.) that belong to the publication identified by `{PUB_ID}`.

Note that this special URL syntax is implemented to enable LCP testing directly from vanilla web browsers. In a real-world application, the underlying programmatic API should be used instead.

Let's look at a concrete example. First, let's reset the LCP passphrase using an incorrect value:

https://readium2.herokuapp.com/pub/*-YmQzZGFlNWZiOTFmODhhNGYwOTc4MjIyZGZkNThmNTlhMTI0MjU3Y2IwODE0ODYzODdjYmFlOWRmMTFmYjg3OQ%3D%3D-*L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

Let's load the manifest without any LCP passphrase:

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

Notice that we do not provide the LCP passphrase in the URL, yet the publication's cover image is displayed correctly. That is because cover images are not encrypted in LCP-protected publications. The same principle applies to the navigation document:

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-nav.xhtml

Now let's set the correct passphrase ("dan"):

https://readium2.herokuapp.com/pub/*-ZWM0ZjJkYmIzYjE0MDA5NTU1MGM5YWZiYmI2OWI1ZDZmZDllODE0YjlkYTgyZmFkMGIzNGU5ZmNiZTU2ZjFjYg%3D%3D-*L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/manifest.json/show/all

...and let's load an encrypted page:

https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL3dhc3RlbGFuZC1vdGYtb2JmX0xDUF9kYW4uZXB1Yg%3D%3D/EPUB/wasteland-nav.xhtml

Note that in this example fonts are obfuscated (IDPF algorithm), therefore they are not encrypted via LCP. Also note that "streaming" of encrypted audio / video content is supported too, but test files are too large to demonstrate here (strictly-speaking, this is not "streaming", but rather: support for HTTP partial byte ranges, random access into the AES-256-CBC resource).

### Implementation status

* Certificate chain validation is on the todo list (top-priority)
* Signature verification is on the todo list (top-priority)
* Date / time checks are on the todo list (top priority)
* Certificate Revocation List is a stretch goal (nice to have, but not urgent at this stage)
* LSD License Status Document is a top priority too.

### Developer remarks

Currently, decryption code is Javascript, but utilizes the NodeJS native crypto API (OpenSSL). Performance is perfectly acceptable, but the crypto keys are not protected (can easily be debugged / reverse-engineered). This architecture is therefore only suitable for the LCP basic profile.

The LCP 1.0 profile requires a native C++ module, which will replace the Javascript code via a well-defined interface (API).

The main design challenge for this adaptation is that the Javascript code is tied to the high-performance NodeJS stream framework, which ; under the hood ; controls the read / write buffers and the data flow between the source zip archive (EPUB file) and the consuming webview / web browser.

In a nutshell (skipping implementation minutia): a typical encrypted media must be incrementally fed into a pipeline of transformers, starting with extracting from the zip archive (STORE mode, not DEFLATE), then into AES-256-CBC decryptor (using the IV prefix / initialisation vector, and the correct suffix padding scheme), then optionally into inflate-decompression (only for non- audio, video, image assets), then into a byte range filter (to create an adequate HTTP 206 partial byte payload if necessary), and finally into the consuming HTTP response object.

Note that web browser engines typically initiate an audio/video request for the *entire* file, but only to fetch a few bytes (this strategy is a workaround for missing HTTP HEAD support in some servers). The HTTP connection is indeed cut short by the client, in order to avoid large assets being chunked in their entirety into a single response. This is perfectly handled by the LCP implementation, as the flowing mode of the piped NodeJS streams is simply gracefully interrupted (i.e. the whole pipeline shuts down without memory leaks and/or dangling file handles).

So, much like in the ReadiumSDK "content filter" architecture, the native C++ NodeJS module / plugin that will perform decryption must handle low-level binary buffers with incoming requests of arbitrary lengths, which means that the mechanics of stream piping would have to be implemented explicitly (for example, starving consumers-readers in case producers-writers are lagging behind or have significant differencies in buffering strategies). A more realistic alternative would be to implement a "read forward" algorithm to mimic the "seekable byte stream" approach of ReadiumSDK (in the absence of ftell / fseek in terms of internal movable stream cursor). This requires customizing the NodeJS stream handling, as seekability is not built in (this is in fact already implemented in the Javascript code, as it is needed to access the prefix IV and the suffix padding). We can also simplify the procesing of stored-encrypted-deflated resources (which excludes video / audio / image) by loading full payloads into the HTTP reponse bodies.

To conclude, a totally separate implementation is required for LCP 1.0 profile. Support for the basic profile can remain entirely stream-based.

To be continued...
