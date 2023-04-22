import { assertEquals } from 'https://deno.land/std@0.183.0/testing/asserts.ts';
import { FuelEntry } from './FuelEntry.ts';

Deno.test('Simple Correct Entry', () => {
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

Deno.test('Test serialization of entry', () => {
    const date = new Date('2020-01-01T00:00:00.000Z');
    const entry = new FuelEntry(
        date,
        'Βενζίνες',
        'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ',
        'UNLEADED 100',
        99,
        101,
    );
    console.log(typeof(entry.date));
    console.log(typeof(entry.meanPrice));
    console.log(typeof(entry.category));
    const serialized: string = entry.serialize();
    const deserialized: FuelEntry = FuelEntry.deserialize(serialized);
    console.log(typeof(deserialized.date));
    console.log(typeof(deserialized.meanPrice));
    console.log(typeof(deserialized.category));
});