# OPDS support

`r2-streamer-js` implements a basic OPDS feed parser / navigator. Visit this link and enter a public OPDS feed's HTTP URL (see examples below):

https://readium2.herokuapp.com/opds-v1-v2-convert/

The following link is for testing the conversion of OPDS v1 to v2:

https://readium2.herokuapp.com/opds-v1-v2-convert/

The EPUB files referenced from the OPDS feeds are remotely accessed using HTTP partial byte range requests in order to support loading large publications (e.g. audio / video EPUB3 files). More information here: [remote-epub.md](remote-epub.md).

## A selection of public OPDS feeds:

O'Reilly Media
http://opds.oreilly.com/opds/
=>
http://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fopds.oreilly.com%2Fopds%2F

Textos (Spanish)
https://textos.info/opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Ftextos.info%2Fopds

Gutenberg
http://m.gutenberg.org/ebooks.opds/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fm.gutenberg.org%2Febooks.opds%2F

NYPL INSTANT CLASSICS:
https://instantclassics.librarysimplified.org/index.xml
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Finstantclassics.librarysimplified.org%2Findex.xml

NYPL OPEN ACCESS:
http://oacontent.librarysimplified.org/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Foacontent.librarysimplified.org

NYPL CIRCULATION:
https://circulation.librarysimplified.org/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fcirculation.librarysimplified.org

LIBRARY FOR ALL:
https://books.libraryforall.org/urms
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fbooks.libraryforall.org/urms

FRAMABOOKIN:
http://framabookin.org/b/opds/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fframabookin.org%2Fb%2Fopds%2F

QUEBEC LIBRARY:
http://quebec.pretnumerique.ca/catalog/root.atom
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fquebec.pretnumerique.ca%2Fcatalog%2Froot.atom

MONTREAL LIBRARY:
http://montreal.pretnumerique.ca/catalog/root.atom
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fmontreal.pretnumerique.ca%2Fcatalog%2Froot.atom

FEEDBOOKS:
https://www.feedbooks.com/catalog.atom
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fwww.feedbooks.com%2Fcatalog.atom

UNGLUE.IT
https://unglue.it/api/opds/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Funglue.it%2Fapi%2Fopds%2F

WEB ARCHIVE:
http://bookserver.archive.org/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fbookserver.archive.org%2F

SMASHWORDS:
http://www.smashwords.com/lexcycle/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.smashwords.com%2Flexcycle%2F

ATRAMENTA:
http://www.atramenta.net/opds/catalog.atom
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.atramenta.net%2Fopds%2Fcatalog.atom

PRAGPUB:
https://pragprog.com/magazines.opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fpragprog.com%2Fmagazines.opds

STANDARD EBOOK:
https://standardebooks.org/opds/all
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fstandardebooks.org%2Fopds%2Fall

OPEN EDITION:
http://opds.openedition.org
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fopds.openedition.org

REVUES (OPEN EDITION):
http://bookserver.revues.org
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fbookserver.revues.org

BOOKS ON BOARD:
http://www.booksonboard.com/xml/catalog.atom
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.booksonboard.com%2Fxml%2Fcatalog.atom

HISTORY STATE GOV:
https://history.state.gov/api/v1/catalog
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fhistory.state.gov%2Fapi%2Fv1%2Fcatalog

TUEBL.CA:
http://tuebl.ca/catalog/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Ftuebl.ca%2Fcatalog%2F

SLUCAS.FR:
http://cops-demo.slucas.fr/feed.php
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fcops-demo.slucas.fr%2Ffeed.php

FBREADER ARMENIAN:
http://armebooks.fbreader.org/books/index.xml
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Farmebooks.fbreader.org%2Fbooks%2Findex.xml

EBOOKS GRATUITS:
http://www.ebooksgratuits.com/opds/feed.php
==>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.ebooksgratuits.com%2Fopds%2Ffeed.php

MANY BOOKS:
http://manybooks.net/opds/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fmanybooks.net%2Fopds%2F

eFORGE:
http://eforge.eu/OPDS/_catalog/index.xml
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Feforge.eu%2FOPDS%2F_catalog%2Findex.xml

EBOOK BIKE:
https://ebook.bike/catalog
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Febook.bike%2Fcatalog

WOLNELEKTURY:
http://www.wolnelektury.pl/opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.wolnelektury.pl%2Fopds

MEK.OSZK.HU:
http://bookserver.mek.oszk.hu
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fbookserver.mek.oszk.hu

