// Spuštění odesílací služby. Naslouchá jen na 127.0.0.1, zvenku je dostupná přes nginx (/sestavy/api/).
// Přístupové údaje jsou jen v proměnných prostředí kontejneru (Coolify), nikdy v repozitáři.
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { vytvoritObsluhu } from "./odeslani.mjs";

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASSWORD,
  MAIL_FROM,
  ODESILACI_KLIC,
} = process.env;

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
  klic: ODESILACI_KLIC,
  odeslat: posta ? (z) => posta.sendMail({ from: MAIL_FROM, ...z }) : null,
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
      klic: (ODESILACI_KLIC ?? "").length >= 16,
    }),
  ),
);
