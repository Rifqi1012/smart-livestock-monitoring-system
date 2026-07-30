const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Indonesian date-time: "22 Juli 2026, jam 16.05" — full month name, 24h clock,
// no seconds, jam:menit separated by a dot, both zero-padded.
export function formatTanggalIndo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const tanggal = d.getDate();
  const bulan = BULAN[d.getMonth()];
  const tahun = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${tanggal} ${bulan} ${tahun}, jam ${HH}.${mm}`;
}
