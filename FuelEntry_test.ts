import { assertEquals } from 'https://deno.land/std@0.183.0/testing/asserts.ts';
import { FuelEntry } from './FuelEntry.ts';

Deno.test('Fully Specified Entry - Gazoline', () => {
    const date = new Date('2020-01-01T00:00:00.000Z');
    const entry = new FuelEntry(
        date,
        'Βενζίνες',
        'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ',
        'UNLEADED 100',
        99,
        101,
    );
    assertEquals(entry.unit, 'Κυβικό Μέτρο');
    assertEquals(entry.meanPrice, 100);
    assertEquals(entry.vatPrice, 124);
});

Deno.test('Fully Specified Entry with string date - Gazoline', () => {
    const date = '2020-01-01T00:00:00.000Z';
    const entry = new FuelEntry(
        date,
        'Βενζίνες',
        'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ',
        'UNLEADED 100',
        99,
        101,
    );
    assertEquals(entry.unit, 'Κυβικό Μέτρο');
    assertEquals(entry.meanPrice, 100);
    assertEquals(entry.vatPrice, 124);
});

Deno.test('with no elpePrice - Diesel', () => {
    const date = new Date('2020-01-01T00:00:00.000Z');
    const entry = new FuelEntry(
        date,
        'Πετρέλαια',
        'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ',
        'DIΕSEL AUTO BIO',
        100,
    );
    assertEquals(entry.unit, 'Κυβικό Μέτρο');
    assertEquals(entry.meanPrice, 100);
    assertEquals(entry.vatPrice, 124);
});

Deno.test('Test serialization of entry', () => {
    const date = '2020-01-01T00:00:00.000Z';
    const entry = new FuelEntry(
        date,
        'Βενζίνες',
        'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ',
        'UNLEADED 100',
        99,
        101,
    );
    const serialized: string = entry.serialize();
    const deserialized: FuelEntry = FuelEntry.deserialize(serialized);
    assertEquals(entry, deserialized);
});