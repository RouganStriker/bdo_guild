#!/bin/bash

until cd src
do
    echo "Waiting for django volume..."
done

until python manage.py migrate --settings=main.settings.dev_docker
do
    echo "Waiting for postgres ready..."
    sleep 2
done

// Base Data
python manage.py loaddata fixtures/content.json --settings=main.settings.dev_docker
// Default User
python manage.py loaddata fixtures/user.json --settings=main.settings.dev_docker

python manage.py runserver 0.0.0.0:8000 --settings=main.settings.dev_docker
