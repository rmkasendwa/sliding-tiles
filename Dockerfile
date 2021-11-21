FROM nginx:1.19.1-alpine
RUN apk update
RUN apk add nodejs npm

WORKDIR /app
COPY ./dist/backend/package.json /app/backend/
RUN cd /app/backend/ && npm install
RUN npm install -g pm2
RUN rm -r /etc/nginx/conf.d && rm /etc/nginx/nginx.conf

COPY ./dist/backend/. /app/backend
COPY ./dist/main-ui/. /app/main-ui/public
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.template
COPY ./entryscript.sh /

RUN chown -R nginx:nginx /app/main-ui/public/
RUN chmod -R 755 /app/main-ui/public/
RUN chmod +x /entryscript.sh

EXPOSE 3000
EXPOSE 3001

ENTRYPOINT ["sh","/entryscript.sh"]
CMD ["nginx","-g","daemon off;"]