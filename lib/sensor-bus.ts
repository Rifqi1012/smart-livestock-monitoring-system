// SensorBus — SSE fan-out to connected dashboard/alert clients.
// ponytail: in-process singleton (one Node instance). For multi-instance
// deploys, swap the Set for Redis pub/sub — same subscribe/broadcast surface.

export type StreamEvent = {
  id: string;
  suhu: number;
  kelembapan: number;
  amonia: number;
  thi: number;
  statusLevel: number;
  statusLabel: "normal" | "waspada" | "bahaya";
  createdAt: string;
};

type SSEClient = {
  id: number;
  controller: ReadableStreamDefaultController<Uint8Array>;
  heartbeat?: ReturnType<typeof setInterval>;
};

// Keep-alive so idle connections aren't dropped by proxies/tunnels (e.g.
// Cloudflare), which also often refuse to stream until the first byte arrives.
const HEARTBEAT_MS = 25_000;

class SensorBus {
  private clients = new Set<SSEClient>();
  private encoder = new TextEncoder();
  private seq = 0;

  get connectionCount(): number {
    return this.clients.size;
  }

  // Register a client and return the SSE stream. When `initial` is given it is
  // pushed to this client immediately on connect (initial snapshot).
  subscribe(initial?: StreamEvent): ReadableStream<Uint8Array> {
    const client: SSEClient = { id: ++this.seq, controller: undefined! };
    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        client.controller = controller;
        this.clients.add(client);
        // Flush a comment immediately so proxies start streaming right away.
        this.writeRaw(client, ": connected\n\n");
        if (initial) this.publish(initial, client);
        client.heartbeat = setInterval(() => this.writeRaw(client, ": ping\n\n"), HEARTBEAT_MS);
      },
      // Fires when the client disconnects (tab closed / navigated away).
      cancel: () => {
        this.drop(client);
      },
    });
  }

  // Low-level write; prunes the client if its connection is already closed.
  private writeRaw(client: SSEClient, text: string): void {
    try {
      client.controller.enqueue(this.encoder.encode(text));
    } catch {
      this.drop(client);
    }
  }

  private drop(client: SSEClient): void {
    if (client.heartbeat) clearInterval(client.heartbeat);
    this.clients.delete(client);
  }

  // Send to ONE client.
  publish(data: StreamEvent, client: SSEClient): void {
    this.writeRaw(client, `data: ${JSON.stringify(data)}\n\n`);
  }

  // Send to ALL connected clients.
  broadcast(data: StreamEvent): void {
    for (const client of this.clients) this.publish(data, client);
  }
}

// Survive HMR in dev by pinning the instance on globalThis (same as prisma.ts).
const globalForBus = globalThis as unknown as { sensorBus?: SensorBus };
export const sensorBus = globalForBus.sensorBus ?? new SensorBus();
if (process.env.NODE_ENV !== "production") globalForBus.sensorBus = sensorBus;
