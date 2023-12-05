# OPDS support

`r2-streamer-js` implements a basic OPDS feed parser / navigator. Visit this link and enter a public OPDS feed's HTTP URL (see examples below):

https://streamer.edrlab.org/opds-v1-v2-convert/

The following link is for testing the conversion of OPDS v1 to v2:

https://streamer.edrlab.org/opds-v1-v2-convert/

The EPUB files referenced from the OPDS feeds are remotely accessed using HTTP partial byte range requests in order to support loading large publications (e.g. audio / video EPUB3 files). More information here: [remote-epub.md](remote-epub.md).

## A selection of public OPDS feeds:

Atoll Digital Library
https://atoll-digital-library.org/opds/
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fatoll-digital-library.org%2Fopds%2F

O'Reilly Media
http://opds.oreilly.com/opds/
=>
http://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fopds.oreilly.com%2Fopds%2F

DPLA (Digital Public Library of America)
https://openbookshelf.dp.la/
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fopenbookshelf.dp.la%2F

KB Reasearch (National Library of the Netherlands)
https://kbresearch.nl/epub2opds/opds.atom
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fkbresearch.nl%2Fepub2opds%2Fopds.atom

Cool Lib
https://coollib.net/opds
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fcoollib.net%2Fopds

vsenauka
https://vsenauka.ru/opds
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fvsenauka.ru%2Fopds

Knihi (Belarusian)
https://knihi.com/opds.xml
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fknihi.com%2Fopds.xml

iKnihi (Russian)
https://iknigi.net/opds
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fiknigi.net%2Fopds

ekniga (Russian)
https://ekniga.org/opds
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fekniga.org%2Fopds

Textos (Spanish)
https://textos.info/opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Ftextos.info%2Fopds

Gutenberg
http://m.gutenberg.org/ebooks.opds/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fm.gutenberg.org%2Febooks.opds%2F

NYPL INSTANT CLASSICS:
https://instantclassics.librarysimplified.org/index.xml
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Finstantclassics.librarysimplified.org%2Findex.xml

NYPL OPEN ACCESS:
http://oacontent.librarysimplified.org/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Foacontent.librarysimplified.org

NYPL CIRCULATION:
https://circulation.librarysimplified.org/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fcirculation.librarysimplified.org

LIBRARY FOR ALL:
https://books.libraryforall.org/urms
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fbooks.libraryforall.org/urms

FRAMABOOKIN:
http://framabookin.org/b/opds/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fframabookin.org%2Fb%2Fopds%2F

QUEBEC LIBRARY:
http://quebec.pretnumerique.ca/catalog/root.atom
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fquebec.pretnumerique.ca%2Fcatalog%2Froot.atom

MONTREAL LIBRARY:
http://montreal.pretnumerique.ca/catalog/root.atom
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fmontreal.pretnumerique.ca%2Fcatalog%2Froot.atom

FEEDBOOKS:
https://www.feedbooks.com/catalog.atom
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fwww.feedbooks.com%2Fcatalog.atom

UNGLUE.IT
https://unglue.it/api/opds/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Funglue.it%2Fapi%2Fopds%2F

WEB ARCHIVE:
http://bookserver.archive.org/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fbookserver.archive.org%2F

SMASHWORDS:
http://www.smashwords.com/lexcycle/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.smashwords.com%2Flexcycle%2F

ATRAMENTA:
http://www.atramenta.net/opds/catalog.atom
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.atramenta.net%2Fopds%2Fcatalog.atom

PRAGPUB:
https://pragprog.com/magazines.opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fpragprog.com%2Fmagazines.opds

STANDARD EBOOK:
https://standardebooks.org/opds/all
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fstandardebooks.org%2Fopds%2Fall

OPEN EDITION:
http://opds.openedition.org
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fopds.openedition.org

REVUES (OPEN EDITION):
http://bookserver.revues.org
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fbookserver.revues.org

