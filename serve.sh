#!/bin/bash
source /root/.bashrc
source /root/.env
nvm use v14.17.2
nohup node app.js &