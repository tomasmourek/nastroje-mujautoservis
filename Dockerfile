# Obraz rozcestníku nastroje.mujautoservis.eu.
#
# Jen statické soubory: rozcestník a sestavená aplikace účetních sestav v sestavy/.
# Certifikát a doménu řeší Traefik v Coolify, nginx poslouchá prostým HTTP na portu 80.
FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html favicon.svg web.css web-motion.js /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
COPY nahledy /usr/share/nginx/html/nahledy
COPY atomys /usr/share/nginx/html/atomys
COPY sestavy /usr/share/nginx/html/sestavy

EXPOSE 80