BOOKS ON BOARD:
http://www.booksonboard.com/xml/catalog.atom
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.booksonboard.com%2Fxml%2Fcatalog.atom

HISTORY STATE GOV:
https://history.state.gov/api/v1/catalog
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fhistory.state.gov%2Fapi%2Fv1%2Fcatalog

TUEBL.CA:
http://tuebl.ca/catalog/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Ftuebl.ca%2Fcatalog%2F

SLUCAS.FR:
http://cops-demo.slucas.fr/feed.php
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fcops-demo.slucas.fr%2Ffeed.php

FBREADER ARMENIAN:
http://armebooks.fbreader.org/books/index.xml
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Farmebooks.fbreader.org%2Fbooks%2Findex.xml

EBOOKS GRATUITS:
http://www.ebooksgratuits.com/opds/feed.php
==>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.ebooksgratuits.com%2Fopds%2Ffeed.php

MANY BOOKS:
http://manybooks.net/opds/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fmanybooks.net%2Fopds%2F

eFORGE:
http://eforge.eu/OPDS/_catalog/index.xml
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Feforge.eu%2FOPDS%2F_catalog%2Findex.xml

EBOOK BIKE:
https://ebook.bike/catalog
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Febook.bike%2Fcatalog

WOLNELEKTURY:
http://www.wolnelektury.pl/opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.wolnelektury.pl%2Fopds

MEK.OSZK.HU:
http://bookserver.mek.oszk.hu
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fbookserver.mek.oszk.hu

FLIBUSTA.NET
http://proxy.flibusta.net/opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fproxy.flibusta.net%2Fopds

LITRES RU:
http://opds.litres.ru/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fopds.litres.ru%2F

CHITANKA:
http://chitanka.info/catalog.opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fchitanka.info%2Fcatalog.opds

GITBOOK:
https://api.gitbook.com/opds/catalog.atom
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fwww.gitbook.com%2Fapi%2Fopds%2Fcatalog.atom%20

LIB RUS EC:
http://lib.rus.ec/opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Flib.rus.ec%2Fopds

ZONE 4 IPHONE:
http://www.zone4iphone.ru/catalog.php
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.zone4iphone.ru%2Fcatalog.php

FLASCHENPOST:
https://flaschenpost.piratenpartei.de/catalog/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fflaschenpost.piratenpartei.de%2Fcatalog%2F

ANARCHIST LIB:
https://theanarchistlibrary.org/opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Ftheanarchistlibrary.org%2Fopds

