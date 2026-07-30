// Metode Simple Additive Weighting (SAW) — 2 kriteria: THI dan Amonia.
// Bobot 50:50. LED/status ikut IG (calculateSAW); relay independen (checkRelay).

export type StatusLabel = "normal" | "waspada" | "bahaya";
export type Thresholds = { thiMax: number; amoniaMax: number };

export type SAWResult = { ig: number; statusLevel: 0 | 1 | 2; statusLabel: StatusLabel };

export class Classifier {
  // Simple Additive Weighting over THI + Amonia. Returns the combined index (IG)
  // and its status classification.
  calculateSAW(thi: number, amonia: number, thiMax: number, amoniaMax: number): SAWResult {
    // Normalisasi THI. Boleh negatif kalau thi < 56 (kondisi sangat sejuk) →
    // clamp ke 0 supaya tidak menarik turun penjumlahan.
    let iThi = ((thi - 56) / (thiMax - 56)) * 100;
    if (iThi < 0) iThi = 0;

    const iAmonia = (amonia / amoniaMax) * 100;

    const ig = 0.5 * iThi + 0.5 * iAmonia;

    let statusLevel: 0 | 1 | 2;
    let statusLabel: StatusLabel;
    if (ig < 25) {
      statusLevel = 0;
      statusLabel = "normal";
    } else if (ig < 50) {
      statusLevel = 1;
      statusLabel = "waspada";
    } else {
      statusLevel = 2;
      statusLabel = "bahaya";
    }

    return { ig, statusLevel, statusLabel };
  }

  // Relay driver — deliberately separate from calculateSAW. Relay only follows
  // ammonia (future automatic barn cleaning equipment), not the combined status.
  checkRelay(amonia: number, amoniaMax: number): boolean {
    return amonia >= amoniaMax;
  }
}
