/* Atomys Design Language — chování rozbalovacích prvků a souhrnu chyb, bez závislostí.
 *
 * Vložte do <head> hned za vzhled.js jako externí skript (projde CSP script-src 'self'):
 *   <script src="/atomys/vzhled.js"></script>
 *   <script src="/atomys/ovladani.js"></script>
 * Skript nečeká na DOM: události poslouchá na document, takže platí i pro obsah vložený později
 * (React, htmx). Druhé vložení na stránku nic neudělá.
 *
 * Atribut data-at-ovladani na <html> říká stylu, že chování běží. Bez něj (skript chybí,
 * JavaScript neběží) kreslí CSS navigaci aplikace i nabídku webu jako běžný blok stránky
 * a tlačítko Nabídka nekreslí, takže navigace zůstane dosažitelná.
 *
 * 1. Rozbalovací prvek (vzor disclosure): tlačítko s aria-expanded a aria-controls.
 *      <button class="at-bar__uzivatel" type="button" aria-expanded="false" aria-controls="ucet">…</button>
 *      <div class="at-menu at-menu--end" id="ucet" hidden> <a class="at-menu__item" href="…">…</a> … </div>
 *    - Klik tlačítko přepne. Otevřený prvek zavře Esc (fokus se vrátí na tlačítko), klik mimo
 *      tlačítko a prvek a odchod fokusu mimo ně. Otevřením jednoho se zavřou ostatní.
 *    - Prvek s třídou .at-menu nebo s atributem hidden se skrývá atributem hidden. Navigaci
 *      aplikace (.at-nav) a nabídku webu kreslí styl podle aria-expanded tlačítka.
 *    - Navigace aplikace pod 1 100 px je vrstva pod lištou, ale v DOM stojí až za lištou. Po
 *      otevření proto dostane fokus její první odkaz.
 *    - Nabídka s role="menu" (akce se záznamem) má úplný vzor APG menu button: po otevření fokus
 *      na první položku, šipky, Home a End, Esc s návratem fokusu, Tab nabídku zavře, položky
 *      mají tabindex="-1". Šipka dolů nebo nahoru na zavřeném tlačítku nabídku otevře.
 *      Nabídka, ve které jsou jen odkazy (účet), role="menu" nemá: je to seznam odkazů.
 *    - Tlačítko s atributem data-at-vlastni skript vynechá; chování pak řeší aplikace.
 *    Při otevření a zavření vyvolá na tlačítku událost "atomys:rozbaleni" (detail { otevreno }).
 *
 * 2. Souhrn chyb (.at-error-summary, vzor GOV.UK): odkaz na pole posune do pohledu popisek
 *    nebo legendu pole a pole zaměří bez dalšího posunu. Popisek, nápověda a chyba nad polem
 *    tak zůstanou vidět v každé hustotě.
 *
 * API: atomysOvladani.zavritVse()  zavře všechny otevřené prvky (například před změnou stránky).
 */
