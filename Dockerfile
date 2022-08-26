FROM node:16

WORKDIR /streamer

COPY . ./

RUN npm ci && npm run build

EXPOSE 3000

CMD ./node_modules/cross-env/src/bin/cross-env-shell.js "DEBUG=r2:* STREAMER_WATCH=0 STREAMER_DISABLE_EXPIRY=1" node "./dist/es8-es2017/src/http/server-cli.js" ./misc/epubs/
