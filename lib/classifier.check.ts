// Self-check for the SAW classifier. Run: npx tsx lib/classifier.check.ts
// (Will be superseded by the thesis's 8 official test cases.)
import assert from "node:assert";
import { Classifier } from "./classifier";

const c = new Classifier();
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

// thiMax = 90, amoniaMax = 25 for all cases below.
const T = 90;
const A = 25;

// All-min → IG 0 → normal.
let r = c.calculateSAW(56, 0, T, A);
near(r.ig, 0);
assert.equal(r.statusLabel, "normal");
assert.equal(r.statusLevel, 0);

// iThi=25, iAmonia=25 → IG 25 → waspada (lower boundary, inclusive).
r = c.calculateSAW(64.5, 6.25, T, A);
near(r.ig, 25);
assert.equal(r.statusLabel, "waspada");
assert.equal(r.statusLevel, 1);

// iThi=50, iAmonia=50 → IG 50 → bahaya (upper boundary, inclusive).
r = c.calculateSAW(73, 12.5, T, A);
near(r.ig, 50);
assert.equal(r.statusLabel, "bahaya");
assert.equal(r.statusLevel, 2);

// Just below 25 → normal.
assert.equal(c.calculateSAW(64, 6, T, A).statusLevel, 0);

// THI below 56 → iThi clamped to 0 (does not drag IG negative).
r = c.calculateSAW(50, 0, T, A);
near(r.ig, 0);
assert.equal(r.statusLevel, 0);
// Clamp with ammonia present: iThi=0, iAmonia=50 → IG 25 → waspada.
near(c.calculateSAW(50, 12.5, T, A).ig, 25);

// Relay is INDEPENDENT of status: bahaya from THI alone, relay still off.
r = c.calculateSAW(90, 0, T, A); // iThi=100, iAmonia=0 → IG 50 → bahaya
assert.equal(r.statusLevel, 2);
assert.equal(c.checkRelay(0, A), false);

// checkRelay boundary: amonia >= amoniaMax.
assert.equal(c.checkRelay(24.99, A), false);
assert.equal(c.checkRelay(25, A), true);
assert.equal(c.checkRelay(30, A), true);

console.log("classifier.check: all assertions passed ✓");
