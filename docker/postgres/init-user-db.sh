#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER bdo WITH PASSWORD 'password' CREATEDB;
    CREATE DATABASE bdo;
    GRANT ALL PRIVILEGES ON DATABASE bdo TO bdo;
EOSQL
