import net from "node:net";
import { domainToASCII } from "node:url";
import nodemailer from "nodemailer";
import addressparser from "nodemailer/lib/addressparser";
import SMTPConnection from "nodemailer/lib/smtp-connection";

export const LIMITY_SMTP = Object.freeze({
  celkem: 240_000,
  spojeni: 30_000,
  pozdrav: 15_000,
  neaktivita: 60_000,
});

export class ChybaPosty extends Error {
  constructor() {
    super("Odeslání e-mailu nebylo jednoznačně potvrzeno. Před dalším pokusem ověřte stav odeslání.");
    this.name = "ChybaPosty";
    this.kod = "SMTP_NEJISTE";
  }
}

function adresa(hodnota) {
  if (typeof hodnota !== "string" || /[\r\n]/.test(hodnota)) throw new ChybaPosty();
  const casti = hodnota.split("@");
  if (casti.length !== 2 || !casti[0] || /\s/.test(casti[0])) throw new ChybaPosty();
  const domena = domainToASCII(casti[1]).toLowerCase();
  if (!domena || /[\s<>]/.test(domena)) throw new ChybaPosty();
  return `${casti[0]}@${domena}`;
}

function adresy(hodnota) {
  const polozky = Array.isArray(hodnota) ? hodnota : [hodnota];
  return polozky.flatMap((polozka) => {
    if (typeof polozka !== "string" || /[\r\n]/.test(polozka)) throw new ChybaPosty();
    const rozebrane = addressparser(polozka, { flatten: true });
    if (!rozebrane.length) throw new ChybaPosty();
    return rozebrane.map((p) => adresa(p.address));
  });
}

function potvrzeno(info, prijemci) {
  if (!Array.isArray(info?.accepted) || !Array.isArray(info.rejected) || info.rejected.length) return false;
  try {
    const prijato = new Set(info.accepted.map(adresa));
    return prijato.size === prijemci.length && prijemci.every((a) => prijato.has(a));
  } catch {
    return false;
  }
}


// Nodemailer SMTPTransport navenek nezpřístupní spojení a jeho close() je neruší.
// Vlastní transport ponechává skládání zprávy Nodemaileru, ale drží aktuální
// SMTPConnection včetně TLS socketu. Pouhé zničení původního TCP socketu po
// STARTTLS nestačí: TLS převezme síťový handle.
export function vytvoritSmtpTransport(options) {
  let spojeni;
  let zavreno = false;
  return nodemailer.createTransport({
    name: "ucetni-smtp", version: "1",
    send(mail, callback) {
      let hotovo = false;
      const dokoncit = (err, info) => {
        if (hotovo) return;
        hotovo = true;
        spojeni?.close();
        callback(err, info);
      };
      options.getSocket(options, (err, info) => {
        if (err || zavreno) return dokoncit(new ChybaPosty());
        spojeni = new SMTPConnection({ ...options, connection: info.connection });
        spojeni.once("error", (err) => dokoncit(err));
        spojeni.once("end", () => dokoncit(new ChybaPosty()));
        const odeslat = () => {
          if (zavreno || hotovo) return;
          try {
            spojeni.send(mail.message.getEnvelope(), mail.message.createReadStream(), dokoncit);
          } catch (err) { dokoncit(err); }
        };
        spojeni.connect(() => {
          if (zavreno || hotovo) return;
          try {
            if (options.auth) spojeni.login(options.auth, (err) => err ? dokoncit(err) : odeslat());
            else odeslat();
          } catch (err) { dokoncit(err); }
        });
      });
    },
    close() {
      zavreno = true;
      // SMTPConnection.close() používá end() a odložené destroy(). Pro tvrdý
      // termín a uvolnění lease ničíme aktuální socket hned, i během TLS handshake.
      spojeni?._socket?.destroy();
      spojeni?.close();
    },
  });
}

/** Jeden transport a vlastní socket na pokus; žádný pool ani automatické opakování. */
export function vytvoritPostu({ host, port = 587, user, password, from }, factory = vytvoritSmtpTransport) {
  if (typeof host !== "string" || !host || !Number.isInteger(port) || port < 1 || port > 65535) throw new ChybaPosty();
  const odesilatele = adresy(from);
  if (odesilatele.length !== 1) throw new ChybaPosty();
  const rozpracovane = new Set();
  let zavreno = false;

  async function odeslat(zprava) {
    if (zavreno || !zprava || typeof zprava !== "object" || zprava.envelope) throw new ChybaPosty();
    const prijemci = [...new Set([
      ...adresy(zprava.to),
      ...(zprava.cc ? adresy(zprava.cc) : []),
      ...(zprava.bcc ? adresy(zprava.bcc) : []),
    ])];
    if (!prijemci.length) throw new ChybaPosty();

    return new Promise((resolve, reject) => {
      let transport;
      let socket;
      let spojovaciCasovac;
      let ukonceno = false;
      let socketVyuzit = false;
      const controller = new AbortController();
      const ukoncit = (info, chyba = false) => {
        if (ukonceno) return;
        ukonceno = true;
        clearTimeout(casovac);
        clearTimeout(spojovaciCasovac);
        rozpracovane.delete(zrusit);
        // SMTPTransport.close() aktivní spojení neruší. Vlastní socket je nutné
        // zničit i po výsledku sendMail, ještě před uvolněním odesílacího lease.
        controller.abort();
        socket?.destroy();
        try { transport?.close(); } catch { /* Socket už nemůže odesílat. */ }
        if (chyba || !potvrzeno(info, prijemci)) reject(new ChybaPosty());
        else resolve({ accepted: [...prijemci], rejected: [] });
      };
      const zrusit = () => ukoncit(null, true);
      const casovac = setTimeout(zrusit, LIMITY_SMTP.celkem);
      rozpracovane.add(zrusit);
      try {
        transport = factory({
          host, port, secure: port === 465, requireTLS: true, pool: false,
          auth: user ? { user, pass: password } : undefined,
          connectionTimeout: LIMITY_SMTP.spojeni,
          greetingTimeout: LIMITY_SMTP.pozdrav,
          socketTimeout: LIMITY_SMTP.neaktivita,
          dnsTimeout: LIMITY_SMTP.spojeni,
          logger: false, debug: false,
          getSocket(_options, callback) {
            if (ukonceno || socketVyuzit) return callback(new ChybaPosty());
            socketVyuzit = true;
            let odpovezeno = false;
            const dokoncitSpojeni = (err) => {
              if (odpovezeno) return;
              odpovezeno = true;
              clearTimeout(spojovaciCasovac);
              if (ukonceno || err) {
                socket?.destroy();
                callback(new ChybaPosty());
              } else callback(null, { connection: socket });
            };
            socket = net.createConnection({ host, port, signal: controller.signal });
            // Vlastní socket zahrnuje i DNS. Pozdní chyby po zrušení nejsou logovány.
            socket.on("error", dokoncitSpojeni);
            socket.once("connect", () => dokoncitSpojeni());
            spojovaciCasovac = setTimeout(() => {
              dokoncitSpojeni(new ChybaPosty());
              zrusit();
            }, LIMITY_SMTP.spojeni);
          },
        });
        Promise.resolve().then(() => {
          if (ukonceno) return;
          return transport.sendMail({
            ...zprava, from,
            envelope: { from: odesilatele[0], to: prijemci },
          });
        }).then((info) => ukoncit(info), () => zrusit());
      } catch {
        zrusit();
      }
    });
  }

  function zavrit() {
    zavreno = true;
    for (const zrusit of [...rozpracovane]) zrusit();
  }

  return { odeslat, zavrit };
}
