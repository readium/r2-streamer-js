# OPDS support

`readium2-streamer-js` implements a basic OPDS feed parser / navigator. Visit this link and enter a public OPDS feed's HTTP URL (see examples below):

https://readium2.herokuapp.com/opds/

The EPUB files referenced from the OPDS feeds are remotely accessed using HTTP partial byte range requests in order to support loading large publications (e.g. audio / video EPUB3 files). More information here: https://github.com/readium/r2-streamer-js/blob/develop/docs/remote-epub.md

## A selection of public OPDS feeds:

NYPL INSTANT CLASSICS:
https://instantclassics-beta.librarysimplified.org/index.xml
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Finstantclassics-beta.librarysimplified.org%2Findex.xml

NYPL OPEN ACCESS:
http://oacontent.librarysimplified.org/
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Foacontent.librarysimplified.org

FEEDBOOKS:
https://www.feedbooks.com/catalog.atom
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Fwww.feedbooks.com%2Fcatalog.atom

UNGLUE.IT
https://unglue.it/api/opds/
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Funglue.it%2Fapi%2Fopds%2F

WEB ARCHIVE:
http://bookserver.archive.org/catalog/
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fbookserver.archive.org%2Fcatalog%2F

SMASHWORDS:
http://www.smashwords.com/lexcycle/
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fwww.smashwords.com%2Flexcycle%2F

ATRAMENTA:
http://www.atramenta.net/opds/catalog.atom
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fwww.atramenta.net%2Fopds%2Fcatalog.atom

PRAGPUB:
https://pragprog.com/magazines.opds
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Fpragprog.com%2Fmagazines.opds

STANDARD EBOOK:
https://standardebooks.org/opds/all
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Fstandardebooks.org%2Fopds%2Fall

OPEN EDITION:
http://opds.openedition.org
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fopds.openedition.org

REVUES (OPEN EDITION):
http://bookserver.revues.org
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fbookserver.revues.org

BOOKS ON BOARD:
http://www.booksonboard.com/xml/catalog.atom
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fwww.booksonboard.com%2Fxml%2Fcatalog.atom

HISTORY STATE GOV:
https://history.state.gov/api/v1/catalog
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Fhistory.state.gov%2Fapi%2Fv1%2Fcatalog

TUEBL.CA:
http://tuebl.ca/catalog/
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Ftuebl.ca%2Fcatalog%2F

SLUCAS.FR:
http://cops-demo.slucas.fr/feed.php
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fcops-demo.slucas.fr%2Ffeed.php

FBREADER ARMENIAN:
http://armebooks.fbreader.org/books/index.xml
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Farmebooks.fbreader.org%2Fbooks%2Findex.xml

EBOOKS GRATUITS:
http://www.ebooksgratuits.com/opds/feed.php
==>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fwww.ebooksgratuits.com%2Fopds%2Ffeed.php

MANY BOOKS:
http://manybooks.net/opds/
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fmanybooks.net%2Fopds%2F

eFORGE:
http://eforge.eu/OPDS/_catalog/index.xml
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Feforge.eu%2FOPDS%2F_catalog%2Findex.xml

EBOOK BIKE:
https://ebook.bike/catalog
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Febook.bike%2Fcatalog

WOLNELEKTURY:
http://www.wolnelektury.pl/opds
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fwww.wolnelektury.pl%2Fopds

MEK.OSZK.HU:
http://bookserver.mek.oszk.hu
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fbookserver.mek.oszk.hu

FLIBUSTA.NET
http://proxy.flibusta.net/opds
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fproxy.flibusta.net%2Fopds

LITRES RU:
http://opds.litres.ru/
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fopds.litres.ru%2F

CHITANKA:
http://chitanka.info/catalog.opds
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fchitanka.info%2Fcatalog.opds

GITBOOK:
https://www.gitbook.com/api/opds/catalog.atom
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Fwww.gitbook.com%2Fapi%2Fopds%2Fcatalog.atom%20

LIB RUS EC:
http://lib.rus.ec/opds
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Flib.rus.ec%2Fopds

ZONE 4 IPHONE:
http://www.zone4iphone.ru/catalog.php
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fwww.zone4iphone.ru%2Fcatalog.php

FLASCHENPOST:
https://flaschenpost.piratenpartei.de/catalog/
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Fflaschenpost.piratenpartei.de%2Fcatalog%2F

ANARCHIST LIB:
https://theanarchistlibrary.org/opds
=>
https://readium2.herokuapp.com/opds/https%3A%2F%2Ftheanarchistlibrary.org%2Fopds

AOZORA
http://aozora.textlive.net/catalog.opds
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Faozora.textlive.net%2Fcatalog.opds

PRESTIGIO PLAZA
http://ebooks.prestigioplaza.com/feed
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Febooks.prestigioplaza.com%2Ffeed

BNF.FR (GALLICA):
http://gallica.bnf.fr/opds
=>
https://readium2.herokuapp.com/opds/http%3A%2F%2Fgallica.bnf.fr%2Fopds
