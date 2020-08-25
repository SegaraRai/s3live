#!/bin/bash

/live/s3sync /live/data/${STREAM_KEY}.m3u8 &

echo ready.

nginx
