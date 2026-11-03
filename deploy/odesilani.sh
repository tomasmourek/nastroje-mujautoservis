#!/bin/sh
# Spustí odesílací službu účetních sestav na pozadí vedle nginx (naslouchá jen na 127.0.0.1:3000).
# Po pádu ji za 5 s spustí znovu; nginx mezitím vrací na /sestavy/api/ chybu 502.
(
  while true; do
    su-exec nginx node /opt/odesilani/server.mjs
    echo '{"udalost":"restart-odesilani"}' >&2
    sleep 5
  done
) &
