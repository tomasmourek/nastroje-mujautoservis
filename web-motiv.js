/* Přepínač motivu jako v archiv.mujautoservis.eu: vlevo tmavý, vpravo světlý. Ukazuje motiv, který právě
   platí; dokud si návštěvník nevybere, řídí se systémem a prvním přepnutím se volba uloží. */
var prepinac = document.getElementById("prepinac-motivu");
var poloha = prepinac.querySelector(".prepinac-poloha");
function vykresliPrepinac() {
  var tmavy = atomysVzhled.stav().efektivniMotiv === "dark";
  prepinac.dataset.motivPlatny = tmavy ? "tmavy" : "svetly";
  poloha.setAttribute("aria-checked", String(tmavy));
  poloha.title = tmavy
    ? "Přepnout na světlý režim"
    : "Přepnout na tmavý režim";
}
poloha.addEventListener("click", function () {
  var tmavy = atomysVzhled.stav().efektivniMotiv === "dark";
  atomysVzhled.nastavit({ motiv: tmavy ? "light" : "dark" });
});
// Šipky míří na polohu, ne na pořadí: vlevo je tmavý, vpravo světlý.
poloha.addEventListener("keydown", function (u) {
  if (u.key !== "ArrowLeft" && u.key !== "ArrowRight") return;
  u.preventDefault();
  atomysVzhled.nastavit({
    motiv: u.key === "ArrowLeft" ? "dark" : "light",
  });
});
document.addEventListener("atomys:vzhled", vykresliPrepinac);
vykresliPrepinac();
