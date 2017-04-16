#!/usr/bin/env bash
set -e

# update instance
apt-get update

# add nodejs to yum
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
apt-get install -y nodejs tmux