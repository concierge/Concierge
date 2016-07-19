FROM mhart/alpine-node:4
# docker-concierge
# -----------------------------------------------------------------------------
# Alpine Linux containerised version of Concierge ready for deployment
# -----------------------------------------------------------------------------
# For documentation on how to work with docker-concierge see: docs/docker-concierge.md
MAINTAINER Matt Hartstonge <matt@mykro.co.nz>

COPY ./ /concierge-docker
RUN apk --no-cache add \
        bash \
        g++ \
        make \
        python \
    && mv /concierge/concierge /usr/bin/concierge \
    && chmod 744 /usr/bin/concierge \
    && cd /concierge \
    && npm install \
    && apk del \
        python \
        make \
        g++

WORKDIR ["/concierge"]
VOLUME ["/concierge/modules/"]
ENTRYPOINT ["concierge"]
