#!/bin/bash

# Update package manager and install required packages
sudo yum update -y
sudo yum install -y docker

# Start the Docker service
sudo systemctl start docker

# setup caddy server
curl -sS https://webi.sh/caddy | sh
caddy version

caddy reverse-proxy --to :3000