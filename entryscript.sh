#!/bin/sh
pm2 start /app/backend/index.js;
envsubst '$${PORT},$${RESOLVER_IP},$${BACKEND_URL}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf;
exec "$@"
