FROM mhart/alpine-node:4
# docker-kassy
# -----------------------------------------------------------------------------
# Alpine Linux containerised version of Kassy ready for deployment
# -----------------------------------------------------------------------------
# For documentation on how to work with docker-kassy see: docs/docker-kassy.md
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
