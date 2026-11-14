#!/bin/sh
# Spustí odesílací službu účetních sestav na pozadí vedle nginx (naslouchá jen na 127.0.0.1:3000).
# Po pádu ji za 5 s spustí znovu; nginx mezitím vrací na /sestavy/api/ chybu 502.
set -eu
umask 077
api_pid=
konci() {
  trap - TERM INT
  if [ -n "$api_pid" ]; then
    kill -TERM "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  exit 0
}
trap konci TERM INT
while true; do
  su-exec nginx node /opt/odesilani/server.mjs &
  api_pid=$!
  wait "$api_pid" || true
  api_pid=
  echo '{"udalost":"restart-odesilani"}' >&2
  sleep 5 &
  api_pid=$!
  wait "$api_pid" || true
  api_pid=
done
