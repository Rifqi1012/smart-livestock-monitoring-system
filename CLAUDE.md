@AGENTS.md
# Smart Livestock Monitoring System (SLMS)

Skripsi project: "Implementasi Smart Livestock Monitoring System Berbasis IoT
untuk Optimalisasi Kondisi Lingkungan Kandang Sapi di SMKN 5 Pangalengan."
IoT-based barn monitoring system for a dairy cattle barn (5 Friesian Holstein
cows) at SMKN 5 Pangalengan. This file is the source of truth for the web
application rebuild — it mirrors the finalized BAB 3 (Analisis dan
Perancangan) design. Do not deviate from the specs below without asking.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Prisma ORM + MySQL
- NextAuth for authentication
- Tailwind CSS + shadcn/ui
- `web-push` npm package (VAPID keys) for push notifications — **native Web
  Push API (Push API + Service Worker), NOT Firebase Cloud Messaging**
- Server-Sent Events (SSE) for live dashboard updates (no polling)

## Hardware context (for reference — firmware itself is a separate Arduino
## project, not part of this repo, but the API must match it exactly)

- Microcontroller: ESP32
- Sensor DHT22 (suhu & kelembapan) on GPIO 27
- Sensor MQ135 (amonia) on GPIO 34 (ADC), R0≈9.45, calibration uses
  `getPPM()` (not `getCorrectedPPM`). MQ135 outputs 5V — ESP32 side uses a
  10kΩ/15kΩ voltage divider to stay within the 3.3V ADC max.
- LCD IPS TFT 1.47" ST7789, 172×320px landscape, SPI pins: MOSI=23, SCLK=18,
  CS=5, DC=2, RST=4, BL=15
