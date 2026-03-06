#!/bin/sh
set -e
host="$1"
port="$2"

nc -z "$host" "$port"
