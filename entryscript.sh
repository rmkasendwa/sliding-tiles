#!/bin/sh
cd /app/backend && pm2 start index.js;
envsubst '$${PORT},$${RESOLVER_IP},$${BACKEND_URL}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf;
exec "$@"
