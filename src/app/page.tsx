"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Zap,
  Shield,
  Users,
  Plus,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  Play,
  Share2,
  ChevronRight,
  Target,
  CircleDot,
  CheckCircle2,
  LayoutDashboard,
  ArrowLeft,
  Settings,
  X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { FreeGameModal } from "@/components/FreeGameModal";
import { ClubView } from "@/components/ClubView";
import { MemberDashboard } from "@/components/MemberDashboard";
import {
  SPORTS_REGISTRY,
  SportId,
  TournamentFormat,
  FORMAT_DESCRIPTIONS,
} from "@/lib/sports/config";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportId>("padel");
  const [dashboardData, setDashboardData] = useState<any>(null);

  // View state: "dashboard" (logged-in member/admin view), "club" (detailed club view), "public" (when logged out)
  const [viewMode, setViewMode] = useState<"dashboard" | "club" | "public">("dashboard");

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFreeGameModal, setShowFreeGameModal] = useState(false);
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);

  // Invite parameter states
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [initialAuthEmail, setInitialAuthEmail] = useState("");
  const [joinClubNotice, setJoinClubNotice] = useState<string | null>(null);

  // New Club form state
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);
  const [createClubError, setCreateClubError] = useState<string | null>(null);

  // Load auth & dashboard
  async function loadInitialData() {
    try {
      // 1. Get current user
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      if (userData.user) {
        // Fetch personalized member/admin dashboard
        const dashRes = await fetch("/api/dashboard");
        if (dashRes.ok) {
          const dash = await dashRes.json();
          setDashboardData(dash);
        }

        // Fetch clubs
        const clubsRes = await fetch("/api/clubs");
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          setClubs(clubsData.clubs || []);
          if (clubsData.clubs?.length > 0 && !selectedClubId) {
            setSelectedClubId(clubsData.clubs[0].id);
          }
        }
        setViewMode("dashboard");
      } else {
        setViewMode("public");
      }

      // Check URL query parameters for club invite or email registration
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const clubCode = params.get("clubInvite");
        const inviteEmail = params.get("inviteEmail");

        if (inviteEmail) {
          setInitialAuthEmail(inviteEmail);
        }

        if (clubCode) {
          if (userData.user) {
            // User is logged in: join club automatically
            try {
              const joinRes = await fetch("/api/clubs/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: clubCode }),
              });
              const joinData = await joinRes.json();
              if (joinRes.ok) {
                setJoinClubNotice(joinData.message);
                if (joinData.club) {
                  setSelectedClubId(joinData.club.id);
                  setViewMode("club");
                }
              }
            } catch (err) {
              console.error("Join club error:", err);
            }
          } else {
            // User not logged in: show invitation notice & open registration modal
            setInviteNotice(
              `Anda diundang bergabung ke club dengan kode "${clubCode}". Silakan daftar atau masuk untuk otomatis terhubung.`
            );
            setShowAuthModal(true);
          }
        }
      }
    } catch (e) {
      console.error("Failed loading data:", e);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setClubs([]);
    setSelectedClubId(null);
    setDashboardData(null);
    setViewMode("public");
  }

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault();
    if (!newClubName.trim()) return;

    setCreatingClub(true);
    setCreateClubError(null);

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClubName.trim(),
          description: newClubDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewClubName("");
      setNewClubDesc("");
      setShowCreateClubModal(false);
      await loadInitialData();
      if (data.club) {
        setSelectedClubId(data.club.id);
        setViewMode("club");
      }
    } catch (e: any) {
      setCreateClubError(e.message);
    } finally {
      setCreatingClub(false);
    }
  }

  const activeClub = clubs.find((c) => c.id === selectedClubId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onStartFreeGame={() => setShowFreeGameModal(true)}
        onGoToDashboard={() => setViewMode("dashboard")}
      />

      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full space-y-6 sm:space-y-8">
        {/* Join Club / Invite Notification Banner */}
        {joinClubNotice && (
          <div className="p-3.5 rounded-2xl bg-[#74B72E]/10 border border-[#74B72E]/30 text-xs text-[#32580E] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
              <span className="font-semibold">{joinClubNotice}</span>
            </div>
            <button
              onClick={() => setJoinClubNotice(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* =========================================================================
            STATE 1: LOGGED-IN MEMBER / ADMIN DASHBOARD VIEW
           ========================================================================= */}
        {currentUser && viewMode === "dashboard" && (
          <div className="space-y-6">
            <MemberDashboard
              dashboardData={dashboardData}
              onOpenFreeGame={() => setShowFreeGameModal(true)}
              onOpenClubManagement={(clubId) => {
                setSelectedClubId(clubId);
                setViewMode("club");
              }}
              onCreateClub={() => setShowCreateClubModal(true)}
              onRefresh={loadInitialData}
            />
          </div>
        )}

        {/* =========================================================================
            STATE 2: CLUB VIEW (ADMIN MANAGEMENT OR MEMBER VIEW)
           ========================================================================= */}
        {currentUser && viewMode === "club" && activeClub && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Breadcrumb / Navigation back to Member Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 shadow-xs p-3 rounded-2xl gap-2.5">
              <button
                onClick={() => setViewMode("dashboard")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer w-fit shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Dashboard Saya</span>
              </button>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-slate-500 mr-1 hidden sm:inline shrink-0">Pilih Club:</span>
                {clubs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClubId(c.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedClubId === c.id
                        ? "bg-[#74B72E] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Club View with Role-Based Permissions */}
            <ClubView
              club={activeClub}
              currentUser={currentUser}
              onRefreshClub={loadInitialData}
              onDeletedClub={async () => {
                await loadInitialData();
                setViewMode("dashboard");
              }}
            />
          </div>
        )}

        {/* =========================================================================
            STATE 3: PUBLIC HOMEPAGE (WHEN NOT LOGGED IN)
           ========================================================================= */}
        {!currentUser && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Section */}
            <div className="relative rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-10 overflow-hidden">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#74B72E]/10 text-[#32580E] text-xs font-bold border border-[#74B72E]/25">
                  <Sparkles className="w-3.5 h-3.5 text-[#74B72E]" />
                  <span>Platform Scoring Turnamen Multi-Sport Korporasi</span>
                </div>

                <h1 className="text-2xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Scoring Pintar untuk{" "}
                  <span className="text-[#74B72E]">
                    Padel
                  </span>{" "}
                  & Racket Sports
                </h1>

                <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Turnamen <strong>Americano</strong> dengan rotasi pasangan seimbang, <strong>Mexicano</strong> dengan matchmaking dinamis, serta scoring langsung di lapangan dengan sistem pencatatan data club yang rapi dan profesional.
                </p>

                {/* Sport Tabs Bar */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold mr-1">
                    Pilih Cabang:
                  </span>
                  {Object.values(SPORTS_REGISTRY).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSport(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedSport === s.id
                          ? "bg-[#74B72E] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{s.name}</span>
                      {s.id === "padel" && (
                        <span className="text-[9px] bg-white/30 px-1 py-0.2 rounded font-extrabold">
                          Utama
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2 Main Game Play Modes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Free Game */}
              <div className="relative group rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#74B72E]/60 p-5 sm:p-8 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Instan • Tanpa Akun
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#74B72E] transition-colors">
                      Free Game (Main Tanpa Club)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      Tidak butuh pendaftaran akun pemain. Cukup masukkan nama dan gender pemain di lapangan, tentukan format Americano / Mexicano, pilih berapa lapangan, dan mulai hitung skor secara live!
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
                      <span>Input nama & gender instan (preset 4 / 8 pemain)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
                      <span>Pilihan jumlah lapangan & aturan skor fleksibel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
                      <span>Papan skor & podium live di lapangan</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowFreeGameModal(true)}
                  className="mt-6 w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Free Game Sekarang</span>
                </button>
              </div>

              {/* Card 2: Club Mode */}
              <div className="relative group rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#74B72E]/60 p-5 sm:p-8 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#74B72E]/10 border border-[#74B72E]/25 flex items-center justify-center text-[#32580E]">
                      <Shield className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/20">
                      Data Tersimpan • Komunitas
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#74B72E] transition-colors">
                      Main Bareng Club
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      Gabung atau buat club, undang teman via email dengan link registrasi otomatis, dan simpan riwayat pertandingan, statistik pribadi, serta juara club.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
                      <span>Undang member via email (otomatis aktif saat registrasi)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
                      <span>Dashboard member pribadi: info club, live match, riwayat main</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
                      <span>Panel admin khusus untuk manajemen club & jadwal in-advance</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAuthModal(true)}
                  className="mt-6 w-full py-3.5 rounded-2xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Login / Masuk ke Akun Club</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create Club */}
      {showCreateClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#74B72E]" />
                <h3 className="text-lg font-bold text-slate-900">Buat Club Baru</h3>
              </div>
              <button
                onClick={() => setShowCreateClubModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {createClubError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {createClubError}
              </div>
            )}

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Nama Club
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bali Padel Squad"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  placeholder="Deskripsi komunitas atau lokasi bermain..."
                  rows={3}
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClubModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingClub}
                  className="px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50"
                >
                  {creatingClub ? "Membuat..." : "Simpan & Buat Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Free Game Modal */}
      <FreeGameModal
        isOpen={showFreeGameModal}
        onClose={() => setShowFreeGameModal(false)}
        initialSport={selectedSport}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setInviteNotice(null);
        }}
        initialTab={inviteNotice ? "register" : "login"}
        initialEmail={initialAuthEmail}
        customInviteNotice={inviteNotice}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadInitialData();
        }}
      />
    </div>
  );
}