- Relay 1-channel on GPIO 26 (drives future automatic barn cleaning equipment —
  barn doesn't have one yet, so the relay itself has no load connected currently)
- LED Hijau (GPIO 25), LED Kuning (GPIO 33), LED Merah (GPIO 32)
- Monitoring is periodic ("berkala"), explicitly NOT real-time — advisor
  confirmed the environmental indicators don't fluctuate fast enough to
  justify true real-time polling.

## Core domain logic — Metode Simple Additive Weighting (SAW) (do not deviate)

This is the most important business logic in the whole system and the one
most likely to be checked against the thesis during sidang. Keep it in ONE
place (`classifier.ts` — see architecture below), never duplicated inline in
an API route.

Classification uses **2 criteria only — THI and Amonia** — combined via Simple
Additive Weighting (SAW) with equal weights (50 : 50).

THI is derived from suhu + kelembapan:
`THI = (0.8 * T) + ((RH / 100) * (T - 14.4)) + 46.4`

Normalization (each criterion scaled to a 0–100 index):
- `iThi = ((thi - 56) / (thiMax - 56)) * 100` — **clamp to 0 if negative**
  (happens when thi < 56, i.e. very cool conditions; a negative index must not
  drag the sum down)
- `iAmonia = (amonia / amoniaMax) * 100`

Combined index (Indeks Gabungan): `IG = (0.5 * iThi) + (0.5 * iAmonia)`

Status classification from IG:

| IG range       | Level | Label     |
|----------------|-------|-----------|
| IG < 25        | 0     | normal    |
| 25 ≤ IG < 50   | 1     | waspada   |
| IG ≥ 50        | 2     | bahaya    |

Actuator behavior — **LED and relay are computed INDEPENDENTLY** (server tells
the ESP32 what to do via the API response; the ESP32 does not classify):

- **LED** follows the SAW status: normal → Hijau, waspada → Kuning, bahaya → Merah.
- **Relay** follows `checkRelay(amonia) = amonia >= amoniaMax` ALONE (future
  automatic barn cleaning equipment) — it does NOT depend on the combined
  status. A reading can be Bahaya (driven by THI) with the relay off, or Normal
  with the relay on. Neither `led` nor `relayActive` may determine the other.
- **Push notification** is sent when `statusLevel >= 1` (Waspada/Bahaya) —
  driven by the SAW status, independent of the relay.

Threshold configuration rules (both admin-editable via Settings page; **nothing
is hardcoded** — the old fixed THI boundaries no longer exist):
- `thiMax` — THI normalization ceiling (must be > 56)
- `amoniaMax` — amonia normalization ceiling; doubles as the relay trigger

## Database schema (Prisma models — map exactly to these entities)

- `User` — role: admin | petugas_kandang
- `Device` — ESP32 device registry, API key for `/api/device/ingest` auth
- `MonitoringData` — suhu, kelembapan, amonia, thi, indeksGabungan (IG),
  statusLevel, statusLabel, createdAt
- `Threshold` — thiMax, amoniaMax (singleton/config row; both admin-editable)
- `Notification` — alert log entries, linked to a MonitoringData record,
  push delivery status
- `PushSubscription` — endpoint, p256dh key, auth key, linked to a User
  (any role — admin and petugas_kandang both receive push when subscribed)

## Architecture — mirrors the MVC Class Diagram (Gambar 3.13)

Model layer → `src/lib/`:
- `prisma.ts` → PrismaClient singleton
- `thi-calculator.ts` → THICalculator: `calculate(suhu, kelembapan): number`
- `threshold-service.ts` → ThresholdService: `getThreshold()`, `validate()`,
  `saveThreshold()`
- `classifier.ts` → Classifier: `calculateSAW()` (returns `{ ig, statusLevel,
  statusLabel }`), `checkRelay()` (relay logic, kept separate from SAW)
- `push-service.ts` → PushNotificationService: `sendPushNotification()`,
  `buildMessage()`, `formatStatus()` (uses VAPID keys from env)
- `sensor-bus.ts` → SensorBus: SSE broadcast to connected dashboard clients
  (`subscribe()`, `publish()`, `broadcast()`)

Controller layer → `src/app/api/`:
- `api/auth/*` → NextAuth (signin, session, signout)
- `api/device/ingest` → main ingestion endpoint (see JSON formats below) —
  validates API key, calls THICalculator + Classifier, saves to DB, triggers
  push if Waspada/Bahaya, returns status+led+relay instruction to ESP32
- `api/monitoring`, `api/monitoring/latest`, `api/monitoring/history`
- `api/settings/threshold`, `api/settings/user`
- `api/notifications`, `api/notifications/:id` (PATCH), `api/push/subscribe`
  (POST)
- `api/stream` → SSE endpoint (StreamController, uses SensorBus)
- `middleware.ts` → auth + role guard

View layer → `src/app/(dashboard)/` and `src/components/`:
- `(auth)/login/page.tsx`
- `(dashboard)/dashboard/page.tsx` — realtime-ish cards + chart + status
- `(dashboard)/monitoring/page.tsx` — historical data + filters
- `(dashboard)/alerts/page.tsx` — notification history
- `(dashboard)/settings/page.tsx` — threshold form + user management
- `components/`: Header, Sidebar, MetricCard, SensorChart, AlertTable, Modal

## Request / response JSON formats (must match exactly — ESP32 firmware is
## already written against this contract)

Request, ESP32 → `POST /api/device/ingest`:
```json
{
  "deviceId": "esp32-barn-01",
  "temperature": 28.91,
  "humidity": 57.92,
  "ammonia": 14.26,
  "timestamp": "2026-06-19T14:42:42Z"
}
```

Response, server → ESP32 (drives LED/relay directly, ESP32 does no
classification of its own). `led` follows the SAW status; `relayActive` follows
`checkRelay(amonia)` independently:
```json
{
  "success": true,
  "status": "waspada",
  "ig": 37.4,
  "led": "kuning",
  "relayActive": false,
  "message": "Kondisi kandang Waspada"
}
```

## UI design tokens

- Font: Poppins
- Primary color: green `#10B981`
- Status colors: Normal `#10B981` (green), Waspada `#F59E0B` (amber), Bahaya
  `#EF4444` (red)
- Neutrals: white / gray, clean flat card-based layout (see wireframes
  D01–D04 in BAB 3 for page-level layout reference)

## Conventions

- UI copy and domain labels in Bahasa Indonesia, matching thesis terminology
  exactly (e.g. "Kelola Threshold", "Riwayat Alert", "Status Kandang",
  "Waspada", "Bahaya") — don't translate these to English in the UI.
- Code identifiers (variables, functions, files) in English/camelCase.
- Keep classification logic centralized in `classifier.ts`; never re-implement
  the SAW computation inline in a route handler.
- Always ask before changing the SAW criteria, normalization formulas, weights,
  or IG thresholds above — the method has been through an advisor (dosen)
  revision cycle and is finalized.