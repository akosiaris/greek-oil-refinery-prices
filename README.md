[![Deno](https://github.com/akosiaris/greek-oil-refinery-prices/actions/workflows/deno.yml/badge.svg)](https://github.com/akosiaris/greek-oil-refinery-prices/actions/workflows/deno.yml)

# greek-oil-refinery-prices

A repo using the Flat Data approach, scraping Greek oil refinery prices from
https://oil.mindev.gov.gr (HTTPS support was added in 2025 - before that we had HTTP)
and assembling them in a number of more usable forms.

# Semi-stable

While I make no guarantees about the data structure formats and reserve the
right to change them to suit my needs, it's been stable for quite a while now.

# Process:

A Flat Data Github action approach that uses Deno, Typescript and Github to
fetch periodically (twice per day) data from the RSS feed of
[https://oil.mindev.gov.gr](https://oil.mindev.gov.gr), parses it and appends it
to a set of flat data files (JSON and CSV) as well as an SQLite database.

## Data file description:

The data exists in 3 formats, JSON, CSV and SQLite.

### JSON

The most verbose. An example entry below. For an elasticsearch compatible mapping, see
[data/elasticsearch_mapping.json](data/elasticsearch_mapping.json)

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

Filename: **fuels.json**

Note that some fields could be null. Pretty much ready to be posted to
elasticsearch (albeit not in the bulk endpoint)

### CSV

I wish I could say that CSV is a "standard" format, however CSVs can be very ambiguously defined. Nevertheless, I try to offer that too.
An example of a few entries is below, first row is the CSV header

```
date,category,notes,fuel,elpePrice,motoroilPrice,unit,meanPrice,vatPrice
2018-12-17T00:00:00.000Z,Βενζίνες,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",UNLEADED LRP,1090.851,1131.593,Κυβικό Μέτρο,1111.222,1377.915
2018-12-17T00:00:00.000Z,Βενζίνες,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",UNLEADED 95,1087.75,1086.936,Κυβικό Μέτρο,1087.343,1348.305
2018-12-17T00:00:00.000Z,Βενζίνες,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",UNLEADED 100,1154.984,1155.034,Κυβικό Μέτρο,1155.009,1432.211
2018-12-17T00:00:00.000Z,Πετρέλαια,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",DIΕSEL AUTO BIO,944.67,943.684,Κυβικό Μέτρο,944.177,1170.779
2018-12-17T00:00:00.000Z,Πετρέλαια,"τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",HEATING GASOIL (ΧΠ),742.484,741.396,Κυβικό Μέτρο,741.94,920.006
2018-12-17T00:00:00.000Z,Υγραέρια – LPG,"τιμές σε €/μ.τ., συμπεριλ. φόρων – τελών, προ ΦΠΑ",LPG AUTO,877.716,878.133,Μετρικός Τόνος,877.925,1088.627
```

Filename: **fuels.csv**

### SQLite

We provide a number of variants here

#### 1NF (1st Normal Form)

The table is in 1NF, that is [First Normal Form](https://en.wikipedia.org/wiki/First_normal_form).
It's beyond the scope of this README to explain, but one TL;DR can be "no table cell contains sets of values (e.g. nested tables)"

The table schema is the following.
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
  unit TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_fuels_date ON fuels(date);
```

Filename: **fuels.db**
Note: The lack of a primary/unique key, is because given the way data is
published, that constraint is very difficult to enforce. At times, upstream
updates published data (to fix errors or inconsistencies presumably), in ways
that lead to duplicate entries. I have made a conscious decision to avoid
dealing with this as it is too much work to somehow deal with it. Expect
duplicates to show up

#### 2NF (2nd Normal Form)

The tables are in 2NF, that is [Second Normal Form](https://en.wikipedia.org/wiki/Second_normal_form).
Again, beyond the scope of this README to explain, but one TL;DR can be "1NF + no partial dependencies".

The table schema is the following.
```
  CREATE TABLE IF NOT EXISTS fuels (
    id    INTEGER,
    name    TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,
    notes    TEXT NOT NULL,
    unit    TEXT NOT NULL,
    PRIMARY KEY(id AUTOINCREMENT)
  );
  CREATE TABLE prices (
    date    TEXT NOT NULL,
    fuel_id    INTEGER NOT NULL,
    elpePrice    REAL,
    motoroilPrice    REAL,
    meanPrice    REAL,
    vatPrice    REAL,
    FOREIGN KEY(fuel_id) REFERENCES fuels(id)
  );
  CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(date);
```

Filename: **fuels_2nf.db**
Note: This file is substantially smaller than the 1NF version, as there is a
lot less duplication. The `prices` table suffers from the exact same deficiency
as the 1NF table as far as lack of a primary/unique key goes, for the exact
same reasons. Strictly speaking, this means the table isn't really in 2NF.
However, in 2026-02-07, the duplicates detected where less than 1.1% of the
full size of the tables. For analytical purposes, this is probably acceptable?
There are a number of ways out of this, I am still weighing on the pros
and cons of each


#### 3NF (3rd Normal Form) / Boyce Codd Normal Form

**WARNING: This file isn't currently updated automatically, it's a work-in-progress**

The table schema is the following.
The tables are in 3NF, that is [Third Normal Form](https://en.wikipedia.org/wiki/Third_normal_form).
Again, beyond the scope of this README to explain, but one TL;DR can be "2NF + no transitive dependencies".

The table schema is the following.
```
CREATE TABLE IF NOT EXISTS "prices" (
	"date"	TEXT NOT NULL,
	"fuel_id"	INTEGER NOT NULL,
	"elpePrice"	REAL,
	"motoroilPrice"	REAL,
	FOREIGN KEY("fuel_id") REFERENCES "fuels"("id")
);
CREATE TABLE IF NOT EXISTS "categories" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL UNIQUE,
	"notes"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "fuels" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL UNIQUE,
	"category_id"	INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("category_id") REFERENCES "categories"("id")
);
CREATE INDEX idx_fuels_date ON "prices"(date);
```

Filename: **fuels_3nf.db**
Note: This form lacks computed attributes 1NF and 2NF have. The reason for
the approach is that once you get to 3NF, derived/computed attributes stop
making sense to store. It's best to calculate them on the fly.
The same notice about lack of a primary/unique key for the `prices` table
applies here as well. To be abundantly clear, this also means that strictly
speaking this table is NOT in 3NF.

##### Boyce Codd Normal Form

The above table is also (inadvertedly admittedly) in BCNF. Again, beyond the
scope of this README to explain, a TL;DR would be "3NF + all functional
dependencies are on a superkey".

Same notice as above for primary/unique key and again yes, the table, strictly
speaking is not in BCNF.

# How to use:

Just go to https://flatgithub.com/akosiaris/greek-oil-refinery-prices , pick the
data file you want and get a basic UI for exploring it.

You can also choose to feed the 3 different formats we provide it to whatever datastore you like

# TODOs:

- None

# Bugs/Gotchas/Limitations:

- Parsing dates that are human entered is error prone, this continually breaks
  for one reason or another, e.g. a different operator replaces the usual one,
  the operator makes an unaccounted for typo, alters habbits significantly, etc.

- At various points in time and for various reasons, values could be null

- Similarly, at various points in time and for various reasons, there might be values that make 0 sense.

- Doesn't handle what upstream calls "correct repetition" (ΟΡΘΗ ΕΠΑΝΑΛΗΨΗ) of
  entries. So no corrected updates
