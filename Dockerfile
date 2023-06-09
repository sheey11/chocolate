FROM golang:1.20.1-alpine AS builder

RUN go env -w GO111MODULE=on && \
    go env -w GOPROXY=https://goproxy.cn,direct

WORKDIR /go/src/github.com/sheey11/chocolate
COPY ./go.mod ./go.mod
COPY ./go.sum ./go.sum
RUN go mod download

COPY . /go/src/github.com/sheey11/chocolate

# VERSION=`git describe --abbrev=0 --tag` \
# BUILD=`git rev-parse --short HEAD`
RUN BUILD="none" \
    VERSION="v0" \
    GOVERSION=`go version | awk '{print $3}'` \
    go build -ldflags "-X main.BUILDVERSION=$VERSION-$BUILD -X main.GOVERSION=$GOVERSION" -o /go/bin/chocolate

# ========================================================

FROM alpine:3 AS runner

WORKDIR /root/
COPY --from=builder /go/bin/chocolate ./chocolate
COPY ./config.yaml ./config.yaml

ENV CHOCOLATE_DB_HOST=localhost
ENV CHOCOLATE_DB_USERNAME=sheey
ENV CHOCOLATE_DB_PASSWORD=""
ENV CHOCOLATE_DB_PORT=5432
ENV CHOCOLATE_DB_DB="chocolate"

EXPOSE 80

ENTRYPOINT ["/root/chocolate"]
CMD ["-m", "-s"]
