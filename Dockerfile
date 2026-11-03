# Obraz rozcestníku nastroje.mujautoservis.eu.
#
# Statické soubory: rozcestník a sestavená aplikace účetních sestav v sestavy/. Vedle nginx běží
# odesílací služba sestav (api/, zdroj v repozitáři ic-office-ucetni-sestavy, složka server/),
# které nginx předává /sestavy/api/. Certifikát a doménu řeší Traefik v Coolify, nginx poslouchá
# prostým HTTP na portu 80. SMTP a klíč služby jsou jen v proměnných prostředí v Coolify.
FROM node:22-alpine AS odesilani
WORKDIR /opt/odesilani
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY api/odeslani.mjs api/server.mjs ./

FROM nginx:1.27-alpine

RUN apk add --no-cache nodejs su-exec
COPY --from=odesilani /opt/odesilani /opt/odesilani
COPY deploy/odesilani.sh /docker-entrypoint.d/90-odesilani.sh
RUN chmod +x /docker-entrypoint.d/90-odesilani.sh

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html favicon.svg web.css web-motion.js /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
COPY nahledy /usr/share/nginx/html/nahledy
COPY atomys /usr/share/nginx/html/atomys
COPY sestavy /usr/share/nginx/html/sestavy

EXPOSE 80
