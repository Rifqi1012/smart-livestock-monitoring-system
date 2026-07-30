"use client";

import { useState } from "react";
import { formatTanggalIndo } from "@/lib/format-date";
import { useToast } from "@/components/ui/toast";

type Initial = {
  thiMax: number;
  amoniaMax: number;
  updatedBy: string | null;
  updatedAt: string;
};

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{label}</span>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#10B981]"
      />
    </label>
  );
}

export default function ThresholdForm({ initial }: { initial: Initial }) {
  const [thiMax, setThiMax] = useState(String(initial.thiMax));
  const [amoniaMax, setAmoniaMax] = useState(String(initial.amoniaMax));
  const [meta, setMeta] = useState({ updatedBy: initial.updatedBy, updatedAt: initial.updatedAt });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/threshold", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thiMax: Number(thiMax), amoniaMax: Number(amoniaMax) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan");
      setMeta({ updatedBy: json.data.updatedBy, updatedAt: json.data.updatedAt });
      toast("Threshold berhasil disimpan", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Batas Maksimal THI" value={thiMax} onChange={setThiMax} />
        <NumberField label="Batas Maksimal Amonia" value={amoniaMax} onChange={setAmoniaMax} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {meta.updatedBy
            ? `Terakhir diubah oleh ${meta.updatedBy} pada ${formatTanggalIndo(meta.updatedAt)}`
            : "Belum pernah diubah"}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0ea371] disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Threshold"}
        </button>
      </div>
    </form>
  );
}
