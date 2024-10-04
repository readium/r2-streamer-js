FROM node:20

WORKDIR /streamer

# rm -rf /streamer/* &&\
# RUN ls -alsR /streamer

COPY ./.editor* /streamer/
COPY ./.eslint* /streamer/
COPY ./.npm* /streamer/
COPY ./.gitignore* /streamer/
COPY ./.prettier* /streamer/
COPY ./.slugignore* /streamer/
COPY ./package* /streamer/
COPY ./tsconfig* /streamer/

ADD ./.git /streamer/.git
ADD ./misc /streamer/misc
ADD ./src /streamer/src
ADD ./tools /streamer/tools
ADD ./tsconfigs /streamer/tsconfigs

# RUN ls -alsR /streamer

RUN arch &&\
    uname &&\
    npm install -g npm@10.x &&\
    node --version &&\
    npm --version

RUN cd /streamer/ &&\
    npm ci && npm run build

EXPOSE 3000

CMD ./node_modules/cross-env/src/bin/cross-env-shell.js "DEBUG=r2:* NODE_ENV=development STREAMER_WATCH=0 STREAMER_DISABLE_EXPIRY=1" node "./dist/es8-es2017/src/http/server-cli.js" ./misc/epubs/