FLIBUSTA.NET
http://proxy.flibusta.net/opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fproxy.flibusta.net%2Fopds

LITRES RU:
http://opds.litres.ru/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fopds.litres.ru%2F

CHITANKA:
http://chitanka.info/catalog.opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fchitanka.info%2Fcatalog.opds

GITBOOK:
https://api.gitbook.com/opds/catalog.atom
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fwww.gitbook.com%2Fapi%2Fopds%2Fcatalog.atom%20

LIB RUS EC:
http://lib.rus.ec/opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Flib.rus.ec%2Fopds

ZONE 4 IPHONE:
http://www.zone4iphone.ru/catalog.php
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.zone4iphone.ru%2Fcatalog.php

FLASCHENPOST:
https://flaschenpost.piratenpartei.de/catalog/
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fflaschenpost.piratenpartei.de%2Fcatalog%2F

ANARCHIST LIB:
https://theanarchistlibrary.org/opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Ftheanarchistlibrary.org%2Fopds

AOZORA
http://aozora.textlive.net/catalog.opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Faozora.textlive.net%2Fcatalog.opds

PRESTIGIO PLAZA
http://ebooks.prestigioplaza.com/feed
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Febooks.prestigioplaza.com%2Ffeed

BNF.FR (GALLICA):
http://gallica.bnf.fr/opds
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fgallica.bnf.fr%2Fopds

CULTURETHEQUE (ARCHIMEDE):
https://www.culturetheque.com/exploitation/GBR/Portal/Recherche/Search.svc/Catalog
=>
https://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fwww.culturetheque.com%2Fexploitation%2FGBR%2FPortal%2FRecherche%2FSearch.svc%2FCatalog

OPOTO-ED:
http://opoto-ed.org/catalogue/opds
=>
http://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fopoto-ed.org%2Fcatalogue%2Fopds

WMFLABS WIKISOURCE:
https://tools.wmflabs.org/wsexport/wikisource-fr-good.atom
=>
http://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Ftools.wmflabs.org%2Fwsexport%2Fwikisource-fr-good.atom

Blah
http://blah.me/opds/index.atom
=>
http://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fblah.me%2Fopds%2Findex.atom

CBeta
http://www.cbeta.org/opds/
=>
http://readium2.herokuapp.com/opds-v1-v2-convert/http%3A%2F%2Fwww.cbeta.org%2Fopds%2F

CEL desLibris
https://api.deslibris.ca/api/feed
=>
http://readium2.herokuapp.com/opds-v1-v2-convert/https%3A%2F%2Fapi.deslibris.ca%2Fapi%2Ffeed

## OPDS 2.0

Specification: https://drafts.opds.io/opds-2.0

Sample feed: https://test.opds.io/2.0/home.json => http://readium2.herokuapp.com/opds-v2-browse/https%3A%2F%2Ftest.opds.io%2F2.0%2Fhome.json

Feedbooks: https://catalog.feedbooks.com/catalog/index.json (replace `.json` with `.atom` to access the OPDS1 XML feed) => http://readium2.herokuapp.com/opds-v2-browse/https%3A%2F%2Fcatalog.feedbooks.com%2Fcatalog%2Findex.json

Lirtuel.be: https://www.lirtuel.be/v1/home.opds2 => http://readium2.herokuapp.com/opds-v2-browse/https%3A%2F%2Fwww.lirtuel.be%2Fv1%2Fhome.opds2

CantookStation / Pretnumerique.ca / Bibliopresto.ca: https://missmills.cantookstation.com/v1/home.opds2 and http://quebec.pretnumerique.ca/v1/home.opds2 and http://montreal.pretnumerique.ca/v1/home.opds2 and https://demoreader.cantookstation.com/v1/home.opds2 and https://demo-testapp.cantookstation.com/v1/home.opds2 and ... many more, see https://sols.cantookstation.com/find_library and http://www.pretnumerique.ca/find_library and https://bibliopresto.ca => http://readium2.herokuapp.com/opds-v2-browse/

NYPL registry: https://libraryregistry.librarysimplified.org/libraries => http://readium2.herokuapp.com/opds-v2-browse/https%3A%2F%2Flibraryregistry.librarysimplified.org%2Flibraries

Aldiko registry: http://libraries.aldiko.com/home.json => http://readium2.herokuapp.com/opds-v2-browse/http%3A%2F%2Flibraries.aldiko.com%2Fhome.json
