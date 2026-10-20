"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  Shield,
  Zap,
  Play,
  Calendar,
  Clock,
  Award,
  ChevronRight,
  Share2,
  Check,
  Flame,
  Settings,
  UserCheck,
  Bell,
  Plus,
} from "lucide-react";
import { ScheduledGameCard } from "@/components/ScheduledGameCard";

interface MemberDashboardProps {
  dashboardData: any;
  onOpenFreeGame: () => void;
  onOpenClubManagement: (clubId: string) => void;
  onCreateClub: () => void;
  onRefresh: () => Promise<void>;
}

export function MemberDashboard({
  dashboardData,
  onOpenFreeGame,
  onOpenClubManagement,
  onCreateClub,
  onRefresh,
}: MemberDashboardProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const {
    user,
    clubs,
    nextGame,
    personalStats,
    personalHistory,
    scheduledGames = [],
    hasAdminAccess,
  } = dashboardData || {};

  const pendingRsvps = (scheduledGames || []).filter(
    (g: any) => g.myRsvp?.rsvpStatus === "PENDING"
  );
  const otherScheduledGames = (scheduledGames || []).filter(
    (g: any) => g.myRsvp?.rsvpStatus !== "PENDING"
  );

  function handleCopyInvite(code: string) {
    const link = `${window.location.origin}?clubInvite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Personalized Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm p-5 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  hasAdminAccess
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25"
                }`}
              >
                {hasAdminAccess ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Club Owner & Admin
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#74B72E] shrink-0" /> Member Terverifikasi
                  </>
                )}
              </span>
              <span className="text-xs text-slate-500 truncate max-w-full">
                Email: <strong className="text-slate-800">{user?.email}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Halo, <span className="text-[#74B72E]">{user?.name}</span>! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              {hasAdminAccess
                ? "Selamat datang di dashboard admin. Anda dapat mengelola club, mengatur jadwal game (in-advance), lineup pemain hari H, dan turnamen."
                : "Selamat datang di dashboard member. Pantau undangan scheduled game, konfirmasi RSVP kehadiran, dan riwayat skor Anda."}
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenFreeGame}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white shrink-0" />
              <span>Main Free Game Cepat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PENDING RSVP INVITATION BANNER (Immediate Action Required) */}
      {pendingRsvps.length > 0 && (
        <div className="rounded-3xl bg-amber-50/70 border border-amber-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600">
                <Bell className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Undangan Pertandingan Menunggu Konfirmasi ({pendingRsvps.length})
                </h2>
                <p className="text-xs text-amber-800">
                  Admin club telah menjadwalkan game in-advance. Konfirmasi kehadiran Anda agar masuk ke susunan pemain!
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
              Aksi Diperlukan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {pendingRsvps.map((game: any) => (
              <ScheduledGameCard
                key={game.id}
                game={game}
                onRsvpUpdate={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. SCHEDULED GAMES LIST (Upcoming In-Advance Games) */}
      {otherScheduledGames.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#74B72E]" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Jadwal Pertandingan Mendatang (In-Advance) ({otherScheduledGames.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Rencana main yang akan datang & status konfirmasi RSVP Anda
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500">
              RSVP Terkonfirmasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherScheduledGames.map((game: any) => (
              <ScheduledGameCard
                key={game.id}
                game={game}
                onRsvpUpdate={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. LIVE MATCH / PERTANDINGAN SEDANG BERLANGSUNG */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pertandingan Sedang Berlangsung (Live Match)
              </h2>
              <p className="text-xs text-slate-500">
                Turnamen yang saat ini aktif dimainkan dan dihitung skornya di lapangan
              </p>
            </div>
          </div>
          {nextGame && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 animate-pulse border border-rose-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              LIVE DI LAPANGAN
            </span>
          )}
        </div>

        {nextGame ? (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#74B72E]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">
                  {nextGame.title}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/20">
                  {nextGame.sportId} • {nextGame.format}
                </span>
              </div>
              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                <span>📍 Club: <strong className="text-slate-800">{nextGame.clubName}</strong></span>
                <span>🏟️ <strong>{nextGame.totalCourts} Lapangan</strong></span>
                <span>🎯 Target <strong>{nextGame.targetPoints} Poin</strong></span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/tournament/${nextGame.id}`)}
              className="px-5 py-3 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Buka Lapangan & Live Score</span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
              Tidak Ada Pertandingan Aktif di Lapangan Saat Ini
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hasAdminAccess
                ? "Anda belum memulai turnamen langsung hari ini. Anda bisa memulai turnamen baru dari menu Manajemen Club atau dari Jadwal In-Advance di atas."
                : "Belum ada pertandingan yang sedang dimainkan di lapangan saat ini. Cek jadwal game in-advance di atas atau mulai Free Game santai bersama teman!"}
            </p>
          </div>
        )}
      </div>

      {/* 5. INFO SINGKAT CLUB YANG TERDAFTAR */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#74B72E] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Info Singkat Club Terdaftar</h2>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              Terdaftar di <strong className="text-slate-900">{clubs?.length || 0} Club</strong>
            </span>
            <button
              onClick={onCreateClub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Club Baru</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs?.map((c: any) => {
            const isAdmin = c.userRole === "OWNER" || c.userRole === "ADMIN";
            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <h3
                        onClick={() => onOpenClubManagement(c.id)}
                        className="font-extrabold text-base text-slate-900 hover:text-[#74B72E] cursor-pointer transition-colors"
                      >
                        {c.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAdmin
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/20"
                        }`}
                      >
                        {isAdmin ? "Admin / Owner" : "Member"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {c.description || "Komunitas Padel & Racket Sports"}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      {c.memberCount} Member
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Kode: <strong className="text-[#32580E]">{c.code}</strong>
                    </span>
                    <button
                      onClick={() => handleCopyInvite(c.code)}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check className="w-3 h-3 text-[#74B72E]" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3" /> Salin Link
                        </>
                      )}
                    </button>
                  </div>

                  {/* Role-based button: Admin gets Club Management; Member gets View Detail */}
                  {isAdmin ? (
                    <button
                      onClick={() => onOpenClubManagement(c.id)}
                      className="w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Kelola Club (Admin)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenClubManagement(c.id)}
                      className="w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#74B72E]/50 hover:bg-[#74B72E]/5 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                    >
                      <Users className="w-3.5 h-3.5 text-[#74B72E]" />
                      <span>Lihat Detail Grup</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. HISTORY PERMAINAN DIA & STATISTIK PRIBADI */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Riwayat Permainan & Statistik Anda</h2>
          </div>
          <span className="text-xs text-slate-500">
            {personalHistory?.length || 0} Turnamen Selesai
          </span>
        </div>

        {/* Personal Stats 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] sm:text-xs text-slate-500">Total Poin Dicetak</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#74B72E] mt-1">
              {personalStats?.totalPoints || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Semua turnamen</div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] sm:text-xs text-slate-500">Pertandingan Dimainkan</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
              {personalStats?.totalMatches || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Menang: {personalStats?.totalWins || 0} Match
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] sm:text-xs text-slate-500">Win Rate Pribadi</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-teal-600 mt-1">
              {personalStats?.winRate || 0}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Persentase kemenangan</div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] sm:text-xs text-slate-500">Koleksi Podium & Juara</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 mt-1 flex items-center gap-1 sm:gap-1.5">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
              <span>{personalStats?.podiums || 0}</span>
            </div>
            <div className="text-[10px] text-amber-700/80 mt-0.5 truncate">
              {personalStats?.goldTrophies || 0} Kali Juara 1 (Emas)
            </div>
          </div>
        </div>

        {/* Personal Match / Tournament List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Daftar Turnamen yang Diikuti:
          </h3>

          {personalHistory && personalHistory.length > 0 ? (
            <div className="space-y-2.5">
              {personalHistory.map((h: any) => {
                const isGold = h.myRank === 1;
                const isSilver = h.myRank === 2;
                const isBronze = h.myRank === 3;

                return (
                  <div
                    key={h.tournamentId}
                    onClick={() => router.push(`/tournament/${h.tournamentId}`)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-[#74B72E] transition-colors">
                          {h.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {h.sportId} • {h.format}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {h.clubName} • {new Date(h.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                      {/* My Rank badge */}
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1">
                          {isGold && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                          {isSilver && <Award className="w-4 h-4 text-slate-400 shrink-0" />}
                          {isBronze && <Award className="w-4 h-4 text-amber-700 shrink-0" />}
                          <span
                            className={`text-xs font-extrabold ${
                              isGold
                                ? "text-amber-600"
                                : isSilver
                                ? "text-slate-600"
                                : isBronze
                                ? "text-amber-800"
                                : "text-slate-500"
                            }`}
                          >
                            {h.myRank ? `Peringkat #${h.myRank}` : "Peserta"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          <strong className="text-[#74B72E]">{h.myPoints}</strong> Poin
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#74B72E] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
              Belum ada riwayat turnamen selesai yang Anda ikuti. Ikuti pertandingan di club atau mulai Free Game untuk mencatatkan rekor Anda!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
