# greek-oil-refinery-prices

A repo using the Flat Data approach, scraping Greek oil refinery prices from http://oil.gge.gov.gr (note the lack of HTTPS) and assembling them in a number of more usable forms.

# Still in development

This is a work in progress, do not rely on ANYTHING remaining stable

# Process:

A Flat Data Github action approach that uses Deno, Typescript and Github to fetch periodically (eventually 1 per day) data from the RSS feed of [http://oil.gge.gov.gr](http://oil.gge.gov.gr), parses it and appends it to a set of flat data files (JSON and CSV)

## Data file description:

The data exists in 3 formats, JSON, CSV and SQLite.

**fuels.json**: An example is below. For an elasticsearch compatible schema, see schema.json
```
{
  "date": "2023-04-07T00:00:00.000Z",
  "category": "Βενζίνες",
  "notes": "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
  "fuel": "UNLEADED 95 BIO",
  "elpePrice": 1454.368,
  "motoroilPrice": null,
  "meanPrice": 1454.368,
  "vatPrice": 1803.416,
  "unit": "Κυβικό Μέτρο"
},
```

Note that some fields could be null. Pretty much ready to be posted to elasticsearch (albeit not in the bulk endpoint)

**fuels.csv**: An example of a few entries is below.
```
date,category,notes,fuel,elpePrice,motoroilPrice,meanPrice,vatPrice,unit
"""2018-12-31T00:00:00.000Z""",Βενζίνες,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",UNLEADED LRP,1051.717,1092.438,1072.08,1329.38,Κυβικό Μέτρο
"""2018-12-29T00:00:00.000Z""",Βενζίνες,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",UNLEADED LRP,1051.717,1092.438,1072.08,1329.38,Κυβικό Μέτρο
"""2018-12-30T00:00:00.000Z""",Βενζίνες,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",UNLEADED LRP,1051.717,1092.438,1072.08,1329.38,Κυβικό Μέτρο
```

**fuels.db**: The table schema is the following. No various normal forms, no indices, or any kind of optimization. This is experimental

```
CREATE TABLE IF NOT EXISTS fuels (
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  notes TEXT NOT NULL,
  fuel TEXT NOT NULL,
  elpePrice REAL,
  motoroilPrice REAL,
  meanPrice REAL,
  vatPrice REAL,
  unit TEXT NOT NULL)
```

# How to use:

Just go to https://flatgithub.com/akosiaris/greek-oil-refinery-prices , pick the data file you want and get a basic UI for exploring it.

You can also choose to feed it to whatever datastore you like (e.g. I plan to eventually post it to Elasticsearch and graph it via Grafana)

# TODOs:

* Unit tests

# Bugs/Gotchas/limitations:

* Parsing dates that are human entered is error prone, this could break if the operator entering the dates in the upstream site changes (or alters habbits)

* At various points in time, values could be null

* Doesn't handle what upstream calls "correct repetition" (ΟΡΘΗ ΕΠΑΝΑΛΗΨΗ) of entries. So no corrected updates
