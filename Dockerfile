FROM mhart/alpine-node:4
# docker-kassy
# -----------------------------------------------------------------------------
# Alpine Linux containerised version of Kassy ready for deployment
# -----------------------------------------------------------------------------
# Make sure to map your config.json file into /kassy!
# see: kassy/doc/integrations/Facebook.md for the file format
MAINTAINER Matt Hartstonge <matt@mykro.co.nz>

COPY ./ /kassy
RUN apk --no-cache add \
        bash \
        g++ \
        make \
        python \
    && mv /kassy/kassy /usr/bin/kassy \
    && chmod 744 /usr/bin/kassy \
    && cd /kassy \
    && npm install \
    && apk del \
        python \
        make \
        g++

WORKDIR ["/kassy"]
VOLUME ["/kassy/modules/"]
ENTRYPOINT ["kassy"]
CMD ["--fb"]
