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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#74B72E] p-0.5 shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                YurScore
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#74B72E]/15 text-[#32580E] border border-[#74B72E]/30">
                Padel & Sports
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 font-normal">
              Platform Scoring & Turnamen Korporasi
            </p>
          </div>
        </Link>

        {/* Center / Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Free Game Button */}
          <button
            onClick={onStartFreeGame}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#74B72E] hover:bg-[#639E25] text-white shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Main Free Game</span>
            <span className="sm:hidden">Free Game</span>
          </button>

          {/* User profile / Auth */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left shadow-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#74B72E]/15 border border-[#74B72E]/30 flex items-center justify-center text-xs font-bold text-[#32580E]">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                    <div className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#74B72E]/10 text-[#32580E] font-semibold border border-[#74B72E]/20">
                      Aktif ({currentUser.gender})
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-400 px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#74B72E]" /> Switch Akun Demo
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {allUsers
                      .filter((u) => u.id !== currentUser.id)
                      .map((u) => (
                        <button
                          key={u.id}
                          onClick={() => onSwitchUser(u.id)}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{u.gender}</span>
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
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#74B72E] text-white hover:bg-[#639E25] shadow-xs transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Login / Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
