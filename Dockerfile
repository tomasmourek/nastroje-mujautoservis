# Obraz rozcestníku nastroje.mujautoservis.eu.
#
# Statické soubory: rozcestník a sestavená aplikace účetních sestav v sestavy/. Vedle nginx běží
# odesílací služba sestav (api/, zdroj v repozitáři ic-office-ucetni-sestavy, složka server/),
# které nginx předává /sestavy/api/. Certifikát a doménu řeší Traefik v Coolify, nginx poslouchá
# prostým HTTP na portu 80. SMTP a klíč služby jsou jen v proměnných prostředí v Coolify.
FROM node:24-alpine AS odesilani
WORKDIR /opt/odesilani
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY api/*.mjs ./
COPY api/generated ./generated

FROM node:24-alpine

RUN apk add --no-cache nginx su-exec \
    && mkdir -p /etc/nginx/conf.d /usr/share/nginx/html /var/lib/ic-office-katalog \
    && chown nginx:nginx /var/lib/ic-office-katalog \
    && chmod 700 /var/lib/ic-office-katalog \
    && node -e "const {DatabaseSync}=require('node:sqlite'); new DatabaseSync(':memory:').close()"
COPY --from=odesilani /opt/odesilani /opt/odesilani
COPY deploy/odesilani.sh deploy/spustit.sh /opt/
RUN chmod +x /opt/odesilani.sh /opt/spustit.sh

COPY deploy/nginx-server.conf /etc/nginx/nginx.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html favicon.svg web.css web-motion.js /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
COPY nahledy /usr/share/nginx/html/nahledy
COPY atomys /usr/share/nginx/html/atomys
COPY sestavy /usr/share/nginx/html/sestavy

EXPOSE 80
ENTRYPOINT ["/opt/spustit.sh"]
CMD []
