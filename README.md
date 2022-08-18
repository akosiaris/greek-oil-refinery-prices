# greek-oil-distillery-prices

A repo using the Flat Data approach, scraping Greek oil distillery prices from http://oil.gge.gov.gr (note the lack of HTTPS) and assembling them in a number of more usable forms.

# Still in development

This is a work in progress, do not rely on ANYTHING remaining stable

# Process:

A Flat Data Github action approach that uses Deno, Typescript and Github to fetch periodically (eventually 1 per day) data from the RSS feed of [http://oil.gge.gov.gr](http://oil.gge.gov.gr), parses it and appends it to a set of data files (JSON right now)

## Data file description:

STILL WIP

# How to use:

Just go to https://flatgithub.com/akosiaris/greek-oil-distillery-prices , pick the data file you want and get a basic UI for exploring it.

You can also choose to feed it to whatever datastore you like (e.g. I plan to eventually post it to Elasticsearch and graph it via Grafana)

# TODOs:

* Fill in historical data

* Figure out how to parse the really awkward date formats

* Unit tests
