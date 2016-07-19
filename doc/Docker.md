# Docker

Thanks to docker, your personal chat-bot can be contained and readily deployed wherever, for an experience that is consistent on all platforms!

## docker-concierge Quickstart
### Prerequisites
First, ensure you have docker-engine installed for your platform. See the [Docker installation docs][did].

### Configuration
Once docker-engine is up and running, there are a number of arguments to control the platforms that your bot will integrate with. For each specific platform see the relevant documentation. To get started, all that is required is a valid config.json file plus a switch that references a given platform.

#### Platform config.json specification documentation
* [Facebook][fb]
* [Messenger][me]
* [Skype][sk]
* [Slack][sl]
* [Telegram][tg]
* [Testing][ts]

### Run docker-concierge
#### Interactive Start
The docker -it switch will start an interactive teletype session where you can see everything that is happening within the container as Concierge starts up.

```sh
docker run -it \
  -v /path/to/config.json:/kassy/config.json \
  concierge/docker-kassy facebook
```

#### Start in daemon mode
The -d switch will start Kassy in daemon mode (runs in the background). Again, make sure to mount your specific config as needed, per integration.

```sh
docker run -d \
  --restart="always" \
  -v /path/to/config.json:/kassy/config.json \
  concierge/docker-kassy slack telegram
```

## Build docker-kassy
### Vanilla build
In the root of the kassy repository is the Dockerfile. Once in the repository folder, as a user who is in the Docker group, run:

```sh
$ docker build -t <youruser>/kassy:latest .
```

This will give you a pristine Kassy, ready to make some 100% more productive while also allowing to make others 100% more unproductive.

### Customised build
If you want to change what is available, alter the dockerfile to suit, or bake your config into the image by using the copy command.

```sh
...
COPY ./ /kassy
COPY config.json /kassy/config.json
RUN apk --no-cache add \
        bash \
        g++ \
...
```

## Debug docker-kassy
### Built-in debug tools
Kassy comes with all the tools to debug and test as per normal. Since container storage is ephemeral, using the docker image maybe advantageous to your testing workflow.

```sh
docker run -it \
  -v /path/to/config.json:/kassy/config.json \
  concierge/docker-kassy test --log --debug --timestamp
```

### Getting terminal with docker-kassy
Docker provides a way to start bash inside a running container using the 'exec' command. If you are starting with a fresh container, you can skip this and use the cmd command.

```sh
docker -it \
  -v /path/to/config.json:/kassy/config.json \
  concierge/docker-kassy cmd
c1asd1737-#bash-4.2 $ echo "hello kassy"
hello kassy
```

If you already have a running container, use exec
```sh
$ docker ps
CONTAINER ID    ...
c1asd1737       ...

$ docker exec -it c1asd1737 bash
c1asd1737-#bash-4.2 $ echo "hello kassy"
hello kassy
```

docker-kassy Version
----
0.3.0

License
----

MIT


[//]: # (Local docs)
[fb]: <integrations/Facebook.md>
[me]: <integrations/Messenger.md>
[sk]: <integrations/Skype.md>
[sl]: <integrations/Slack.md>
[tg]: <integrations/Telegram.md>
[ts]: <integrations/Testing.md>
[//]: # (External Links)
[did]: <https://docs.docker.com/engine/installation/>
