// Spuštění odesílací služby. Naslouchá jen na 127.0.0.1, zvenku je dostupná přes nginx (/sestavy/api/).
// Údaje ke společné adrese a otisky přístupových kódů jsou jen v proměnných prostředí
// kontejneru (Coolify), nikdy v repozitáři; údaje ke schránce uživatele přicházejí
// s požadavkem a po odeslání se zahodí.
import { lookup } from "node:dns/promises";
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { nacistKody, verejnaAdresa, vytvoritObsluhu } from "./odeslani.mjs";

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASSWORD,
  MAIL_FROM,
  PRISTUPOVE_KODY,
} = process.env;

const kody = nacistKody(PRISTUPOVE_KODY);

const posta =
  SMTP_HOST && MAIL_FROM
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
      })
    : null;

const obsluha = vytvoritObsluhu({
  kody,
  odeslat: posta ? (z) => posta.sendMail({ from: MAIL_FROM, ...z }) : null,
  odeslatVlastni: async (s, z) => {
    const posta = nodemailer.createTransport({
      host: await verejnaAdresa(s.server, lookup),
      port: s.port,
      secure: s.port === 465,
      requireTLS: true,
      tls: { servername: s.server },
      auth: { user: s.uzivatel, pass: s.heslo },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 60_000,
    });
    try {
      await posta.sendMail(z);
    } finally {
      posta.close();
    }
  },
});

createServer((req, res) => {
  obsluha(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
}).listen(3000, "127.0.0.1", () =>
  console.log(
    JSON.stringify({
      udalost: "start",
      smtp: !!posta,
      kody: kody.size,
    }),
  ),
);
