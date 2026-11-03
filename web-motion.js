/* Bez API, cookies a úložišť; běží jen viditelná ukázka. */
(() => {
 const omezenyPohyb = window.matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('[data-motion]').forEach((scena) => {
  const ovladani = scena.querySelector('[data-motion-prehrat]');
  const kroky = [...scena.querySelectorAll('[data-motion-krok]')];
  let krok = 2, prehravat = !omezenyPohyb.matches, viditelna = false, casovac, prvniBeh = true;
  const nastavKrok = (novy) => {
   krok = novy;
   scena.dataset.krok = String(krok);
   kroky.forEach((tlacitko, i) => {
    if (i === krok) tlacitko.setAttribute('aria-current', 'step');
    else tlacitko.removeAttribute('aria-current');
   });
  };
  const synchronizuj = () => {
   clearTimeout(casovac);
   const bezi = prehravat && viditelna && !document.hidden && !omezenyPohyb.matches;
   scena.classList.toggle('motion-bezi', bezi);
   ovladani.textContent = omezenyPohyb.matches ? ovladani.dataset.dalsi : prehravat ? ovladani.dataset.zastavit : ovladani.dataset.spustit;
   ovladani.setAttribute('aria-pressed', String(prehravat && !omezenyPohyb.matches));
   if (bezi) {
    if (prvniBeh) { nastavKrok(0); prvniBeh = false; }
    casovac = setTimeout(() => { nastavKrok((krok + 1) % 3); synchronizuj(); }, krok === 2 ? 4200 : 2400);
   }
  };
  ovladani.hidden = false;
  ovladani.addEventListener('click', () => {
   if (omezenyPohyb.matches) { nastavKrok((krok + 1) % 3); return; }
   prehravat = !prehravat; synchronizuj();
  });
  kroky.forEach((tlacitko, i) => tlacitko.addEventListener('click', () => {
   prehravat = false; prvniBeh = false; nastavKrok(i); synchronizuj();
  }));
  omezenyPohyb.addEventListener('change', () => {
   prehravat = !omezenyPohyb.matches;
   if (omezenyPohyb.matches) nastavKrok(2);
   synchronizuj();
  });
  document.addEventListener('visibilitychange', synchronizuj);
  if ('IntersectionObserver' in window) new IntersectionObserver(([zaznam]) => {
   viditelna = zaznam.isIntersecting; synchronizuj();
  }, { threshold: 0.2 }).observe(scena);
  synchronizuj();
 });
})();
