FROM tiangolo/nginx-rtmp

RUN mkdir -p /live/data

COPY nginx.conf /etc/nginx
RUN chmod 0644 /etc/nginx/nginx.conf

COPY s3sync /live
RUN chmod 0755 /live/s3sync

COPY entrypoint.sh /
RUN chmod 0755 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
