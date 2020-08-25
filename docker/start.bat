@ECHO OFF

IF "%1"=="" (
  ECHO usage: start.bat "[s3_bucket_name]/[stream_id]"
  EXIT /B
)

docker stop s3live

REM docker run --name s3live --rm -p 1935:1935 -p 8881:80 -e STREAM_KEY=stream -e "S3_BUCKET_PATH=%~1" --env-file .env s3live
docker run --name s3live --rm -p 1935:1935 -e STREAM_KEY=stream -e "S3_BUCKET_PATH=%~1" --env-file .env s3live

docker stop s3live