(also https://fr.theanarchistlibrary.org/opds and https://kr.theanarchistlibrary.org/opds and https://da.theanarchistlibrary.org/opds and https://es.theanarchistlibrary.org/opds and https://sv.theanarchistlibrary.org/opds and https://ru.theanarchistlibrary.org/opds and https://ja.theanarchistlibrary.org/opds and https://fi.theanarchistlibrary.org/opds and https://zh.anarchistlibraries.net/opds and https://pl.anarchistlibraries.net/opds and https://tr.anarchistlibraries.net/opds and https://anarhisticka-biblioteka.net/opds and https://www.edizionianarchismo.net/opds and https://a-bieb.nl/opds and https://anarchistischebibliothek.org/opds and https://bibliotecaanarchica.org/opds and https://www.anarhisticka-biblioteka.org/opds and https://lib.anarcho-copy.org/opds )

Wolnelektury
https://wolnelektury.pl/opds/
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fwolnelektury.pl%2Fopds%2F

Tatsu Zine
https://tatsu-zine.com/catalogs.opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Ftatsu-zine.com%2Fcatalogs.opds

AOZORA
http://aozora.textlive.net/catalog.opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Faozora.textlive.net%2Fcatalog.opds

PRESTIGIO PLAZA
http://ebooks.prestigioplaza.com/feed
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Febooks.prestigioplaza.com%2Ffeed

BNF.FR (GALLICA):
http://gallica.bnf.fr/opds
=>
https://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fgallica.bnf.fr%2Fopds

CULTURETHEQUE (ARCHIMEDE):
https://www.culturetheque.com/exploitation/GBR/Portal/Recherche/Search.svc/Catalog
=>
https://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fwww.culturetheque.com%2Fexploitation%2FGBR%2FPortal%2FRecherche%2FSearch.svc%2FCatalog

OPOTO-ED:
http://opoto-ed.org/catalogue/opds
=>
http://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fopoto-ed.org%2Fcatalogue%2Fopds

WMFLABS WIKISOURCE:
https://tools.wmflabs.org/wsexport/wikisource-fr-good.atom
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Ftools.wmflabs.org%2Fwsexport%2Fwikisource-fr-good.atom

(also https://ws-export.wmcloud.org/opds/en/Ready_for_export.xml )

Elephant Editions
https://archive.elephanteditions.net/opds
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Farchive.elephanteditions.net%2Fopds

Blah
http://blah.me/opds/index.atom
=>
http://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fblah.me%2Fopds%2Findex.atom

CBeta
http://www.cbeta.org/opds/
=>
http://streamer.edrlab.org/opds-v1-v2-convert/http%3A%2F%2Fwww.cbeta.org%2Fopds%2F

CEL desLibris
https://api.deslibris.ca/api/feed
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Fapi.deslibris.ca%2Fapi%2Ffeed

Lyrasis
https://lion.lyrasistechnology.org
=>
http://streamer.edrlab.org/opds-v1-v2-convert/https%3A%2F%2Flion.lyrasistechnology.org%2F

## OPDS 2.0

Specification: https://drafts.opds.io/opds-2.0

Sample feed: https://test.opds.io/2.0/home.json => http://streamer.edrlab.org/opds-v2-browse/https%3A%2F%2Ftest.opds.io%2F2.0%2Fhome.json

Feedbooks: https://catalog.feedbooks.com/catalog/index.json (replace `.json` with `.atom` to access the OPDS1 XML feed) => http://streamer.edrlab.org/opds-v2-browse/https%3A%2F%2Fcatalog.feedbooks.com%2Fcatalog%2Findex.json

Fulcrum: https://www.fulcrum.org/api/opds => https://streamer.edrlab.org/opds-v2-browse/https%3A%2F%2Fwww.fulcrum.org%2Fapi%2Fopds

Lirtuel.be: https://www.lirtuel.be/v1/home.opds2 => http://streamer.edrlab.org/opds-v2-browse/https%3A%2F%2Fwww.lirtuel.be%2Fv1%2Fhome.opds2

eBiblioMedia (Lausanne Fondation Suisse): https://bm.ebibliomedia.ch/v1/home.opds2 => http://streamer.edrlab.org/opds-v2-browse/https%3A%2F%2Fbm.ebibliomedia.ch%2Fv1%2Fhome.opds2

CantookStation / Pretnumerique.ca / Bibliopresto.ca: https://missmills.cantookstation.com/v1/home.opds2 and http://quebec.pretnumerique.ca/v1/home.opds2 and http://montreal.pretnumerique.ca/v1/home.opds2 and https://demoreader.cantookstation.com/v1/home.opds2 and https://demo-testapp.cantookstation.com/v1/home.opds2 and ... many more, see https://sols.cantookstation.com/find_library and http://www.pretnumerique.ca/find_library and https://bibliopresto.ca => http://streamer.edrlab.org/opds-v2-browse/

NYPL registry: https://libraryregistry.librarysimplified.org/libraries => http://streamer.edrlab.org/opds-v2-browse/https%3A%2F%2Flibraryregistry.librarysimplified.org%2Flibraries

Aldiko registry: http://libraries.aldiko.com/home.json => http://streamer.edrlab.org/opds-v2-browse/http%3A%2F%2Flibraries.aldiko.com%2Fhome.json
