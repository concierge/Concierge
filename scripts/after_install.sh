#!/usr/bin/env bash
set -e

#POSTGRESQL_URL="postgresql://postgres:postgres@concierge.ccyxjykvxqyi.us-west-2.rds.amazonaws.com:5432/concierge"

sudo chown -R ubuntu:ubuntu /home/ubuntu/concierge
sudo chmod -R 755 /home/ubuntu/concierge

cd /home/ubuntu/concierge

# install dependancies
npm install

# set DB ENV VAR
# fixme work out a way to have the database url as a input variable into the script, from the deployment server.
#echo "export DATABASE_URL=$POSTGRESQL_URL" >> ~/.bash_profile

# run program for the first time

#node main.js --debug 

# kpm install postgresql
# kpm uninstall config
# kpm uninstall kpm

# stop application