(function () {
  if (window.atomysOvladani) return;
  document.documentElement.setAttribute('data-at-ovladani', '');

  var otevrene = [];
  var POLOZKA_MENU = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
  var ZAMERITELNE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function cilPro(spoustec) {
    var id = spoustec.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }
  function jeMenu(cil) {
    return !!cil && cil.getAttribute('role') === 'menu';
  }
  function polozky(cil) {
    return Array.prototype.filter.call(cil.querySelectorAll(POLOZKA_MENU), function (p) {
      return !p.hidden && p.offsetParent !== null;
    });
  }
  function jeSpoustec(prvek) {
    return (
      !!prvek &&
      !prvek.hasAttribute('data-at-vlastni') &&
      (prvek.tagName === 'BUTTON' || prvek.getAttribute('role') === 'button') &&
      !!cilPro(prvek)
    );
  }
  function poradi(spoustec) {
    for (var i = 0; i < otevrene.length; i++) if (otevrene[i].spoustec === spoustec) return i;
    return -1;
  }
  function uvnitr(zaznam, prvek) {
    return !!prvek && (zaznam.spoustec.contains(prvek) || (!!zaznam.cil && zaznam.cil.contains(prvek)));
  }
  function oznam(spoustec, otevreno) {
    var udalost;
    try {
      udalost = new CustomEvent('atomys:rozbaleni', { bubbles: true, detail: { otevreno: otevreno } });
    } catch (e) {
      udalost = document.createEvent('CustomEvent');
      udalost.initCustomEvent('atomys:rozbaleni', true, false, { otevreno: otevreno });
    }
    spoustec.dispatchEvent(udalost);
  }

  function nastav(spoustec, otevrit, vratitFokus) {
    var cil = cilPro(spoustec);
    var i = poradi(spoustec);
    spoustec.setAttribute('aria-expanded', otevrit ? 'true' : 'false');
    if (cil) {
      if (cil.__atomysSkryvat === undefined) cil.__atomysSkryvat = cil.hasAttribute('hidden') || cil.classList.contains('at-menu');
      if (cil.__atomysSkryvat) cil.hidden = !otevrit;
      if (jeMenu(cil)) polozky(cil).forEach(function (p) { p.setAttribute('tabindex', '-1'); });
    }
    if (otevrit && i < 0) otevrene.push({ spoustec: spoustec, cil: cil });
    if (!otevrit && i >= 0) otevrene.splice(i, 1);
    if (!otevrit && vratitFokus) spoustec.focus();
    oznam(spoustec, otevrit);
  }

  function zavritOstatni(spoustec) {
    otevrene.slice().forEach(function (z) {
      if (z.spoustec !== spoustec && !(z.cil && z.cil.contains(spoustec))) nastav(z.spoustec, false, false);
    });
  }

  function otevrit(spoustec, posledni) {
    zavritOstatni(spoustec);
    nastav(spoustec, true, false);
    var cil = cilPro(spoustec);
    if (!cil) return;
    if (jeMenu(cil)) {
      var p = polozky(cil);
      if (p.length) p[posledni ? p.length - 1 : 0].focus();
    } else if (cil.classList.contains('at-nav')) {
      var poloha = window.getComputedStyle(cil).position;
      if (poloha === 'absolute' || poloha === 'fixed') {
        var prvni = cil.querySelector(ZAMERITELNE);
        if (prvni) prvni.focus();
      }
    }
  }

  function zavritVse() {
    otevrene.slice().forEach(function (z) { nastav(z.spoustec, false, false); });
  }

  // Přepnutí tlačítkem; výběr položky nabídky s role="menu" nabídku zavře a vrátí fokus.
  document.addEventListener('click', function (e) {
    var cil = e.target instanceof Element ? e.target : null;
    if (!cil) return;
    var spoustec = cil.closest('[aria-expanded][aria-controls]');
    if (jeSpoustec(spoustec)) {
      if (spoustec.getAttribute('aria-expanded') === 'true') nastav(spoustec, false, false);
      else otevrit(spoustec, false);
      return;
    }
    var polozka = cil.closest(POLOZKA_MENU);
    if (!polozka || polozka.getAttribute('aria-disabled') === 'true') return;
    for (var i = otevrene.length - 1; i >= 0; i--) {
      if (jeMenu(otevrene[i].cil) && otevrene[i].cil.contains(polozka)) {
        nastav(otevrene[i].spoustec, false, true);
        return;
      }
    }
  });

  // Klik nebo dotyk mimo otevřený prvek ho zavře (fokus zůstane, kam uživatel klepl).
  document.addEventListener('pointerdown', function (e) {
    otevrene.slice().forEach(function (z) {
      if (!uvnitr(z, e.target)) nastav(z.spoustec, false, false);
    });
  });

  // Fokus mimo tlačítko i otevřený prvek (Tab, klávesová zkratka čtečky) ho zavře.
  document.addEventListener('focusin', function (e) {
    otevrene.slice().forEach(function (z) {
      if (!uvnitr(z, e.target)) nastav(z.spoustec, false, false);
    });
  });

  document.addEventListener('keydown', function (e) {
    var aktivni = document.activeElement;
    // Šipka na zavřeném tlačítku nabídky s role="menu" ji otevře (APG menu button).
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && jeSpoustec(aktivni) && jeMenu(cilPro(aktivni)) && aktivni.getAttribute('aria-expanded') !== 'true') {
      e.preventDefault();
      otevrit(aktivni, e.key === 'ArrowUp');
      return;
    }
    if (!otevrene.length) return;
    var z = otevrene[otevrene.length - 1];
    if (e.key === 'Escape') {
      e.preventDefault();
      nastav(z.spoustec, false, true);
      return;
    }
    if (!jeMenu(z.cil) || !z.cil.contains(aktivni)) return;
    if (e.key === 'Tab') {
      // Tab pokračuje na další prvek stránky, nabídka se zavře.
      nastav(z.spoustec, false, false);
      return;
    }
    var p = polozky(z.cil);
    var i = p.indexOf(aktivni);
    var dalsi = null;
    if (e.key === 'ArrowDown') dalsi = p[(i + 1) % p.length];
    else if (e.key === 'ArrowUp') dalsi = p[(i - 1 + p.length) % p.length];
    else if (e.key === 'Home') dalsi = p[0];
    else if (e.key === 'End') dalsi = p[p.length - 1];
    if (dalsi) {
      e.preventDefault();
      dalsi.focus();
    }
  });

  // Souhrn chyb: odkaz posune do pohledu popisek nebo legendu a pole zaměří bez posunu.
  document.addEventListener('click', function (e) {
    var odkaz = e.target instanceof Element ? e.target.closest('.at-error-summary a[href^="#"]') : null;
    if (!odkaz) return;
    var pole = document.getElementById(decodeURIComponent(odkaz.hash.slice(1)));
    if (!pole) return;
    var popisek = null;
    var skupina = pole.closest('fieldset');
    if (skupina && (pole.type === 'radio' || pole.type === 'checkbox')) popisek = skupina.querySelector('legend');
    if (!popisek && pole.id && pole.labels && pole.labels.length) popisek = pole.labels[0];
    if (!popisek && skupina) popisek = skupina.querySelector('legend');
    e.preventDefault();
    (popisek || pole).scrollIntoView({ block: 'start' });
    pole.focus({ preventScroll: true });
  });

  window.atomysOvladani = { zavritVse: zavritVse };
})();
