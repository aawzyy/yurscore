"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Trophy,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Users,
  Award,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  Flame,
  Minus,
  Plus,
  CircleDot,
  Check,
  Shield,
  Clock,
} from "lucide-react";
import { SPORTS_REGISTRY, SportId, FORMAT_DESCRIPTIONS } from "@/lib/sports/config";

export function TournamentClient({ tournamentId }: { tournamentId: string }) {
  const id = tournamentId;
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courts" | "standings" | "rounds">("courts");
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);

  // Score edit state per match
  const [editingScores, setEditingScores] = useState<
    Record<string, { s1: number; s2: number; serving: number }>
  >({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [generatingRound, setGeneratingRound] = useState(false);
  const [completingTournament, setCompletingTournament] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Fetch tournament data
  async function loadData() {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil turnamen");
      const data = await res.json();
      setTournament(data.tournament);
      setStandings(data.standings);
      setStats(data.stats);

      // Initialize editing scores for matches
      const scoreMap: Record<string, { s1: number; s2: number; serving: number }> = {};
      data.tournament.rounds?.forEach((r: any) => {
        r.matches?.forEach((m: any) => {
          scoreMap[m.id] = {
            s1: m.team1Score || 0,
            s2: m.team2Score || 0,
            serving: m.servingTeam || 1,
          };
        });
      });
      setEditingScores(scoreMap);

      // Select active round or default tab
      if (data.tournament.status === "COMPLETED") {
        setActiveTab("standings");
      } else {
        const activeR = data.tournament.rounds?.find((r: any) => r.status === "ACTIVE");
        if (activeR) {
          setActiveRoundNumber(activeR.roundNumber);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#74B72E] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs text-slate-500 font-bold tracking-wider uppercase">
            Memuat Arena Turnamen...
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <h2 className="text-xl font-bold text-slate-900">Turnamen Tidak Ditemukan</h2>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-xs font-bold text-white inline-block shadow-xs transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const sportDef = SPORTS_REGISTRY[tournament.sportId as SportId] || SPORTS_REGISTRY.padel;
  const currentRound = tournament.rounds?.find(
    (r: any) => r.roundNumber === activeRoundNumber
  );

  // Score increment / decrement helper
  function updateScore(matchId: string, team: 1 | 2, delta: number) {
    setEditingScores((prev) => {
      const curr = prev[matchId] || { s1: 0, s2: 0, serving: 1 };
      const target = tournament.targetPoints || 32;
      const isSplitPoints = tournament.scoringMode === "split_points";

      let nextS1 = curr.s1;
      let nextS2 = curr.s2;

      if (team === 1) {
        nextS1 = Math.max(0, nextS1 + delta);
        if (isSplitPoints && nextS1 <= target) {
          nextS2 = target - nextS1;
        }
      } else {
        nextS2 = Math.max(0, nextS2 + delta);
        if (isSplitPoints && nextS2 <= target) {
          nextS1 = target - nextS2;
        }
      }

      return {
        ...prev,
        [matchId]: {
          ...curr,
          s1: nextS1,
          s2: nextS2,
        },
      };
    });
  }

  function setDirectScore(matchId: string, s1: number, s2: number) {
    setEditingScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { serving: 1 }),
        s1,
        s2,
      },
    }));
  }

  function toggleServe(matchId: string) {
    setEditingScores((prev) => {
      const curr = prev[matchId] || { s1: 0, s2: 0, serving: 1 };
      return {
        ...prev,
        [matchId]: {
          ...curr,
          serving: curr.serving === 1 ? 2 : 1,
        },
      };
    });
  }

  // Save match score
  async function handleSaveMatch(matchId: string, markCompleted: boolean) {
    setSavingMatchId(matchId);
    try {
      const s = editingScores[matchId] || { s1: 0, s2: 0, serving: 1 };
      const res = await fetch(`/api/tournaments/${id}/match/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Score: s.s1,
          team2Score: s.s2,
          servingTeam: s.serving,
          status: markCompleted ? "COMPLETED" : "IN_PROGRESS",
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan skor");
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMatchId(null);
    }
  }

  // Mexicano: generate next round
  async function handleGenerateNextMexicanoRound() {
    setGeneratingRound(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/next-round`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadData();
      setActiveRoundNumber(data.round.roundNumber);
    } catch (e: any) {
      alert(e.message || "Gagal membuat ronde baru");
    } finally {
      setGeneratingRound(false);
    }
  }

  // Complete Tournament
  async function handleCompleteTournament() {
    setCompletingTournament(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal menyelesaikan turnamen");

      // Confetti celebration!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      await loadData();
      setActiveTab("standings");
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingTournament(false);
    }
  }

  // Find player name helper
  const playerMap = new Map<string, string>(
    tournament.players?.map((p: any) => [p.id, p.name])
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Link
              href="/"
              className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-slate-900 text-xs sm:text-base tracking-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                  {tournament.title}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25 shrink-0">
                  {sportDef.name}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 sm:gap-1.5 mt-0.5 truncate">
                {tournament.club ? (
                  <span className="flex items-center gap-1 text-slate-700 font-medium truncate max-w-[100px] sm:max-w-[140px]">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#74B72E] shrink-0" /> {tournament.club.name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#32580E] font-medium shrink-0">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#74B72E] shrink-0" /> Free Game
                  </span>
                )}
                <span className="shrink-0">• {tournament.targetPoints} Poin</span>
                <span className="text-[#32580E] font-medium shrink-0 hidden xs:inline">• 🏟️ {tournament.totalCourts} Lap</span>
              </div>
            </div>
          </div>

          {/* Tournament Status & Action */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {tournament.status === "COMPLETED" ? (
              <span className="h-8.5 px-2.5 sm:px-3 rounded-xl bg-[#74B72E]/10 border border-[#74B72E]/30 text-[#32580E] text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Trophy className="w-3.5 h-3.5 text-[#74B72E] shrink-0" />
                <span className="hidden sm:inline">Turnamen Selesai</span>
                <span className="sm:hidden">Selesai</span>
              </span>
            ) : (
              <button
                onClick={() => setShowCompleteConfirm(true)}
                disabled={completingTournament}
                className="h-8.5 px-3 sm:px-4 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{completingTournament ? "..." : "Selesaikan Turnamen"}</span>
                <span className="sm:hidden">{completingTournament ? "..." : "Selesaikan"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-11 flex items-center gap-4 sm:gap-6 border-t border-slate-200/80 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab("courts")}
            className={`h-11 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "courts"
                ? "border-[#74B72E] text-[#32580E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#74B72E]" />
            <span>Lapangan & Skor Live</span>
          </button>
          <button
            onClick={() => setActiveTab("standings")}
            className={`h-11 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "standings"
                ? "border-[#74B72E] text-[#32580E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#74B72E]" />
            <span>Papan Klasemen</span>
          </button>
          <button
            onClick={() => setActiveTab("rounds")}
            className={`h-11 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "rounds"
                ? "border-[#74B72E] text-[#32580E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#74B72E]" />
            <span>Jadwal & Hasil Ronde</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: COURTS & SCORING */}
        {activeTab === "courts" && (
          <div className="space-y-6">
            {tournament.status === "COMPLETED" && (
              <div className="p-4 rounded-2xl bg-[#74B72E]/10 border border-[#74B72E]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#74B72E] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trophy className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#32580E]">
                      Turnamen Telah Selesai
                    </h4>
                    <p className="text-xs text-slate-600">
                      Seluruh skor pertandingan telah final dan hasil klasemen resmi tersimpan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("standings")}
                  className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Lihat Klasemen & Podium Akhir</span>
                </button>
              </div>
            )}

            {/* Round Switcher Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 shadow-2xs p-3 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                  Pilih Ronde:
                </span>
                {tournament.rounds?.map((r: any) => {
                  const isActive = activeRoundNumber === r.roundNumber;
                  const isDone = r.status === "COMPLETED";
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveRoundNumber(r.roundNumber)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? "bg-[#74B72E] text-white shadow-xs"
                          : isDone
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 text-[#32580E]" />}
                      <span>Ronde {r.roundNumber}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mexicano dynamic round prompt */}
              {tournament.format === "mexicano" &&
                currentRound?.status === "COMPLETED" &&
                tournament.rounds.length < tournament.totalRounds && (
                  <button
                    onClick={handleGenerateNextMexicanoRound}
                    disabled={generatingRound}
                    className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#74B72E]/20 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>
                      {generatingRound
                        ? "Menghitung..."
                        : `Buat Ronde ${tournament.rounds.length + 1} (Mexicano Dynamic)`}
                    </span>
                  </button>
                )}
            </div>

            {/* Resting Players in this round if any */}
            {(() => {
              const activeIds = new Set<string>();
              currentRound?.matches?.forEach((m: any) => {
                if (m.team1Player1Id) activeIds.add(m.team1Player1Id);
                if (m.team1Player2Id) activeIds.add(m.team1Player2Id);
                if (m.team2Player1Id) activeIds.add(m.team2Player1Id);
                if (m.team2Player2Id) activeIds.add(m.team2Player2Id);
              });
              const resting =
                tournament.players?.filter((p: any) => !activeIds.has(p.id)) || [];

              if (resting.length === 0) return null;

              return (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
                    Giliran Istirahat
                  </span>
                  <span className="text-slate-700">
                    Pemain yang duduk di Ronde {activeRoundNumber}:{" "}
                    <strong className="text-slate-900 font-bold">
                      {resting.map((p: any) => p.name).join(", ")}
                    </strong>{" "}
                    (akan rotasi bermain di ronde berikutnya)
                  </span>
                </div>
              );
            })()}

            {/* Current Round Courts */}
            {currentRound ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentRound.matches?.map((match: any) => {
                  const s = editingScores[match.id] || {
                    s1: match.team1Score || 0,
                    s2: match.team2Score || 0,
                    serving: match.servingTeam || 1,
                  };
                  const isCompleted = match.status === "COMPLETED";
                  const isSaving = savingMatchId === match.id;

                  const t1p1 = playerMap.get(match.team1Player1Id) || "Player";
                  const t1p2 = match.team1Player2Id
                    ? playerMap.get(match.team1Player2Id)
                    : null;
                  const t2p1 = playerMap.get(match.team2Player1Id) || "Player";
                  const t2p2 = match.team2Player2Id
                    ? playerMap.get(match.team2Player2Id)
                    : null;

                  return (
                    <div
                      key={match.id}
                      className={`relative rounded-3xl border transition-all overflow-hidden ${
                        isCompleted
                          ? "bg-slate-50/70 border-slate-200/90 shadow-2xs"
                          : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      {/* Court Header Bar */}
                      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#74B72E] animate-pulse" />
                          <span className="font-extrabold text-sm text-slate-900">
                            Court {match.courtNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? "bg-slate-200 text-slate-700"
                                : "bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25"
                            }`}
                          >
                            {isCompleted ? "Match Selesai" : "Sedang Main"}
                          </span>
                        </div>
                      </div>

                      {/* Teams & Large Interactive Score Controller */}
                      <div className="p-5 sm:p-6 space-y-6">
                        {/* Team 1 Card */}
                        <div
                          className={`p-4 rounded-2xl border transition-all ${
                            s.s1 > s.s2 && isCompleted
                              ? "bg-[#74B72E]/10 border-[#74B72E]/40"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[#32580E] uppercase tracking-wider">
                                  Tim 1
                                </span>
                                {s.serving === 1 && !isCompleted && (
                                  <span
                                    onClick={() => toggleServe(match.id)}
                                    className="cursor-pointer text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1"
                                  >
                                    <CircleDot className="w-3 h-3 text-amber-600" /> Servis
                                  </span>
                                )}
                              </div>
                              <div className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                                {t1p1} {t1p2 && `& ${t1p2}`}
                              </div>
                            </div>

                            {/* Score Controls */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                              <span className="text-xs text-slate-400 font-semibold sm:hidden">Poin:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={isCompleted}
                                  onClick={() => updateScore(match.id, 1, -1)}
                                  className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 disabled:opacity-40 text-slate-700 flex items-center justify-center font-bold text-base transition-transform cursor-pointer shadow-2xs"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <div className="w-14 text-center font-mono font-black text-3xl sm:text-4xl text-slate-900">
                                  {s.s1}
                                </div>
                                <button
                                  disabled={isCompleted}
                                  onClick={() => updateScore(match.id, 1, 1)}
                                  className="w-10 h-10 rounded-xl bg-[#74B72E] hover:bg-[#639E25] active:scale-95 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base transition-transform cursor-pointer shadow-xs shadow-[#74B72E]/25"
                                >
                                  <Plus className="w-5 h-5 font-black" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* VS Divider with quick split presets */}
                        <div className="flex flex-wrap items-center justify-between px-1 sm:px-2 gap-2 text-xs text-slate-400">
                          <span className="font-bold tracking-widest uppercase text-slate-500">VS</span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 font-medium">Quick Score:</span>
                            {[
                              [18, 14],
                              [20, 12],
                              [16, 16],
                              [24, 8],
                            ].map(([p1, p2]) => (
                              <button
                                key={`${p1}-${p2}`}
                                disabled={isCompleted}
                                onClick={() => setDirectScore(match.id, p1, p2)}
                                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 text-slate-700 font-mono transition-colors cursor-pointer shadow-2xs"
                              >
                                {p1}-{p2}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Team 2 Card */}
                        <div
                          className={`p-4 rounded-2xl border transition-all ${
                            s.s2 > s.s1 && isCompleted
                              ? "bg-[#74B72E]/10 border-[#74B72E]/40"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                  Tim 2
                                </span>
                                {s.serving === 2 && !isCompleted && (
                                  <span
                                    onClick={() => toggleServe(match.id)}
                                    className="cursor-pointer text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1"
                                  >
                                    <CircleDot className="w-3 h-3 text-amber-600" /> Servis
                                  </span>
                                )}
                              </div>
                              <div className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                                {t2p1} {t2p2 && `& ${t2p2}`}
                              </div>
                            </div>

                            {/* Score Controls */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                              <span className="text-xs text-slate-400 font-semibold sm:hidden">Poin:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={isCompleted}
                                  onClick={() => updateScore(match.id, 2, -1)}
                                  className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 disabled:opacity-40 text-slate-700 flex items-center justify-center font-bold text-base transition-transform cursor-pointer shadow-2xs"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <div className="w-14 text-center font-mono font-black text-3xl sm:text-4xl text-slate-900">
                                  {s.s2}
                                </div>
                                <button
                                  disabled={isCompleted}
                                  onClick={() => updateScore(match.id, 2, 1)}
                                  className="w-10 h-10 rounded-xl bg-[#74B72E] hover:bg-[#639E25] active:scale-95 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base transition-transform cursor-pointer shadow-xs shadow-[#74B72E]/25"
                                >
                                  <Plus className="w-5 h-5 font-black" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2">
                          {isCompleted ? (
                            <button
                              onClick={() => handleSaveMatch(match.id, false)}
                              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Buka Ulang Skor (Edit)
                            </button>
                          ) : (
                            <div className="text-xs text-slate-500 font-medium">
                              Total Poin:{" "}
                              <span
                                className={`font-mono font-bold ${
                                  s.s1 + s.s2 === tournament.targetPoints
                                    ? "text-[#32580E]"
                                    : "text-amber-700"
                                }`}
                              >
                                {s.s1 + s.s2} / {tournament.targetPoints}
                              </span>
                            </div>
                          )}

                          <button
                            disabled={isSaving}
                            onClick={() => handleSaveMatch(match.id, true)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCompleted
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                : "bg-[#74B72E] hover:bg-[#639E25] text-white shadow-xs"
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {isSaving
                                ? "Menyimpan..."
                                : isCompleted
                                ? "Update Skor"
                                : "Kunci & Selesai Match"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
                <p className="text-sm text-slate-500 font-medium">
                  Ronde ini belum dimulai atau belum dibuat.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE STANDINGS & PODIUM */}
        {activeTab === "standings" && (
          <div className="space-y-8">
            {/* Podium for Top 3 */}
            {standings.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4 max-w-2xl mx-auto items-end">
                {/* 2nd Place */}
                <div className="p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-1.5 sm:space-y-2 order-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs sm:text-sm border border-slate-300">
                    2
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {standings[1].name}
                  </div>
                  <div className="text-xs sm:text-base font-black font-mono text-slate-700">
                    {standings[1].pointsScored} pts
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                    Diff: {standings[1].pointDiff > 0 ? `+${standings[1].pointDiff}` : standings[1].pointDiff}
                  </div>
                </div>

                {/* 1st Place (Champion) */}
                <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-t from-white to-[#74B72E]/10 border-2 border-[#74B72E] text-center space-y-2 sm:space-y-2.5 -translate-y-2 sm:-translate-y-3 shadow-md shadow-[#74B72E]/10 order-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-[#74B72E]/20 text-[#32580E] font-black flex items-center justify-center text-sm sm:text-base border border-[#74B72E]/40">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 fill-[#74B72E] text-[#74B72E]" />
                  </div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-base truncate">
                    {standings[0].name}
                  </div>
                  <div className="text-sm sm:text-xl font-black font-mono text-[#32580E]">
                    {standings[0].pointsScored} pts
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#32580E] font-bold">
                    Diff: {standings[0].pointDiff > 0 ? `+${standings[0].pointDiff}` : standings[0].pointDiff}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-1.5 sm:space-y-2 order-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-amber-50 text-amber-700 font-black flex items-center justify-center text-xs sm:text-sm border border-amber-200">
                    3
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {standings[2].name}
                  </div>
                  <div className="text-xs sm:text-base font-black font-mono text-slate-700">
                    {standings[2].pointsScored} pts
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                    Diff: {standings[2].pointDiff > 0 ? `+${standings[2].pointDiff}` : standings[2].pointDiff}
                  </div>
                </div>
              </div>
            )}

            {/* Complete Standings Table */}
            <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Papan Klasemen Lengkap
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Diurutkan berdasarkan Total Poin Scored, Selisih Poin (Diff), dan Menang
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {stats?.completedMatchesCount} dari {stats?.totalMatchesCount} Match Selesai
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Rank</th>
                      <th className="py-3 px-4">Pemain</th>
                      <th className="py-3 px-4 text-center">Gender</th>
                      <th className="py-3 px-4 text-center">Main</th>
                      <th className="py-3 px-4 text-center">M / S / K</th>
                      <th className="py-3 px-4 text-center">Poin Masuk</th>
                      <th className="py-3 px-4 text-center">Poin Kebobolan</th>
                      <th className="py-3 px-4 text-center">Selisih (Diff)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {standings.map((p, idx) => {
                      return (
                        <tr
                          key={p.playerId}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            idx === 0 ? "bg-[#74B72E]/5" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-bold">
                            {idx === 0 ? (
                              <span className="w-6 h-6 rounded-full bg-[#74B72E] text-white inline-flex items-center justify-center font-black">
                                1
                              </span>
                            ) : idx === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center font-black">
                                2
                              </span>
                            ) : idx === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 inline-flex items-center justify-center font-black">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {p.name}
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                            {p.gender === "FEMALE" ? "F" : "M"}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-700 font-mono">
                            {p.matchesPlayed}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                            <span className="text-[#32580E] font-bold">{p.matchesWon}</span> /{" "}
                            <span className="text-slate-600">{p.matchesDrawn}</span> /{" "}
                            <span className="text-red-600">{p.matchesLost}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-[#32580E] text-sm">
                            {p.pointsScored}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                            {p.pointsConceded}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span
                              className={
                                p.pointDiff > 0
                                  ? "text-[#32580E]"
                                  : p.pointDiff < 0
                                  ? "text-red-600"
                                  : "text-slate-500"
                              }
                            >
                              {p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALL ROUNDS & SCHEDULE */}
        {activeTab === "rounds" && (
          <div className="space-y-6">
            {tournament.rounds?.map((r: any) => (
              <div
                key={r.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">
                      Ronde {r.roundNumber}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        r.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25"
                      }`}
                    >
                      {r.status === "COMPLETED" ? "Selesai" : "Aktif"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveRoundNumber(r.roundNumber);
                      setActiveTab("courts");
                    }}
                    className="text-xs text-[#32580E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Buka Scoring</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {r.matches?.map((m: any) => {
                    const t1p1 = playerMap.get(m.team1Player1Id) || "Player";
                    const t1p2 = m.team1Player2Id
                      ? playerMap.get(m.team1Player2Id)
                      : null;
                    const t2p1 = playerMap.get(m.team2Player1Id) || "Player";
                    const t2p2 = m.team2Player2Id
                      ? playerMap.get(m.team2Player2Id)
                      : null;

                    const isCompleted = m.status === "COMPLETED";
                    const t1Wins = isCompleted && m.team1Score > m.team2Score;
                    const t2Wins = isCompleted && m.team2Score > m.team1Score;

                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs gap-3 transition-colors ${
                          isCompleted
                            ? "bg-slate-50 border-slate-200"
                            : "bg-white border-slate-200/90 shadow-2xs"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Court {m.courtNumber}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isCompleted
                                  ? "bg-slate-200/80 text-slate-700"
                                  : "bg-[#74B72E]/10 text-[#32580E]"
                              }`}
                            >
                              {isCompleted ? "Final" : "In Progress"}
                            </span>
                          </div>

                          <div
                            className={`truncate flex items-center gap-1.5 ${
                              t1Wins ? "font-black text-slate-900" : "font-medium text-slate-600"
                            }`}
                          >
                            {t1Wins && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            <span>{t1p1} {t1p2 && `& ${t1p2}`}</span>
                          </div>

                          <div
                            className={`truncate flex items-center gap-1.5 ${
                              t2Wins ? "font-black text-slate-900" : "font-medium text-slate-600"
                            }`}
                          >
                            {t2Wins && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            <span>{t2p1} {t2p2 && `& ${t2p2}`}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 space-y-0.5">
                          <div className="font-mono text-sm font-black flex items-center justify-end gap-1.5">
                            <span className={t1Wins ? "text-[#32580E]" : "text-slate-700"}>
                              {m.team1Score}
                            </span>
                            <span className="text-slate-300">-</span>
                            <span className={t2Wins ? "text-[#32580E]" : "text-slate-700"}>
                              {m.team2Score}
                            </span>
                          </div>
                          {isCompleted && (
                            <div className="text-[9px] font-bold text-slate-400 uppercase">
                              {t1Wins ? "Tim 1 Menang" : t2Wins ? "Tim 2 Menang" : "Seri"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Modal: Selesaikan Turnamen */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Selesaikan Turnamen?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Progress saat ini: <strong>{stats?.completedMatchesCount || 0}</strong> dari{" "}
                <strong>{stats?.totalMatchesCount || 0}</strong> match selesai.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Setelah diselesaikan, seluruh skor akan dikunci secara permanen, podium juara
                akan dihitung, dan riwayat akan tercatat di dashboard seluruh pemain.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={completingTournament}
                onClick={async () => {
                  setShowCompleteConfirm(false);
                  await handleCompleteTournament();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{completingTournament ? "Menyelesaikan..." : "Ya, Selesaikan & Kunci"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
