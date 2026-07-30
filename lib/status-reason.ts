import { Classifier, type Thresholds } from "@/lib/classifier";

const classifier = new Classifier();

type Reading = { thi: number; amonia: number };

// Plain-language reason from the dominant SAW criterion (THI vs Amonia). Shared
// by the simplified Monitoring and Alerts views for petugas_kandang.
export function explainStatus(r: Reading, t: Thresholds): string {
  const { statusLevel } = classifier.calculateSAW(r.thi, r.amonia, t.thiMax, t.amoniaMax);
  if (statusLevel === 0) return "Kondisi baik";

  let iThi = ((r.thi - 56) / (t.thiMax - 56)) * 100;
  if (iThi < 0) iThi = 0;
  const iAmonia = (r.amonia / t.amoniaMax) * 100;

  return iAmonia >= iThi ? "Bau kandang menyengat" : "Cuaca terlalu panas dan lembap";
}
