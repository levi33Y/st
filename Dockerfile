FROM nginx:stable-alpine

COPY /release /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i '/^http {/a \
    gzip on;\n\
    gzip_static on;' /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
