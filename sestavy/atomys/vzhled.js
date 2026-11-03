/* Atomys Design Language — volba vzhledu, motivu a hustoty bez bliknutí.
 *
 * Vložte do <head> před styly jako externí skript (projde CSP script-src 'self'):
 *   <script src="/atomys/vzhled.js"></script>
 *
 * Tři volby uživatele se zapisují jako atributy na <html>:
 *   data-vzhled   tiskopis | dilna | atomys          (výchozí tiskopis)
 *   data-theme    light | dark         (bez atributu platí motiv systému)
 *   data-hustota  kancelar | dilna | dotyk          (výchozí kancelar)
 *
 * Pořadí přednosti při načtení: atribut, který už na <html> vykreslil server (volba
 * uložená u uživatele), potom localStorage, potom výchozí hodnota. Server, který volbu
 * ukládá, vykreslí motiv Systém jako data-theme="system"; bez atributu data-theme platí
 * volba z prohlížeče. Volba se do localStorage ukládá až ve chvíli, kdy ji uživatel změní.
 *
 * Pevný vzhled: <html data-vzhled-pevny> mají plochy, které nepřebírají volbu prohlížejícího
 * (web produktu, e-mail, veřejná rezervace a platba, přihlášení). Vzhled a hustota se berou
 * jen z atributů <html> (bez nich výchozí), localStorage se pro ně nečte ani nezapisuje
 * a nastavit() je nezmění. Motiv vykreslený serverem je na takové stránce také pevný;
 * bez něj platí motiv systému nebo volba motivu na stránce.
 *
 * Volitelné atributy skriptu:
 *   data-klic-motiv="upravapp_theme"   převezme dosavadní klíč motivu projektu
 *
 * API:
 *   atomysVzhled.stav()                 → { vzhled, motiv, hustota, efektivniMotiv }
 *   atomysVzhled.nastavit({ vzhled?, motiv?, hustota? })
 *   atomysVzhled.pripojit(prvek)        napojí přepínače name="vzhled|motiv|hustota" uvnitř prvku
 * Formulář form.at-volba-vzhledu a prvek s atributem data-atomys-volba se napojí samy po
 * načtení stránky, vložený skript na stránce proto není potřeba.
 *
 * Každá změna vyvolá na document událost "atomys:vzhled"; detail je stav a zdroj změny:
 *   zdroj: 'uzivatel'   volba na této stránce (nastavit, napojený formulář)
 *          'jine-okno'  volba z jiného okna nebo karty téže aplikace
 *          'system'     přepnutí tmavého režimu systému při motivu Systém
 * K uživateli ukládejte jen zdroj 'uzivatel', jinak by se volba zapisovala při každém
 * přepnutí systému a jednou za každé otevřené okno.
 */
