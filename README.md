# greek-oil-distillery-prices

A repo using the Flat Data approach, scraping Greek oil distillery prices from http://oil.gge.gov.gr (note the lack of HTTPS) and assembling them in a number of more usable forms.

# Still in development

This is a work in progress, do not rely on ANYTHING remaining stable

# Process:

A Flat Data Github action approach that uses Deno, Typescript and Github to fetch periodically (eventually 1 per day) data from the RSS feed of [http://oil.gge.gov.gr](http://oil.gge.gov.gr), parses it and appends it to a set of flat data files (JSON right now, CSV could be added if found useful)

## Data file description:

3 data files exist in JSON format (pretty much ready to be posted to elasticsearch (albeit not in the bulk endpoint)

* **data_full.json**: Has the entirety of the original data. Example below
  *   `{
        "parsedDate": "2018-12-31", # Just a naive (not timezone aware) date.
        "category": "Βενζίνες", # Category of product
        "notes": "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ", # Notes
        "fuelName": "UNLEADED LRP", # Name of product
        "elpePrice": 1051.717, # Price at ΕΛ.ΠΕ. distilleries
        "motoroilPrice": 1092.438 # Price at Motor Oil distilleries
      }`
  * Note that some fields could be null.
* **data_augmented.json:** Original data + augmented with calculation including VAT. Example below with explanations
  * `  {
        "parsedDate": "2018-12-31", # Just a naive (not timezone aware) date.
        "category": "Βενζίνες", # Category of product
        "notes": "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ", # Notes
        "fuelName": "UNLEADED LRP", # Name of product
        "elpePrice": 1051.717, # Price at ΕΛ.ΠΕ. distilleries
        "motoroilPrice": 1092.438, # Price at Motor Oil distilleries
        "meanPrice": 1072.0775, # Mean price if both above prices are provided
        "vat24Price_per_lt": 1.3293761000000002, # Mean price if VAT 24% is added
        "vat17Price_per_lt": 1.2543306749999998, # Mean price if VAT 17% is added
        "vat17notes": "Only for Λέρο, Λέσβο, Κω, Σάμο και Χίο" # Notes about where the 17% VAT applies
      }`
* **data_plain.json**: Trimmed down version of the above one, with properties having null values removed.

# How to use:

Just go to https://flatgithub.com/akosiaris/greek-oil-distillery-prices , pick the data file you want and get a basic UI for exploring it.

You can also choose to feed it to whatever datastore you like (e.g. I plan to eventually post it to Elasticsearch and graph it via Grafana)

# TODOs:

* Unit tests

# Bugs/Gotchas/limitations:

* Parsing dates that are human entered is error prone, this could break if the operator entering the dates in the upstream site changes (or alters habbits)

* At various points in time, values could be null

* Doesn't handle what upstream calls "correct repetition" (ΟΡΘΗ ΕΠΑΝΑΛΗΨΗ) of entries. So no corrected updates
