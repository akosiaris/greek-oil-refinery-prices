import { assertEquals } from "./test_deps.ts";
import { VAT } from "./VAT.ts";

Deno.test("18%", () => {
  const rate = VAT.VATbyDate(new Date("2004-01-01"));
  assertEquals(rate, 0.18);
});

Deno.test("19%", () => {
  const rate = VAT.VATbyDate(new Date("2008-01-01"));
  assertEquals(rate, 0.19);
});

Deno.test("21%", () => {
  const rate = VAT.VATbyDate(new Date("2010-04-01"));
  assertEquals(rate, 0.21);
});

Deno.test("23%", () => {
  const rate = VAT.VATbyDate(new Date("2010-10-01"));
  assertEquals(rate, 0.23);
});

Deno.test("24%", () => {
  const rate = VAT.VATbyDate(new Date("2016-10-01"));
  assertEquals(rate, 0.24);
});

Deno.test("2019-05-04T00:00:00.000Z", () => {
  const rate = VAT.VATbyDate(new Date("2019-05-04T00:00:00.000Z"));
  assertEquals(rate, 0.24);
});

Deno.test("No known VAT", () => {
  const rate = VAT.VATbyDate(new Date("2000-01-01"));
  assertEquals(rate, NaN);
});
