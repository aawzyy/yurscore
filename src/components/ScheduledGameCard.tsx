"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Check,
  X,
  Users,
  Trophy,
  Sparkles,
  UserCheck,
  UserX,
  Loader2,
  MessageSquare,
  Bell,
  AlertCircle,
} from "lucide-react";
import { SPORTS_REGISTRY, SportId } from "@/lib/sports/config";

interface ScheduledGameCardProps {
  game: {
    id: string;
    title: string;
    description?: string | null;
    clubName: string;
    sportId: string;
    format: string;
    scheduledAt: string;
    location?: string | null;
    totalCourts: number;
    targetPoints: number;
    maxPlayers: number;
    status: string;
    rsvpDeadline?: string | null;
    notes?: string | null;
    totalInvited: number;
    myRsvp: {
      id: string;
      rsvpStatus: string; // PENDING, ACCEPTED, DECLINED
      dayOfStatus: string | null;
      note?: string | null;
    } | null;
  };
  onRsvpUpdate: () => Promise<void>;
  compact?: boolean;
}

export function ScheduledGameCard({
  game,
  onRsvpUpdate,
  compact = false,
}: ScheduledGameCardProps) {
  const [responding, setResponding] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myStatus = game.myRsvp?.rsvpStatus || "PENDING";
  const sport = SPORTS_REGISTRY[game.sportId as SportId] || SPORTS_REGISTRY.padel;
  const gameDate = new Date(game.scheduledAt);
  const isToday =
    gameDate.toDateString() === new Date().toDateString();
  const isTomorrow =
    new Date(gameDate.toDateString()) <=
    new Date(new Date().setDate(new Date().getDate() + 1));

  const rsvpDeadlinePassed =
    game.rsvpDeadline && new Date(game.rsvpDeadline) < new Date();

  async function handleRsvp(status: "ACCEPTED" | "DECLINED") {
    setResponding(true);
    setError(null);
    try {
      const res = await fetch(`/api/scheduled-games/${game.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvpStatus: status,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowNoteInput(false);
      setNote("");
      await onRsvpUpdate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResponding(false);
    }
  }

  const dateLabel = isToday
    ? "HARI INI"
    : isTomorrow
    ? "BESOK"
    : gameDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        myStatus === "ACCEPTED"
          ? "bg-[#74B72E]/5 border-[#74B72E]/30"
          : myStatus === "DECLINED"
          ? "bg-slate-50 border-slate-200 opacity-80"
          : "bg-white border-slate-200 shadow-xs"
      } ${isToday ? "ring-2 ring-amber-400/30" : ""}`}
    >
      {/* Status Banner */}
      {isToday && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-1 tracking-widest uppercase">
          ⚡ HARI INI — Pertandingan Dimulai!
        </div>
      )}

      <div className={compact ? "p-4" : "p-5"}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#32580E] bg-[#74B72E]/15 px-2 py-0.5 rounded-full border border-[#74B72E]/30">
                {sport.name} • {game.format}
              </span>
              <span className="text-[11px] text-slate-500">{game.clubName}</span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 leading-tight truncate">
              {game.title}
            </h3>
            {game.description && !compact && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{game.description}</p>
            )}
          </div>

          {/* RSVP Badge */}
          <div className="shrink-0">
            {myStatus === "ACCEPTED" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#32580E] bg-[#74B72E]/15 px-2.5 py-1 rounded-xl border border-[#74B72E]/30">
                <Check className="w-3.5 h-3.5" /> Hadir
              </span>
            )}
            {myStatus === "DECLINED" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                <X className="w-3.5 h-3.5" /> Tidak Hadir
              </span>
            )}
            {myStatus === "PENDING" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 animate-pulse">
                <Bell className="w-3.5 h-3.5" /> Undangan
              </span>
            )}
          </div>
        </div>

        {/* Game Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#74B72E] shrink-0" />
            <span className={`font-semibold ${isToday ? "text-amber-700" : ""}`}>
              {dateLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {gameDate.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {game.location && (
            <div className="flex items-center gap-2 text-xs text-slate-700 col-span-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{game.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{game.totalInvited} Diundang</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span>
              {game.totalCourts} Court • {game.targetPoints} Poin
            </span>
          </div>
        </div>

        {/* Notes */}
        {game.notes && !compact && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{game.notes}</span>
          </div>
        )}

        {/* RSVP Deadline Warning */}
        {game.rsvpDeadline && !rsvpDeadlinePassed && myStatus === "PENDING" && (
          <div className="mb-3 flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Batas RSVP:{" "}
              <strong>
                {new Date(game.rsvpDeadline).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </span>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Action Buttons: RSVP or already responded */}
        {!rsvpDeadlinePassed && game.status !== "IN_PROGRESS" && game.status !== "COMPLETED" && (
          <div className="space-y-2">
            {myStatus === "PENDING" && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    disabled={responding}
                    onClick={() => handleRsvp("ACCEPTED")}
                    className="flex-1 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {responding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Ya, Saya Hadir!</span>
                  </button>
                  <button
                    disabled={responding}
                    onClick={() => handleRsvp("DECLINED")}
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tidak Bisa Hadir</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowNoteInput((v) => !v)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 w-full justify-center cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  {showNoteInput ? "Tutup catatan" : "Tambahkan catatan ke admin (opsional)"}
                </button>
                {showNoteInput && (
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder='Misal: "Saya terlambat 15 menit" atau "Mohon tunggu saya"'
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#74B72E]"
                  />
                )}
              </>
            )}

            {myStatus === "ACCEPTED" && !isToday && (
              <button
                disabled={responding}
                onClick={() => handleRsvp("DECLINED")}
                className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              >
                Batalkan Kehadiran Saya
              </button>
            )}

            {myStatus === "DECLINED" && (
              <button
                disabled={responding}
                onClick={() => handleRsvp("ACCEPTED")}
                className="w-full py-2.5 rounded-xl bg-[#74B72E]/10 hover:bg-[#74B72E]/20 text-[#32580E] font-bold text-xs border border-[#74B72E]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Ubah — Saya Jadi Hadir
              </button>
            )}
          </div>
        )}

        {/* Already started game — show link to arena */}
        {(game.status === "IN_PROGRESS" || isToday) && myStatus === "ACCEPTED" && (
          <div className="text-xs text-[#32580E] font-semibold flex items-center justify-center gap-1.5 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-[#74B72E]" />
            <span>Admin sedang mempersiapkan arena pertandingan...</span>
          </div>
        )}
      </div>
    </div>
  );
}
