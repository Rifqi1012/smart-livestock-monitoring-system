// THI (Temperature Humidity Index) — fixed physiological formula from the
// literature review. See CLAUDE.md "Core domain logic".
export class THICalculator {
  calculate(suhu: number, kelembapan: number): number {
    return 0.8 * suhu + (kelembapan / 100) * (suhu - 14.4) + 46.4;
  }
}
