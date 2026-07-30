import { prisma } from "@/lib/prisma";

// Singleton config row (id = 1). SAW uses two admin-configurable ceilings.
const DEFAULTS = { thiMax: 90, amoniaMax: 25 };

export type ThresholdInput = { thiMax: number; amoniaMax: number };

export class ThresholdService {
  // Return the active threshold, seeding defaults on first use. The row also
  // carries updatedBy/updatedAt for the Settings "last edited" line.
  async getThreshold() {
    return prisma.threshold.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, ...DEFAULTS },
    });
  }

  // Returns an error message, or null when the input is valid.
  validate(t: Partial<ThresholdInput>): string | null {
    for (const f of ["thiMax", "amoniaMax"] as (keyof ThresholdInput)[]) {
      const v = t[f];
      if (typeof v !== "number" || Number.isNaN(v)) return `${f} harus berupa angka`;
    }
    // THI is normalized against (thiMax - 56); the ceiling must exceed 56.
    if ((t.thiMax as number) <= 56) return "Batas maksimal THI harus lebih besar dari 56";
    if ((t.amoniaMax as number) <= 0) return "Batas maksimal amonia harus lebih besar dari 0";
    return null;
  }

  async saveThreshold(data: ThresholdInput & { updatedBy: string }) {
    const { thiMax, amoniaMax, updatedBy } = data;
    return prisma.threshold.upsert({
      where: { id: 1 },
      update: { thiMax, amoniaMax, updatedBy },
      create: { id: 1, thiMax, amoniaMax, updatedBy },
    });
  }
}

export const thresholdService = new ThresholdService();
