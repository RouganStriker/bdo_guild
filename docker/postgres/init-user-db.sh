#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER main WITH PASSWORD 'password' CREATEDB;
    CREATE DATABASE main_dev;
    GRANT ALL PRIVILEGES ON DATABASE main_dev TO main;
EOSQL
