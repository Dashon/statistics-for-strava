#!/bin/sh
set -e

# Copy Render Secret File to expected location (if it exists)
if [ -f "/etc/secrets/config.yaml" ]; then
    echo "Copying Render Secret File to config location..."
    mkdir -p /var/www/config/app
    cp /etc/secrets/config.yaml /var/www/config/app/config.yaml
    echo "Config file copied successfully"
fi

if [ -n "$PUID" ] && [ -n "$PGID" ] && [ "$(id -u)" = "0" ]; then
    echo "Setting permissions for PUID=$PUID PGID=$PGID..."

    chown -R "$PUID:$PGID" \
        /var/www \
        /config/caddy \
        /data/caddy || true

    echo "Permissions have been set"
fi

exec "$@"