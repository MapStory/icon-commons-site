icon-commons-site
=================

## Description

A Django project for an `icon commons` site (see https://github.com/MapStory/icon-commons)

## Developer Setup

Preferably in a virtualenv.

For development purposes, after cloning, first install `icon-commons`.

Assuming `icon-commons` lives as a sibling to this project, `pip install -e ../icon-commons` will set this up.

Then setup this project - `python setup.py develop`

## Post Setup Initialization

Now create the database:

`python manage.py syncdb`

## Running things

Ingest some data:

`python manage.py ingest <directory>`

Run the development server (visit http://localhost:8000/):

`python manage.py runserver`

