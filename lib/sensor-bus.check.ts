// Self-check for SensorBus fan-out + disconnect cleanup.
// Run: npx tsx lib/sensor-bus.check.ts
import assert from "node:assert";
import { sensorBus, type StreamEvent } from "./sensor-bus";

const decoder = new TextDecoder();
const ev = (id: string): StreamEvent => ({
  id,
  suhu: 20,
  kelembapan: 55,
  amonia: 10,
  thi: 60,
  statusLevel: id === "alert" ? 2 : 0,
  statusLabel: id === "alert" ? "bahaya" : "normal",
  createdAt: "2026-07-22T00:00:00.000Z",
});
const parse = (chunk: Uint8Array): StreamEvent =>
  JSON.parse(decoder.decode(chunk).replace(/^data: /, "").trim());

// Read the next `data:` frame, skipping SSE comment lines (": connected", ": ping").
async function readEvent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<StreamEvent> {
  for (;;) {
    const { value } = await reader.read();
    if (!value) continue;
    const text = decoder.decode(value);
    if (text.startsWith(":")) continue; // comment / heartbeat
    return parse(value);
  }
}

(async () => {
  const base = sensorBus.connectionCount;

  // Initial snapshot is delivered on connect (after the ": connected" flush).
  const r1 = sensorBus.subscribe(ev("init")).getReader();
  assert.equal((await readEvent(r1)).id, "init");
  assert.equal(sensorBus.connectionCount, base + 1);

  // broadcast() reaches every connected client.
  const r2 = sensorBus.subscribe().getReader();
  assert.equal(sensorBus.connectionCount, base + 2);
  sensorBus.broadcast(ev("alert"));
  assert.equal((await readEvent(r1)).id, "alert");
  assert.equal((await readEvent(r2)).id, "alert");

  // Disconnect (cancel) removes the client — no memory leak.
  await r2.cancel();
  assert.equal(sensorBus.connectionCount, base + 1);
  await r1.cancel();
  assert.equal(sensorBus.connectionCount, base);

  console.log("sensor-bus.check: all assertions passed ✓");
  process.exit(0);
})();
