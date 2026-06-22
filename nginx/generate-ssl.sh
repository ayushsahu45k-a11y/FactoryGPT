#!/bin/sh
# Shell script to generate self-signed SSL certificates for local HTTPS testing
set -e

SSL_DIR="./nginx/ssl"
mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/factorygpt.crt" ] && [ -f "$SSL_DIR/factorygpt.key" ]; then
    echo "[✔] SSL Certificate already exists at $SSL_DIR. Skipping generation."
    exit 0
fi

echo "[⚙] Generating professional self-signed SSL certificate for FactoryGPT..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/factorygpt.key" \
    -out "$SSL_DIR/factorygpt.crt" \
    -subj "/C=US/ST=State/L=PlantFloor/O=FactoryGPT/OU=IndustrialOperations/CN=localhost"

chmod 600 "$SSL_DIR/factorygpt.key"
chmod 644 "$SSL_DIR/factorygpt.crt"

echo "[✔] SSL Certificate (factorygpt.crt) and key (factorygpt.key) successfully generated!"
