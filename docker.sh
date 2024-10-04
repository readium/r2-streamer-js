#!/bin/sh

docker version

docker info

docker build --progress=plain -f ./Dockerfile -t streamer-docker-image .

#docker image ls

#docker ps -a

(docker stop streamer-docker-container || echo ok_stop) && echo _ok_stop

#(docker kill streamer-docker-container || echo ok_kill) && echo _ok_kill

(docker rm --force streamer-docker-container || echo ok_rm) && echo _ok_rm

docker run -p 3000:3000 --name streamer-docker-container streamer-docker-image

(docker stop streamer-docker-container || echo ok_stop) && echo _ok_stop
docker logs -f streamer-docker-container
docker logs streamer-docker-container
