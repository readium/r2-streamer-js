Downloaded from:
https://github.com/readium/readium-css/tree/develop/prototype/iOS-implem/dist
commit d0294491e1bb2c8cee240e1369c7dc7ae0b101f8

===== MODIFICATIONS:

in ReadiumCSS-before.css:


-- REMOVED USER-SELECT --

```
  /* Disable text-selection in CSS until it’s managed in touchHandler.js */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
```

in ReadiumCSS-after.css:


-- REMOVED MEDIA QUERY (KEEP RULES) --

```
/* Desktop small + phablet + tablet landscape */

@media screen and (min-width: 60em), screen and (min-width: 36em) and (max-width: 47em) and (orientation: landscape) {
  :root {
    /* The size at which we want 2 columns to switch to 1 (depending on font-size) */
    --RS__colWidth: 20em; /* 20 * 16 = 320px but 20 * 28 = 560px so it will switch to 1 col @ 175% font-size (user-setting) on an iPad */
    /* We constrain to 2 columns so that we can never get 3 or 4, etc.*/
    --RS__colCount: 2;
    --RS__maxLineLength: none; /* If we don’t use this, colNumber user setting won’t work in Safari… */
  }
}
```


-- REMOVED MEDIA QUERY (KEEP RULES) --

```
/* apply col setting except for tablet portrait */

@media screen and (min-width: 60em), screen and (min-width: 36em) and (max-width: 47em) and (orientation: landscape) {
  :root[style*="--USER__colCount: 1"],
  :root[style*="--USER__colCount:1"],
  :root[style*="--USER__colCount: 2"],
  :root[style*="--USER__colCount:2"] {
    -webkit-column-count: var(--USER__colCount);
    -moz-column-count: var(--USER__colCount);
    column-count: var(--USER__colCount);
  }

/* If one column, make sure we limit line-length */
:root[style*="--USER__colCount: 1"],
:root[style*="--USER__colCount:1"] {
  --RS__maxLineLength: 40rem !important; /* This is the only way for the user setting to work in webkit… */
  --RS__colWidth: 100vw;
}

/* If smartphone landscape, and 2 columns, col width the same as iPad landscape + desktop */
  :root[style*="--USER__colCount: 2"],
  :root[style*="--USER__colCount:2"] {
    --RS__colWidth: auto; /* User explicitely tells he/she wants 2 columns, we reset floor value */
  }
}
```
