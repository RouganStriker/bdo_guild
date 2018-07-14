# BDO Guild
Guild management tool for Black Desert Online using React + Django. View member rosters, node war statistics, and set up parties for node wars.
Authentication is provided via Discord. Supports a number of notification options via Discord webhooks.
Supported BDO Regions are NA, EU, and SEA.

## Setup
To setup locally using docker, run `docker-compose up`.

## Requirements
* Postgres 9.4+
* Node and Yarn
* Python 3.x+

## Crontab Setup
Certain scripts require a crontab set up in ordering to run them periodically.
```
// Sync Discord membership info every 5 minutes
*/5 * * * * python manage.py sync_discord
// Post war teams to Discord via webhook. Supported intervals are 60, 30, and 15 mins before war.
0 * * * * python manage.py post-war-teams 60  // 60 minutes before
30 * * * * python manage.py post-war-teams 30 // 30 minutes before
45 * * * * python manage.py post-war-teams 15 // 15 minutes before
// Optionally add the following to periodically recalculate the aggregated stats in case they get out of sync
0 6 * * * python manage.py recalculate-aggregates
```


Base project build from https://github.com/Seedstars/django-react-redux-base
