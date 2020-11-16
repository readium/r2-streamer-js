
FROM node:10.23-slim

WORKDIR /streamer

COPY . ./

RUN npm install && npm run build

EXPOSE 3000

CMD ./node_modules/cross-env/src/bin/cross-env-shell.js "DEBUG=r2:*" node "./dist/es8-es2017/src/http/server-cli.js" ./misc/epubs/


