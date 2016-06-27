FROM node:6-slim

WORKDIR /var/www/
COPY . /var/www/

EXPOSE 3005
CMD ["node", "carto-serve.js", "-p", "3005"]