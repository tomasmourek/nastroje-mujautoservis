#!/bin/sh
set -eu
umask 077

# Cesta je pevná, aby se při přípravě volume nesahala na jiné adresáře kontejneru.
if [ -n "${KATALOG_DATA_DIR:-}" ] && [ "$KATALOG_DATA_DIR" != /var/lib/ic-office-katalog ]; then
  echo '{"udalost":"neplatna-cesta-katalogu"}' >&2
  exit 1
fi
mkdir -p /var/lib/ic-office-katalog
chown nginx:nginx /var/lib/ic-office-katalog
chmod 700 /var/lib/ic-office-katalog
nginx -t

/opt/odesilani.sh &
api_pid=$!
nginx -g 'daemon off;' &
nginx_pid=$!
konci() {
  trap - TERM INT
  kill -TERM "$nginx_pid" "$api_pid" 2>/dev/null || true
  wait "$nginx_pid" 2>/dev/null || true
  wait "$api_pid" 2>/dev/null || true
}
trap 'konci; exit 0' TERM INT
vysledek=0
wait "$nginx_pid" || vysledek=$?
konci
exit "$vysledek"
