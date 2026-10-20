"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Zap,
  Users,
  Trophy,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  Play,
  Layers,
} from "lucide-react";
import {
  SPORTS_REGISTRY,
  SportId,
  TournamentFormat,
  FORMAT_DESCRIPTIONS,
} from "@/lib/sports/config";

interface FreeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSport?: SportId;
}

export function FreeGameModal({
  isOpen,
  onClose,
  initialSport = "padel",
}: FreeGameModalProps) {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<SportId>(initialSport);
  const [format, setFormat] = useState<TournamentFormat>("americano");
  const [targetPoints, setTargetPoints] = useState<number>(32);
  const [scoringMode, setScoringMode] = useState<string>("split_points");
  const [totalRounds, setTotalRounds] = useState<number>(4);
  const [totalCourts, setTotalCourts] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Players list
  const [players, setPlayers] = useState<
    Array<{ id: string; name: string; gender: "MALE" | "FEMALE" }>
  >([
    { id: "1", name: "Player 1", gender: "MALE" },
    { id: "2", name: "Player 2", gender: "MALE" },
    { id: "3", name: "Player 3", gender: "FEMALE" },
    { id: "4", name: "Player 4", gender: "FEMALE" },
  ]);

  if (!isOpen) return null;

  const currentSport = SPORTS_REGISTRY[selectedSport];

  // Quick fill preset helpers
  function fillPlayers(count: number) {
    const names = [
      { name: "Reza", gender: "MALE" as const },
      { name: "Ardhi", gender: "MALE" as const },
      { name: "Ibad", gender: "MALE" as const },
      { name: "Savira", gender: "FEMALE" as const },
      { name: "Jojo", gender: "MALE" as const },
      { name: "Oji", gender: "MALE" as const },
      { name: "Dini", gender: "FEMALE" as const },
      { name: "Shana", gender: "FEMALE" as const },
      { name: "Fabian", gender: "MALE" as const },
      { name: "Andreas", gender: "MALE" as const },
      { name: "Ocan", gender: "MALE" as const },
      { name: "Ardian", gender: "MALE" as const },
    ];

    const slice = names.slice(0, count);
    setPlayers(
      slice.map((p, i) => ({
        id: String(i + 1),
        name: p.name,
        gender: p.gender,
      }))
    );
  }

  function handleAddPlayer() {
    const newId = String(Date.now());
    setPlayers((prev) => [
      ...prev,
      {
        id: newId,
        name: `Pemain ${prev.length + 1}`,
        gender: prev.length % 2 === 0 ? "MALE" : "FEMALE",
      },
    ]);
  }

  function handleRemovePlayer(index: number) {
    if (players.length <= 4) {
      setError("Minimal 4 pemain untuk turnamen");
      return;
    }
    setPlayers((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handlePlayerChange(
    index: number,
    field: "name" | "gender",
    val: string
  ) {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  async function handleStartGame() {
    if (players.length < 4) {
      setError("Minimal 4 pemain untuk turnamen.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const maxPossibleCourts = Math.max(1, Math.floor(players.length / 4));
      const chosenCourts = Math.min(totalCourts || 1, maxPossibleCourts);

      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Free Game - ${currentSport.name} ${format.toUpperCase()}`,
          sportId: selectedSport,
          format,
          scoringMode,
          targetPoints,
          totalCourts: chosenCourts,
          totalRounds: format === "americano" ? totalRounds : 5,
          isFreeGame: true,
          players: players.map((p) => ({
            name: p.name.trim() || "Anonymous",
            gender: p.gender,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect immediately to live tournament scoring arena!
      router.push(`/tournament/${data.tournamentId}`);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#74B72E]/10 text-[#32580E] text-xs font-semibold mb-1 border border-[#74B72E]/25">
              <Zap className="w-3.5 h-3.5" /> Free Game Mode (Tanpa Club)
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Setup Pertandingan Cepat
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Langsung masukkan nama & gender pemain, pilih aturan, dan mulai bermain!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* 1. Sport Choice */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
              1. Pilih Cabang Olahraga
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.values(SPORTS_REGISTRY).map((s) => {
                const isSelected = selectedSport === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSport(s.id);
                      setFormat(s.defaultFormat);
                      setTargetPoints(s.scoringPresets[0].defaultTargetPoints);
                      setScoringMode(s.scoringPresets[0].id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#74B72E]/10 border-[#74B72E] ring-2 ring-[#74B72E]/30"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900">{s.name}</span>
                      {s.id === "padel" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#74B72E] text-white font-bold">
                          Utama
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{s.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Format & Scoring */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
              2. Format Pertandingan & Aturan Skor
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              {currentSport.supportedFormats.map((f) => {
                const info = FORMAT_DESCRIPTIONS[f];
                const isSelected = format === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#74B72E]/10 border-[#74B72E] ring-2 ring-[#74B72E]/30"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{info.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        {info.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      {info.tag}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Target Points Presets */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Target Poin per Pertandingan:
                </span>
                <div className="flex items-center gap-1.5">
                  {[16, 21, 24, 32, 40].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setTargetPoints(pt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        targetPoints === pt
                          ? "bg-[#74B72E] text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {pt} Poin
                    </button>
                  ))}
                </div>
              </div>

              {format === "americano" && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs text-slate-700">
                  <span className="font-semibold">Jumlah Ronde:</span>
                  <div className="flex items-center gap-1.5">
                    {[3, 4, 5, 7, 8].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          totalRounds === r
                            ? "bg-[#74B72E]/15 text-[#32580E] border border-[#74B72E]/40"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {r} Ronde
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pilihan Jumlah Lapangan (Courts) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 mt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Jumlah Lapangan yang Dipakai:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tentukan berapa court padel yang digunakan untuk turnamen ini
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from(
                    { length: Math.max(1, Math.floor(players.length / 4)) },
                    (_, i) => i + 1
                  ).map((c) => {
                    const maxCourts = Math.max(1, Math.floor(players.length / 4));
                    const currentActiveCourt = Math.min(totalCourts || 1, maxCourts);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTotalCourts(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentActiveCourt === c
                            ? "bg-[#74B72E] text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {c} Lapangan
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-[11px] text-[#32580E] font-medium pt-1 border-t border-slate-200">
                {Math.min(totalCourts, Math.max(1, Math.floor(players.length / 4))) * 4 ===
                players.length ? (
                  <span>
                    ✅ Semua <strong>{players.length} pemain</strong> bermain serentak di{" "}
                    <strong>{Math.min(totalCourts, Math.max(1, Math.floor(players.length / 4)))} Lapangan</strong> tanpa istirahat.
                  </span>
                ) : (
                  <span>
                    ℹ️{" "}
                    <strong>
                      {Math.min(totalCourts, Math.max(1, Math.floor(players.length / 4))) * 4} pemain
                    </strong>{" "}
                    bertanding di{" "}
                    <strong>{Math.min(totalCourts, Math.max(1, Math.floor(players.length / 4)))} Lapangan</strong>,{" "}
                    <strong>
                      {players.length -
                        Math.min(totalCourts, Math.max(1, Math.floor(players.length / 4))) * 4} pemain
                    </strong>{" "}
                    rotasi istirahat bergantian tiap ronde.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Players input (Name + Gender) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  3. Daftar Pemain ({players.length} Pemain)
                </label>
                <span className="text-[11px] text-slate-500">
                  Pemain tidak butuh akun email — cukup isi nama dan gender.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fillPlayers(4)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs cursor-pointer"
                >
                  Contoh 4 Pemain
                </button>
                <button
                  type="button"
                  onClick={() => fillPlayers(8)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs cursor-pointer"
                >
                  Contoh 8 Pemain
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {players.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="w-6 text-center text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handlePlayerChange(idx, "name", e.target.value)}
                    placeholder={`Nama Pemain ${idx + 1}`}
                    className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 font-medium focus:outline-none placeholder:text-slate-400"
                  />
                  <select
                    value={p.gender}
                    onChange={(e) =>
                      handlePlayerChange(idx, "gender", e.target.value as any)
                    }
                    className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#74B72E]"
                  >
                    <option value="MALE">Laki-laki (M)</option>
                    <option value="FEMALE">Perempuan (F)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPlayer}
              className="mt-2.5 w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#74B72E] text-slate-600 hover:text-[#32580E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50/50 hover:bg-[#74B72E]/5"
            >
              <Plus className="w-4 h-4" /> Tambah Pemain Lagi
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            Lapangan Digunakan:{" "}
            <span className="font-bold text-slate-900">
              {Math.min(totalCourts || 1, Math.max(1, Math.floor(players.length / 4)))} Lapangan (Court)
            </span>
          </div>
          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading || players.length < 4}
              onClick={handleStartGame}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#74B72E]/25 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{loading ? "Menyiapkan..." : "Mulai Turnamen Sekarang"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