(function () {
  var VZHLEDY = ["tiskopis","dilna","atomys"];
  var HUSTOTY = ["kancelar","dilna","dotyk"];
  var VYCHOZI = { vzhled: 'tiskopis', motiv: 'system', hustota: 'kancelar' };
  var PREVOD_MOTIVU = { light: 'light', dark: 'dark', svetly: 'light', tmavy: 'dark', system: 'system', auto: 'system' };

  var skript = document.currentScript;
  var koren = document.documentElement;
  var KLICE = {
    vzhled: 'atomys-vzhled',
    motiv: (skript && skript.getAttribute('data-klic-motiv')) || 'atomys-motiv',
    hustota: 'atomys-hustota',
  };
  var ATRIBUT = { vzhled: 'data-vzhled', motiv: 'data-theme', hustota: 'data-hustota' };

  function platne(druh, hodnota) {
    if (druh === 'motiv') return PREVOD_MOTIVU[hodnota] || null;
    var seznam = druh === 'vzhled' ? VZHLEDY : HUSTOTY;
    return seznam.indexOf(hodnota) >= 0 ? hodnota : null;
  }

  function ulozeno(druh) {
    try {
      return platne(druh, localStorage.getItem(KLICE[druh]));
    } catch (e) {
      return null;
    }
  }

  // Atribut vykreslený serverem má přednost před localStorage.
  var serverem = {
    vzhled: platne('vzhled', koren.getAttribute(ATRIBUT.vzhled)),
    motiv: platne('motiv', koren.getAttribute(ATRIBUT.motiv)),
    hustota: platne('hustota', koren.getAttribute(ATRIBUT.hustota)),
  };
  var pevny = koren.hasAttribute('data-vzhled-pevny');
  // Na stránce s pevným vzhledem se vzhled a hustota nemění vůbec, motiv jen tehdy, když ho
  // nevykreslil server.
  function zamceno(druh) {
    return pevny && (druh !== 'motiv' || !!serverem.motiv);
  }
  function vychozi(druh) {
    return serverem[druh] || (zamceno(druh) ? null : ulozeno(druh)) || VYCHOZI[druh];
  }
  var stavVolby = { vzhled: vychozi('vzhled'), motiv: vychozi('motiv'), hustota: vychozi('hustota') };

  function pouzij() {
    koren.setAttribute(ATRIBUT.vzhled, stavVolby.vzhled);
    koren.setAttribute(ATRIBUT.hustota, stavVolby.hustota);
    if (stavVolby.motiv === 'system') koren.removeAttribute(ATRIBUT.motiv);
    else koren.setAttribute(ATRIBUT.motiv, stavVolby.motiv);
  }

  function efektivniMotiv() {
    if (stavVolby.motiv !== 'system') return stavVolby.motiv;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function stav() {
    return { vzhled: stavVolby.vzhled, motiv: stavVolby.motiv, hustota: stavVolby.hustota, efektivniMotiv: efektivniMotiv() };
  }

  var napojene = [];
  function oznam(zdroj) {
    var detail = stav();
    detail.zdroj = zdroj;
    for (var i = 0; i < napojene.length; i++) zaskrtni(napojene[i]);
    var udalost;
    try {
      udalost = new CustomEvent('atomys:vzhled', { detail: detail });
    } catch (e) {
      udalost = document.createEvent('CustomEvent');
      udalost.initCustomEvent('atomys:vzhled', false, false, detail);
    }
    document.dispatchEvent(udalost);
  }

  var kanal = null;
  try {
    if ('BroadcastChannel' in window) kanal = new BroadcastChannel('atomys-vzhled');
  } catch (e) {}

  function nastavit(zmena, zOkna) {
    var zmeneno = false;
    for (var druh in ATRIBUT) {
      if (!zmena || zmena[druh] === undefined || zamceno(druh)) continue;
      var h = platne(druh, zmena[druh]);
      if (!h || h === stavVolby[druh]) continue;
      stavVolby[druh] = h;
      zmeneno = true;
      if (!zOkna) {
        try {
          if (druh === 'motiv' && h === 'system') localStorage.removeItem(KLICE[druh]);
          else localStorage.setItem(KLICE[druh], h);
        } catch (e) {}
      }
    }
    if (!zmeneno) return stav();
    pouzij();
    if (kanal && !zOkna) kanal.postMessage(stav());
    oznam(zOkna ? 'jine-okno' : 'uzivatel');
    return stav();
  }

  function zaskrtni(prvek) {
    for (var druh in ATRIBUT) {
      var volby = prvek.querySelectorAll('input[name="' + druh + '"]');
      for (var i = 0; i < volby.length; i++) volby[i].checked = volby[i].value === stavVolby[druh];
    }
  }

  function pripojit(prvek) {
    if (!prvek || napojene.indexOf(prvek) >= 0) return;
    napojene.push(prvek);
    zaskrtni(prvek);
    prvek.addEventListener('change', function (e) {
      var cil = e.target;
      if (cil && ATRIBUT[cil.name] && cil.checked) {
        var zmena = {};
        zmena[cil.name] = cil.value;
        nastavit(zmena);
      }
    });
  }

  pouzij();

  if (kanal) {
    kanal.onmessage = function (zprava) {
      nastavit(zprava.data, true);
    };
  }
  window.addEventListener('storage', function (e) {
    for (var druh in KLICE) {
      if (e.key === KLICE[druh]) {
        var z = {};
        z[druh] = platne(druh, e.newValue) || VYCHOZI[druh];
        nastavit(z, true);
      }
    }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var zmenaSystemu = function () {
      if (stavVolby.motiv === 'system') oznam('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', zmenaSystemu);
    else if (mq.addListener) mq.addListener(zmenaSystemu);
  }

  // Formulář volby vzhledu se napojí sám, stránka nepotřebuje vložený skript (CSP 'self').
  function napojFormulare() {
    var formulare = document.querySelectorAll('form.at-volba-vzhledu, [data-atomys-volba]');
    for (var i = 0; i < formulare.length; i++) pripojit(formulare[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', napojFormulare);
  else napojFormulare();

  window.atomysVzhled = { stav: stav, nastavit: function (z) { return nastavit(z, false); }, pripojit: pripojit };
})();
