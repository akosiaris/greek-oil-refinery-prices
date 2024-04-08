import { FuelEntry } from "../src/FuelEntry.ts";
import { assertEquals, assertThrows } from "../test_deps.ts";

Deno.test("Fully Specified Entry - Gazoline", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  const entry = new FuelEntry(
    date,
    "Βενζίνες",
    "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
    "UNLEADED 100",
    99,
    101,
  );
  assertEquals(entry.unit, "Κυβικό Μέτρο");
  assertEquals(entry.meanPrice, 100);
  assertEquals(entry.vatPrice, 124);
});

Deno.test("Fully Specified Entry with string date - Gazoline", () => {
  const date = "2020-01-01T00:00:00.000Z";
  const entry = new FuelEntry(
    date,
    "Βενζίνες",
    "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
    "UNLEADED 100",
    99,
    101,
  );
  assertEquals(entry.unit, "Κυβικό Μέτρο");
  assertEquals(entry.meanPrice, 100);
  assertEquals(entry.vatPrice, 124);
});

Deno.test("with no motoroilPrice - Diesel", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  const entry = new FuelEntry(
    date,
    "Πετρέλαια",
    "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
    "DIΕSEL AUTO BIO",
    100,
  );
  assertEquals(entry.unit, "Κυβικό Μέτρο");
  assertEquals(entry.meanPrice, 100);
  assertEquals(entry.vatPrice, 124);
});

Deno.test("with no elPePrice - Diesel", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  const entry = new FuelEntry(
    date,
    "Πετρέλαια",
    "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
    "DIΕSEL AUTO BIO",
    NaN,
    100,
  );
  assertEquals(entry.unit, "Κυβικό Μέτρο");
  assertEquals(entry.meanPrice, 100);
  assertEquals(entry.vatPrice, 124);
});

Deno.test("with no prices - tarmac", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  const entry = new FuelEntry(
    date,
    "ΑΣΦΑΛΤΟΣ",
    "τιμές σε €/μ.τ., προ φόρων – τελών και ΦΠΑ",
    "ΒΕΑ 30/45",
  );
  assertEquals(entry.unit, "Μετρικός Τόνος");
  assertEquals(entry.meanPrice, NaN);
  assertEquals(entry.vatPrice, NaN);
});

Deno.test("with unknown notes - tarmac", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  const entry = new FuelEntry(
    date,
    "ΑΣΦΑΛΤΟΣ",
    "dummy notes",
    "ΒΕΑ 30/45",
  );
  assertEquals(entry.unit, "Άγνωστο");
  assertEquals(entry.meanPrice, NaN);
  assertEquals(entry.vatPrice, NaN);
});

/* TODO: This test should be failing, but it is not */
Deno.test("with wrong category", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  const entry = new FuelEntry(
    date,
    "Λάθος Κατηγορία",
    "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
    "DIΕSEL AUTO BIO",
    100,
  );
  assertEquals(entry.unit, "Κυβικό Μέτρο");
  assertEquals(entry.meanPrice, 100);
  assertEquals(entry.vatPrice, 124);
});

Deno.test("Test serialization and deserialization of entry", () => {
  const date = "2020-01-01T00:00:00.000Z";
  const entry = new FuelEntry(
    date,
    "Βενζίνες",
    "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ",
    "UNLEADED 100",
    99,
    101,
  );
  const serialized: string = entry.serialize();
  const deserialized: FuelEntry = FuelEntry.deserialize(serialized);
  assertEquals(entry, deserialized);
});

Deno.test("Test non syntactically valid JSON deserialization", () => {
  // The syntax error is the comma at the end
  const entry = '{"motoroilPrice": 101,}';
  assertThrows(() => {
    FuelEntry.deserialize(entry);
  }, SyntaxError);
});

Deno.test("Test non JSONSchema validating but syntactically valid JSON", () => {
  const entry = `{
        "date": "2020-01-01T00:00:00.000Z",
        "category": "Wrong Category",
        "notes": "wrong notes",
        "fuel": "wrong fuel",
        "elpePrice": 99,
        "motoroilPrice": 101
    }`;
  assertThrows(
    () => {
      FuelEntry.deserialize(entry);
    },
    TypeError,
    "Failed to validate",
  );
});
