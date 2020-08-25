@ECHO OFF

CD ..\packages\s3sync

CALL yarn build

CD ..\..\docker

docker stop s3live
docker rm s3live
docker build -t s3live .
