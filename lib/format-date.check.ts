// Self-check for formatTanggalIndo. Run: npx tsx lib/format-date.check.ts
import assert from "node:assert";
import { formatTanggalIndo } from "./format-date";

// Leading zeros on both hour and minute; full Indonesian month name.
assert.equal(formatTanggalIndo(new Date(2026, 6, 22, 16, 5)), "22 Juli 2026, jam 16.05");
assert.equal(formatTanggalIndo(new Date(2026, 0, 1, 5, 9)), "1 Januari 2026, jam 05.09");
assert.equal(formatTanggalIndo(new Date(2026, 11, 31, 0, 0)), "31 Desember 2026, jam 00.00");

// String input is coerced to Date (local time).
assert.equal(formatTanggalIndo("2026-07-22T16:05:27").startsWith("22 Juli 2026, jam "), true);

console.log("format-date.check: all assertions passed ✓");
