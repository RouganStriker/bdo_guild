# BDO Guild
Guild management tool for Black Desert Online using React + Django. View member rosters, node war statistics, and set up parties for node wars.
Authentication is provided via Discord. Supports a number of notification options via Discord webhooks.

# Installation
## Requirements
* Postgres 9.4+
* Node and Yarn
* Python 3.x+

Install python dependencies using `pip install -r dependencies`
Install JS dependencies using `yarn install`

# Setup
Start up the python server using `python manage.py runserver`.
Use `yarn run dev` to serve JS files in development, use `yarn run prod` to compile JS files for production.

## Crontab
Configure the following scripts to run via a cronjob
`python manage.py sync_discord`
`python manage.py post-war-teams`

Base project build from https://github.com/Seedstars/django-react-redux-base
