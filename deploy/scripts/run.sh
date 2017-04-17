#!/usr/bin/env bash

cd /home/ubuntu/concierge
tmux new-session -d -s concierge '/usr/bin/node /home/ubuntu/concierge/main.js --debug --log --timestamp test'