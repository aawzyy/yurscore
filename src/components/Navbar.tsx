"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Zap,
  UserCheck,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  gender: string;
  avatarUrl?: string | null;
}

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (userId: string) => Promise<void>;
  onOpenAuth: () => void;
  onLogout: () => Promise<void>;
  onStartFreeGame: () => void;
}

export function Navbar({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenAuth,
  onLogout,
  onStartFreeGame,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#74B72E] shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 ring-1 ring-black/5">
            <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 leading-none">
                YurScore
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#74B72E]/15 text-[#32580E] border border-[#74B72E]/30">
                Padel & Sports
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
              Platform Scoring & Turnamen Korporasi
            </p>
          </div>
        </Link>

        {/* Center / Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Free Game Button (Subtle & Elegant Accent Pill) */}
          <button
            onClick={onStartFreeGame}
            className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-[#74B72E]/10 hover:bg-[#74B72E]/20 text-[#32580E] border border-[#74B72E]/30 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Mainkan pertandingan cepat tanpa login"
          >
            <Zap className="w-3.5 h-3.5 text-[#74B72E] fill-[#74B72E] shrink-0" />
            <span className="hidden sm:inline">Main Free Game</span>
            <span className="sm:hidden">Free Game</span>
          </button>

          {/* User profile / Auth */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-8.5 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors flex items-center gap-1.5 sm:gap-2 shadow-2xs cursor-pointer text-left shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-[#74B72E] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-800 max-w-[65px] sm:max-w-[120px] truncate leading-tight">
                  {currentUser.name.split(" ")[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-1.5 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-2">
                      <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#74B72E]/10 text-[#32580E] font-semibold border border-[#74B72E]/20">
                        Aktif ({currentUser.gender})
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-[#74B72E]" /> Switch Akun Demo
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {allUsers
                        .filter((u) => u.id !== currentUser.id)
                        .map((u) => (
                          <button
                            key={u.id}
                            onClick={() => onSwitchUser(u.id)}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-slate-900 truncate">{u.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{u.gender}</span>
                          </button>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="h-8.5 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#74B72E] text-white hover:bg-[#639E25] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Login / Masuk</span>
              <span className="xs:hidden">Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
