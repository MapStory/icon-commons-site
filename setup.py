#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

try:
    readme_text = file('README.rst', 'rb').read()
except IOError,e:
    readme_text = ''

setup(name = "django-icon-commons-site",
    version = "0.0.1",
    description = "Icon Commons Site",
    long_description = readme_text,
    keywords = "",
    license = "",
    url = "",
    author = "Ian Schneider",
    author_email = "ischneider@boundlessgeo.com",
    install_requires = [
        "Django >=1.6.1, <=1.6.5",
    ],
    classifiers = [
    ],
)

