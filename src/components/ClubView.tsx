"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Trophy,
  Mail,
  Plus,
  Play,
  Share2,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  UserPlus,
  Trash2,
  Calendar,
  MapPin,
  AlertCircle,
  UserCheck,
  UserX,
  Loader2,
  RotateCcw,
  Lock,
  Bell,
  MessageSquare,
  Pencil,
  X,
} from "lucide-react";
import {
  SPORTS_REGISTRY,
  SportId,
  TournamentFormat,
  FORMAT_DESCRIPTIONS,
} from "@/lib/sports/config";

interface Member {
  id: string;
  userId?: string | null;
  invitedEmail: string;
  role: string;
  status: string;
  user?: {
    id: string;
    name: string;
    email: string;
    gender: string;
    avatarUrl?: string | null;
  } | null;
}

interface TournamentSummary {
  id: string;
  title: string;
  sportId: string;
  format: string;
  targetPoints: number;
  status: string;
  createdAt: string;
  players: Array<{
    id: string;
    name: string;
    rank: number;
    pointsScored: number;
  }>;
}

interface ClubData {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  members: Member[];
  tournaments: TournamentSummary[];
}

interface ClubViewProps {
  club: ClubData;
  currentUser: any;
  onRefreshClub: () => Promise<void>;
  onDeletedClub?: () => void;
}

export function ClubView({ club, currentUser, onRefreshClub, onDeletedClub }: ClubViewProps) {
  const router = useRouter();

  const isOwner = currentUser?.id === club.ownerId;
  const currentMember = club.members.find(
    (m) => m.userId === currentUser?.id || m.invitedEmail === currentUser?.email
  );
  const isAdmin = isOwner || currentMember?.role === "ADMIN";

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccessNotice, setInviteSuccessNotice] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Create Tournament modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sportId, setSportId] = useState<SportId>("padel");
  const [format, setFormat] = useState<TournamentFormat>("americano");
  const [targetPoints, setTargetPoints] = useState<number>(32);
  const [totalRounds, setTotalRounds] = useState<number>(4);
  const [totalCourts, setTotalCourts] = useState<number>(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [tourneyLoading, setTourneyLoading] = useState(false);
  const [tourneyError, setTourneyError] = useState<string | null>(null);

  const activeSport = SPORTS_REGISTRY[sportId];

  // Right column active tab: "scheduled" | "tournaments"
  const [activeTab, setActiveTab] = useState<"scheduled" | "tournaments">("scheduled");

  // Scheduled Games state
  const [scheduledGames, setScheduledGames] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [startingGameId, setStartingGameId] = useState<string | null>(null);

  // Create Scheduled Game modal state
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedSportId, setSchedSportId] = useState<SportId>("padel");
  const [schedFormat, setSchedFormat] = useState<TournamentFormat>("americano");
  const [schedTargetPoints, setSchedTargetPoints] = useState<number>(32);
  const [schedCourts, setSchedCourts] = useState<number>(1);
  const [schedRounds, setSchedRounds] = useState<number>(4);
  const [schedDateTime, setSchedDateTime] = useState<string>("");
  const [schedLocation, setSchedLocation] = useState<string>("");
  const [schedDeadline, setSchedDeadline] = useState<string>("");
  const [schedNotes, setSchedNotes] = useState<string>("");
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);

  // Edit Club modal state
  const [showEditClubModal, setShowEditClubModal] = useState(false);
  const [editClubName, setEditClubName] = useState(club.name);
  const [editClubDesc, setEditClubDesc] = useState(club.description || "");
  const [editClubLoading, setEditClubLoading] = useState(false);
  const [editClubError, setEditClubError] = useState<string | null>(null);

  // Delete Club modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleUpdateClub(e: React.FormEvent) {
    e.preventDefault();
    if (!editClubName.trim()) {
      setEditClubError("Nama club tidak boleh kosong");
      return;
    }
    setEditClubLoading(true);
    setEditClubError(null);
    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editClubName.trim(),
          description: editClubDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowEditClubModal(false);
      await onRefreshClub();
    } catch (err: any) {
      setEditClubError(err.message);
    } finally {
      setEditClubLoading(false);
    }
  }

  async function handleDeleteClub(e: React.FormEvent) {
    e.preventDefault();
    if (confirmDeleteName.trim() !== club.name.trim()) {
      setDeleteError("Nama club yang diketik tidak cocok");
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowDeleteModal(false);
      if (onDeletedClub) {
        onDeletedClub();
      } else {
        await onRefreshClub();
      }
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleteLoading(false);
    }
  }

  // Role member modal state
  const [roleModalMember, setRoleModalMember] = useState<Member | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<string>("MEMBER");
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  async function handleSaveRoleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!roleModalMember) return;

    setRoleLoading(true);
    setRoleError(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: roleModalMember.id,
          newRole: selectedNewRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRoleModalMember(null);
      await onRefreshClub();
    } catch (err: any) {
      setRoleError(err.message);
    } finally {
      setRoleLoading(false);
    }
  }

  // Copy club code
  function handleCopyInviteLink() {
    const inviteLink = `${window.location.origin}?clubInvite=${club.code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Invite member by email
  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccessNotice(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInviteSuccessNotice(data.notice);
      setInviteEmail("");
      await onRefreshClub();
    } catch (e: any) {
      setInviteError(e.message);
    } finally {
      setInviteLoading(false);
    }
  }

  // Member selection helpers for tournament
  function toggleMemberSelection(memberId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function selectFirstNMembers(n: number) {
    const active = club.members.filter((m) => m.status === "ACTIVE");
    setSelectedMemberIds(active.slice(0, n).map((m) => m.id));
  }

  function selectAllActiveMembers() {
    setSelectedMemberIds(
      club.members.filter((m) => m.status === "ACTIVE").map((m) => m.id)
    );
  }

  // Open Create Tournament Modal
  function handleOpenCreateTourney() {
    const activeMembers = club.members.filter((m) => m.status === "ACTIVE");
    setSelectedMemberIds(activeMembers.slice(0, 4).map((m) => m.id));
    setTournamentTitle(`${club.name} - Americano Padel`);
    setShowCreateModal(true);
  }

  // Create Club Tournament
  async function handleCreateTournament() {
    if (selectedMemberIds.length < 4) {
      setTourneyError("Pilih minimal 4 pemain aktif untuk turnamen");
      return;
    }

    setTourneyLoading(true);
    setTourneyError(null);

    try {
      const chosenMembers = club.members.filter((m) =>
        selectedMemberIds.includes(m.id)
      );

      const playersPayload = chosenMembers.map((m) => ({
        userId: m.userId || null,
        name: m.user?.name || m.invitedEmail.split("@")[0],
        gender: m.user?.gender || "MALE",
      }));

      const maxCourts = Math.max(1, Math.floor(playersPayload.length / 4));
      const courts = Math.min(totalCourts || 1, maxCourts);

      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tournamentTitle.trim() || `${club.name} ${sportId.toUpperCase()} Tournament`,
          sportId,
          format,
          targetPoints,
          totalCourts: courts,
          totalRounds: format === "americano" ? totalRounds : 5,
          isFreeGame: false,
          clubId: club.id,
          players: playersPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/tournament/${data.tournamentId}`);
      setShowCreateModal(false);
    } catch (e: any) {
      setTourneyError(e.message);
    } finally {
      setTourneyLoading(false);
    }
  }

  // Fetch Scheduled Games for this club
  async function fetchScheduledGames() {
    setLoadingScheduled(true);
    try {
      const res = await fetch(`/api/scheduled-games?clubId=${club.id}`);
      const data = await res.json();
      if (res.ok) {
        setScheduledGames(data.games || []);
      }
    } catch (e) {
      console.error("Failed to fetch scheduled games:", e);
    } finally {
      setLoadingScheduled(false);
    }
  }

  useEffect(() => {
    fetchScheduledGames();
  }, [club.id]);

  function handleOpenScheduledModal() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localTomorrow = new Date(tomorrow.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);

    const deadline = new Date(tomorrow.getTime() - 4 * 3600000);
    const localDeadline = new Date(deadline.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);

    setSchedTitle(`${club.name} - Americano Game`);
    setSchedDateTime(localTomorrow);
    setSchedDeadline(localDeadline);
    setSchedLocation("Cilandak Padel Club - Lapangan 1 & 2");
    setSchedNotes("Harap konfirmasi RSVP sebelum batas waktu. Bola disediakan club.");
    setSchedError(null);
    setShowScheduledModal(true);
  }

  async function handleCreateScheduledGame(e: React.FormEvent) {
    e.preventDefault();
    if (!schedTitle.trim() || !schedDateTime) {
      setSchedError("Judul dan tanggal/jam pertandingan wajib diisi");
      return;
    }

    setSchedLoading(true);
    setSchedError(null);

    try {
      const res = await fetch("/api/scheduled-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: club.id,
          title: schedTitle.trim(),
          sportId: schedSportId,
          format: schedFormat,
          targetPoints: schedTargetPoints,
          totalCourts: schedCourts,
          totalRounds: schedRounds,
          scheduledAt: new Date(schedDateTime).toISOString(),
          rsvpDeadline: schedDeadline ? new Date(schedDeadline).toISOString() : null,
          location: schedLocation.trim(),
          notes: schedNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowScheduledModal(false);
      await fetchScheduledGames();
      await onRefreshClub();
    } catch (e: any) {
      setSchedError(e.message);
    } finally {
      setSchedLoading(false);
    }
  }

  // Admin Day-of Lineup adjustment: override individual player's participation
  async function handleAdjustDayOfStatus(
    gameId: string,
    rsvpId: string,
    dayOfStatus: "PLAYING" | "SITTING_OUT" | null
  ) {
    setActionLoadingId(rsvpId);
    try {
      const res = await fetch(`/api/scheduled-games/${gameId}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpId, dayOfStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchScheduledGames();
      await onRefreshClub();
    } catch (e: any) {
      alert(`Gagal update status: ${e.message}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Member responds to RSVP directly inside ClubView
  async function handleMemberRsvp(gameId: string, rsvpStatus: "ACCEPTED" | "DECLINED") {
    setActionLoadingId(gameId);
    try {
      const res = await fetch(`/api/scheduled-games/${gameId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchScheduledGames();
      await onRefreshClub();
    } catch (e: any) {
      alert(`Gagal RSVP: ${e.message}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Admin starts tournament from scheduled game
  async function handleStartScheduledGame(gameId: string) {
    setStartingGameId(gameId);
    try {
      const res = await fetch(`/api/scheduled-games/${gameId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/tournament/${data.tournamentId}`);
    } catch (e: any) {
      alert(`Gagal memulai turnamen: ${e.message}`);
    } finally {
      setStartingGameId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Club Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#74B72E]" /> Club Terverifikasi
              </span>
              <span className="text-xs text-slate-500">
                Pemilik: <span className="text-slate-900 font-semibold">{club.owner.name}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {club.name}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {club.description || "Komunitas olahraga padel & racket sports untuk bermain turnamen Americano & Mexicano."}
            </p>

            {/* Actions: Invite Code & Club Management */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                Kode Invite: <strong className="text-[#32580E] font-bold">{club.code}</strong>
              </div>
              <button
                onClick={handleCopyInviteLink}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#74B72E]" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" /> Salin Link Undangan
                  </>
                )}
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setEditClubName(club.name);
                      setEditClubDesc(club.description || "");
                      setEditClubError(null);
                      setShowEditClubModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#74B72E]" />
                    <span>Edit Info Club</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmDeleteName("");
                      setDeleteError(null);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Hapus Club</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick CTA - Admin Options */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            {isAdmin ? (
              <>
                <button
                  onClick={handleOpenScheduledModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Jadwalkan Game (In-Advance)</span>
                </button>
                <button
                  onClick={handleOpenCreateTourney}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-600 shrink-0" />
                  <span>Main Langsung (Instant)</span>
                </button>
              </>
            ) : (
              <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 min-w-[220px]">
                <div className="flex items-center gap-1.5 text-[#32580E] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#74B72E]" />
                  <span>Status: Member Resmi (Read-Only)</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  Anda dapat melihat detail grup, daftar anggota, jadwal & RSVP. Pembuatan turnamen dikelola oleh Admin Club.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Club Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-8 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Total Anggota</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {club.members.length} Pemain
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Member Aktif</div>
            <div className="text-lg sm:text-xl font-bold text-[#74B72E] mt-0.5">
              {club.members.filter((m) => m.status === "ACTIVE").length} Siap Tanding
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Undangan Tertunda</div>
            <div className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">
              {club.members.filter((m) => m.status === "PENDING_INVITE").length} Pending
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Total Pertandingan</div>
            <div className="text-lg sm:text-xl font-bold text-teal-600 mt-0.5">
              {club.tournaments.length} Tersimpan
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Member Management, Right is Tournaments History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Members Management (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#74B72E]" />
                <h2 className="text-lg font-bold text-slate-900">Anggota Club</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                {club.members.length} Terdaftar
              </span>
            </div>

            {/* Invite Form - Only visible to Admin */}
            {isAdmin ? (
              <form onSubmit={handleInviteMember} className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Undang Anggota via Email (Admin Only)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{inviteLoading ? "..." : "Undang"}</span>
                  </button>
                </div>

                {inviteSuccessNotice && (
                  <div className="p-3 rounded-xl bg-[#74B72E]/10 border border-[#74B72E]/25 text-xs text-[#32580E] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#74B72E]" />
                    <span>{inviteSuccessNotice}</span>
                  </div>
                )}

                {inviteError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                    {inviteError}
                  </div>
                )}
              </form>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#74B72E] shrink-0" />
                <span>
                  Anda melihat daftar sesama member club. Penambahan member dikelola oleh Admin Club.
                </span>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {club.members.map((m) => {
                const isActive = m.status === "ACTIVE";
                const isOwner = club.ownerId === m.userId;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/60 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive
                            ? "bg-[#74B72E]/15 text-[#32580E] border border-[#74B72E]/30"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {(m.user?.name || m.invitedEmail).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {m.user?.name || m.invitedEmail.split("@")[0]}
                          </span>
                          {isOwner && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold shrink-0">
                              Owner
                            </span>
                          )}
                          {m.role === "ADMIN" && !isOwner && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[120px] sm:max-w-[180px]">
                          {m.invitedEmail}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2 shrink-0">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#32580E] whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#74B72E]" />
                          Aktif ({m.user?.gender || "M"})
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                            <Clock className="w-3 h-3" /> Terkirim
                          </span>
                        </div>
                      )}

                      {isAdmin && m.userId !== currentUser?.id && (
                        <button
                          onClick={() => {
                            setRoleModalMember(m);
                            const isCurrentOwner = club.ownerId === m.userId;
                            setSelectedNewRole(isCurrentOwner ? "OWNER" : m.role);
                            setRoleError(null);
                          }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#74B72E] hover:text-[#32580E] text-slate-600 font-bold transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                        >
                          Ubah Role
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Scheduled Games & Tournament History Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === "scheduled"
                  ? "bg-[#74B72E] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Jadwal & RSVP</span>
              <span
                className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black shrink-0 ${
                  activeTab === "scheduled"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {scheduledGames.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tournaments")}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === "tournaments"
                  ? "bg-[#74B72E] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Riwayat Skor</span>
              <span
                className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black shrink-0 ${
                  activeTab === "tournaments"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {club.tournaments.length}
              </span>
            </button>
          </div>

          {/* TAB 1: SCHEDULED GAMES & RSVP MANAGEMENT */}
          {activeTab === "scheduled" && (
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#74B72E]" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Jadwal Pertandingan In-Advance
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Semua member otomatis menerima RSVP. Lineup bisa di-adjust di hari H.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleOpenScheduledModal}
                    className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Jadwalkan Game Baru</span>
                  </button>
                )}
              </div>

              {loadingScheduled ? (
                <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#74B72E]" />
                  <span>Memuat jadwal game...</span>
                </div>
              ) : scheduledGames.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#74B72E]/10 border border-[#74B72E]/25 mx-auto flex items-center justify-center text-[#74B72E]">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Belum Ada Jadwal Pertandingan In-Advance
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Admin dapat membuat jadwal game di depan agar seluruh anggota club dapat menerima undangan, konfirmasi RSVP kehadiran, dan admin bisa menyesuaikan pemain di hari pertandingan!
                  </p>
                  {isAdmin && (
                    <button
                      onClick={handleOpenScheduledModal}
                      className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Buat Jadwal Game Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {scheduledGames.map((game) => {
                    const sportDef =
                      SPORTS_REGISTRY[game.sportId as SportId] || SPORTS_REGISTRY.padel;
                    const gameDate = new Date(game.scheduledAt);
                    const isToday =
                      gameDate.toDateString() === new Date().toDateString();

                    const rsvps = game.rsvps || [];
                    const acceptedCount = rsvps.filter(
                      (r: any) => r.rsvpStatus === "ACCEPTED"
                    ).length;
                    const declinedCount = rsvps.filter(
                      (r: any) => r.rsvpStatus === "DECLINED"
                    ).length;
                    const pendingCount = rsvps.filter(
                      (r: any) => r.rsvpStatus === "PENDING"
                    ).length;

                    // Lineup logic: dayOfStatus overrides rsvpStatus
                    const playingMembers = rsvps.filter((r: any) => {
                      if (r.dayOfStatus === "PLAYING") return true;
                      if (r.dayOfStatus === "SITTING_OUT") return false;
                      return r.rsvpStatus === "ACCEPTED";
                    });
                    const effectivePlayingCount = playingMembers.length;

                    const myRsvp = rsvps.find(
                      (r: any) =>
                        r.userId === currentUser?.id ||
                        r.memberEmail === currentUser?.email
                    );

                    return (
                      <div
                        key={game.id}
                        className={`rounded-2xl bg-white border transition-all overflow-hidden p-5 space-y-4 shadow-xs ${
                          isToday
                            ? "border-amber-400 ring-2 ring-amber-400/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Status Ribbon if Today */}
                        {isToday && (
                          <div className="-mx-5 -mt-5 mb-4 px-4 py-1.5 bg-amber-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-between">
                            <span>⚡ Pertandingan Hari Ini!</span>
                            <span>Lineup Dapat Disesuaikan Langsung</span>
                          </div>
                        )}

                        {/* Top Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25">
                                {sportDef.name} • {game.format}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  game.status === "OPEN"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : game.status === "LOCKED"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {game.status === "OPEN"
                                  ? "RSVP Terbuka"
                                  : game.status === "LOCKED"
                                  ? "RSVP Dikunci"
                                  : game.status}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900">
                              {game.title}
                            </h3>
                          </div>

                          {/* Quick RSVP Button for logged-in user if they are a member */}
                          {myRsvp && game.status === "OPEN" && (
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                              <span className="text-[11px] text-slate-500 px-1">
                                RSVP Anda:
                              </span>
                              <button
                                disabled={actionLoadingId === game.id}
                                onClick={() => handleMemberRsvp(game.id, "ACCEPTED")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  myRsvp.rsvpStatus === "ACCEPTED"
                                    ? "bg-[#74B72E] text-white font-black"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                disabled={actionLoadingId === game.id}
                                onClick={() => handleMemberRsvp(game.id, "DECLINED")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  myRsvp.rsvpStatus === "DECLINED"
                                    ? "bg-rose-600 text-white font-black"
                                    : "bg-white hover:bg-rose-50 text-slate-700 border border-slate-200"
                                }`}
                              >
                                Batal
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#74B72E] shrink-0" />
                            <span className="font-semibold text-slate-800">
                              {gameDate.toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}{" "}
                              pukul{" "}
                              {gameDate.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {game.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{game.location}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-slate-500">
                            <Trophy className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {game.totalCourts} Lapangan • Target {game.targetPoints} Poin • {game.totalRounds || 4} Ronde
                            </span>
                          </div>

                          {game.rsvpDeadline && (
                            <div className="flex items-center gap-2 text-amber-700">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Batas RSVP:{" "}
                                {new Date(game.rsvpDeadline).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {game.notes && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{game.notes}</span>
                          </div>
                        )}

                        {/* RSVP Summary Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-semibold mr-1">
                            Status Respon:
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#74B72E]/10 text-[#32580E] border border-[#74B72E]/25 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> {acceptedCount} Hadir
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5" /> {declinedCount} Absen
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {pendingCount} Pending
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 ml-auto">
                            ⚡ Siap Main: {effectivePlayingCount} Pemain
                          </span>
                        </div>

                        {/* Member RSVP List & Day-of Lineup Adjustments */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold uppercase tracking-wider text-slate-700">
                              Daftar Member & Penyesuaian Lineup Hari H:
                            </span>
                            {isAdmin && (
                              <span className="text-[11px] text-amber-700 italic">
                                *Admin dapat override pemain yang mendadak absen/hadir
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {rsvps.map((r: any) => {
                              const isPlayingNow =
                                r.dayOfStatus === "PLAYING" ||
                                (!r.dayOfStatus && r.rsvpStatus === "ACCEPTED");

                              const isOverridden = r.dayOfStatus !== null;

                              return (
                                <div
                                  key={r.id}
                                  className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
                                    isPlayingNow
                                      ? "bg-white border-[#74B72E]/40 shadow-xs"
                                      : "bg-slate-50 border-slate-200/80 opacity-75"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                                        isPlayingNow
                                          ? "bg-[#74B72E]/15 text-[#32580E]"
                                          : "bg-slate-200 text-slate-600"
                                      }`}
                                    >
                                      {(r.user?.name || r.memberName || "P")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900">
                                          {r.user?.name || r.memberName}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                          ({r.user?.gender || r.memberGender || "M"})
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        {r.memberEmail}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Member's Original RSVP */}
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        r.rsvpStatus === "ACCEPTED"
                                          ? "bg-[#74B72E]/15 text-[#32580E]"
                                          : r.rsvpStatus === "DECLINED"
                                          ? "bg-rose-50 text-rose-700"
                                          : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      RSVP:{" "}
                                      {r.rsvpStatus === "ACCEPTED"
                                        ? "Hadir"
                                        : r.rsvpStatus === "DECLINED"
                                        ? "Absen"
                                        : "Pending"}
                                    </span>

                                    {/* Day-of Override Badge if set */}
                                    {isOverridden && (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                          r.dayOfStatus === "PLAYING"
                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                            : "bg-orange-50 text-orange-700 border border-orange-200"
                                        }`}
                                      >
                                        Hari H:{" "}
                                        {r.dayOfStatus === "PLAYING" ? "Dipaksa Main" : "Absen"}
                                      </span>
                                    )}

                                    {/* Admin Day-of Lineup Override Controls */}
                                    {isAdmin && (
                                      <div className="flex items-center gap-1">
                                        {isPlayingNow ? (
                                          <button
                                            disabled={actionLoadingId === r.id}
                                            onClick={() =>
                                              handleAdjustDayOfStatus(
                                                game.id,
                                                r.id,
                                                "SITTING_OUT"
                                              )
                                            }
                                            className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-rose-200"
                                            title="Tandai tidak main di hari pertandingan jika tiba-tiba batal"
                                          >
                                            <UserX className="w-3 h-3" />
                                            <span>Batal Main</span>
                                          </button>
                                        ) : (
                                          <button
                                            disabled={actionLoadingId === r.id}
                                            onClick={() =>
                                              handleAdjustDayOfStatus(
                                                game.id,
                                                r.id,
                                                "PLAYING"
                                              )
                                            }
                                            className="px-2 py-1 rounded bg-[#74B72E]/10 hover:bg-[#74B72E]/20 text-[#32580E] font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-[#74B72E]/30"
                                            title="Masukkan ke lineup main hari pertandingan"
                                          >
                                            <UserCheck className="w-3 h-3 text-[#74B72E]" />
                                            <span>Ikut Main</span>
                                          </button>
                                        )}

                                        {isOverridden && (
                                          <button
                                            disabled={actionLoadingId === r.id}
                                            onClick={() =>
                                              handleAdjustDayOfStatus(
                                                game.id,
                                                r.id,
                                                null
                                              )
                                            }
                                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                            title="Reset ke status RSVP asli"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Kickoff Tournament Button (Admin Only) */}
                        {isAdmin && (
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">
                              <span>Pemain siap tanding: </span>
                              <strong
                                className={
                                  effectivePlayingCount >= 4
                                    ? "text-[#32580E] font-bold text-sm"
                                    : "text-amber-700 font-bold text-sm"
                                }
                              >
                                {effectivePlayingCount} Pemain
                              </strong>{" "}
                              <span>(Minimal 4 pemain)</span>
                            </div>

                            <button
                              disabled={
                                effectivePlayingCount < 4 || startingGameId === game.id
                              }
                              onClick={() => handleStartScheduledGame(game.id)}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
                            >
                              {startingGameId === game.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Memulai Pertandingan...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 fill-white" />
                                  <span>
                                    Mulai Turnamen Sekarang ({effectivePlayingCount} Pemain)
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOURNAMENT HISTORY & SCOREBOARDS */}
          {activeTab === "tournaments" && (
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Riwayat Pertandingan & Scoreboard
                  </h2>
                </div>
                {isAdmin && (
                  <button
                    onClick={handleOpenCreateTourney}
                    className="text-xs font-semibold text-[#32580E] hover:text-[#74B72E] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Game Baru
                  </button>
                )}
              </div>

              {club.tournaments.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#74B72E]/10 border border-[#74B72E]/25 mx-auto flex items-center justify-center text-[#74B72E]">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Belum Ada Turnamen yang Dimainkan
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Mulai pertandingan Americano atau Mexicano pertama untuk club ini. Skor dan podium juara akan tersimpan otomatis di sini!
                  </p>
                  {isAdmin && (
                    <button
                      onClick={handleOpenCreateTourney}
                      className="px-4 py-2 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Mulai Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {club.tournaments.map((t) => {
                    const winner = t.players && t.players[0];
                    const sportDef =
                      SPORTS_REGISTRY[t.sportId as SportId] || SPORTS_REGISTRY.padel;
                    return (
                      <div
                        key={t.id}
                        onClick={() => router.push(`/tournament/${t.id}`)}
                        className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition-all cursor-pointer group space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-[#74B72E] transition-colors">
                                {t.title}
                              </span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                {sportDef.name} • {t.format}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(t.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              • Target {t.targetPoints} Poin
                            </div>
                          </div>

                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              t.status === "COMPLETED"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-emerald-50 text-emerald-700 animate-pulse border border-emerald-200"
                            }`}
                          >
                            {t.status === "COMPLETED" ? "Selesai" : "Sedang Berlangsung"}
                          </span>
                        </div>

                        {/* Winner / Standings Preview */}
                        {winner && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="text-slate-600">
                                Peringkat 1:{" "}
                                <strong className="text-slate-900 font-bold">{winner.name}</strong>
                              </span>
                            </div>
                            <div className="text-slate-500 font-mono">
                              <strong className="text-[#74B72E]">{winner.pointsScored}</strong> Poin
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>{t.players?.length || 0} Pemain Terlibat</span>
                          <div className="flex items-center gap-1 text-[#32580E] group-hover:translate-x-1 transition-transform font-medium">
                            <span>Buka Scoreboard</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Club Tournament */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#74B72E]/10 text-[#32580E] text-xs font-semibold mb-1 border border-[#74B72E]/25">
                  <Trophy className="w-3.5 h-3.5 text-[#74B72E]" /> Setup Game Club
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Buat Turnamen untuk {club.name}
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {tourneyError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {tourneyError}
                </div>
              )}

              {/* Tournament Title */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Judul Turnamen
                </label>
                <input
                  type="text"
                  value={tournamentTitle}
                  onChange={(e) => setTournamentTitle(e.target.value)}
                  placeholder="Misal: Americano Night Friday"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              {/* Sport Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                  Pilih Cabang Olahraga
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.values(SPORTS_REGISTRY).map((s) => {
                    const isSelected = sportId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSportId(s.id);
                          setFormat(s.defaultFormat);
                          setTargetPoints(s.scoringPresets[0].defaultTargetPoints);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#74B72E]/10 border-[#74B72E] ring-2 ring-[#74B72E]/30"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-sm font-bold text-slate-900 mb-1">{s.name}</div>
                        <div className="text-[10px] text-slate-500">{s.tagline}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format & Scoring */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                  Format Turnamen
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  {activeSport.supportedFormats.map((f) => {
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
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">{info.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {info.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{info.tag}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-700 font-semibold">Target Poin Per Match:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[16, 21, 24, 32, 40].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setTargetPoints(pt)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            targetPoints === pt
                              ? "bg-[#74B72E] text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {pt} Poin
                        </button>
                      ))}
                    </div>
                  </div>

                  {format === "americano" && (
                    <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-700 gap-2">
                      <span className="font-semibold">Total Ronde Pertandingan:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[3, 4, 5, 7, 8].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setTotalRounds(r)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                              totalRounds === r
                                ? "bg-[#74B72E] text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {r} Ronde
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pilihan Jumlah Lapangan (Courts) */}
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-2.5 text-xs text-slate-700 gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">Jumlah Lapangan Club:</span>
                      <span className="text-[10px] text-slate-500">
                        Berapa court yang dipakai bertanding
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.from(
                        {
                          length: Math.max(
                            1,
                            Math.floor(selectedMemberIds.length / 4) || 1
                          ),
                        },
                        (_, i) => i + 1
                      ).map((c) => {
                        const maxC = Math.max(
                          1,
                          Math.floor(selectedMemberIds.length / 4) || 1
                        );
                        const curC = Math.min(totalCourts || 1, maxC);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setTotalCourts(c)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              curC === c
                                ? "bg-[#74B72E] text-white shadow-xs"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {c} Lapangan
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Selection */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Pilih Member Club yang Ikut Bertanding ({selectedMemberIds.length} Dipilih)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectFirstNMembers(4)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      Pilih 4
                    </button>
                    <button
                      type="button"
                      onClick={() => selectFirstNMembers(8)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      Pilih 8
                    </button>
                    <button
                      type="button"
                      onClick={selectAllActiveMembers}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {club.members.map((m) => {
                    const isSelected = selectedMemberIds.includes(m.id);
                    const isActive = m.status === "ACTIVE";
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMemberSelection(m.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#74B72E]/10 border-[#74B72E]/50"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[#74B72E] rounded"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-900">
                              {m.user?.name || m.invitedEmail.split("@")[0]}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.invitedEmail}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isActive ? (
                            <span className="text-[11px] text-[#32580E] font-medium">
                              Siap ({m.user?.gender || "M"})
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Undangan Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                Pemain Dipilih:{" "}
                <strong className="text-slate-900 font-bold">{selectedMemberIds.length}</strong> (Minimal 4)
              </div>
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={tourneyLoading || selectedMemberIds.length < 4}
                  onClick={handleCreateTournament}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white shrink-0" />
                  <span>{tourneyLoading ? "Membuat..." : "Mulai Turnamen"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Scheduled Game (In-Advance) */}
      {showScheduledModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#74B72E]/10 text-[#32580E] text-xs font-semibold mb-1 border border-[#74B72E]/25">
                  <Calendar className="w-3.5 h-3.5 text-[#74B72E]" /> Jadwalkan Game In-Advance
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Jadwalkan Pertandingan Club
                </h2>
              </div>
              <button
                onClick={() => setShowScheduledModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateScheduledGame}
              className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1"
            >
              {schedError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {schedError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Judul Jadwal Pertandingan
                </label>
                <input
                  type="text"
                  required
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  placeholder="Misal: Americano Night Friday"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              {/* Sport & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                    Cabang Olahraga
                  </label>
                  <select
                    value={schedSportId}
                    onChange={(e) => {
                      const newSport = e.target.value as SportId;
                      setSchedSportId(newSport);
                      setSchedFormat(SPORTS_REGISTRY[newSport].defaultFormat);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                  >
                    {Object.values(SPORTS_REGISTRY).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                    Format Permainan
                  </label>
                  <select
                    value={schedFormat}
                    onChange={(e) => setSchedFormat(e.target.value as TournamentFormat)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                  >
                    {SPORTS_REGISTRY[schedSportId].supportedFormats.map((f) => (
                      <option key={f} value={f}>
                        {FORMAT_DESCRIPTIONS[f].name} ({FORMAT_DESCRIPTIONS[f].badge})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time + RSVP Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                    Waktu Main (Tanggal & Jam)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={schedDateTime}
                    onChange={(e) => setSchedDateTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                    Batas Akhir RSVP (Deadline)
                  </label>
                  <input
                    type="datetime-local"
                    value={schedDeadline}
                    onChange={(e) => setSchedDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Lokasi / Venue Lapangan
                </label>
                <input
                  type="text"
                  value={schedLocation}
                  onChange={(e) => setSchedLocation(e.target.value)}
                  placeholder="Misal: Cilandak Padel Club - Lapangan 1 & 2"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              {/* Courts, Target Points, Rounds */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                    Jumlah Lapangan
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={schedCourts}
                    onChange={(e) => setSchedCourts(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 text-center focus:outline-none focus:border-[#74B72E]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                    Target Poin
                  </label>
                  <input
                    type="number"
                    min={11}
                    max={50}
                    value={schedTargetPoints}
                    onChange={(e) => setSchedTargetPoints(parseInt(e.target.value) || 32)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 text-center focus:outline-none focus:border-[#74B72E]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                    Total Ronde
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={schedRounds}
                    onChange={(e) => setSchedRounds(parseInt(e.target.value) || 4)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 text-center focus:outline-none focus:border-[#74B72E]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Catatan / Instruksi untuk Member
                </label>
                <textarea
                  rows={2}
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  placeholder="Misal: Harap bawa handuk dan raket sendiri. Bola disediakan."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              {/* Automated RSVP info box */}
              <div className="p-3.5 rounded-2xl bg-[#74B72E]/10 border border-[#74B72E]/25 text-xs text-[#32580E] flex items-start gap-2.5">
                <Bell className="w-4 h-4 shrink-0 text-[#74B72E] mt-0.5" />
                <div>
                  <strong>Undangan Otomatis:</strong> Saat jadwal ini dibuat, seluruh anggota club ({club.members.filter((m) => m.status === "ACTIVE").length} member aktif) akan langsung mendapatkan notifikasi RSVP (Hadir / Tidak Hadir) di dashboard mereka masing-masing.
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduledModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={schedLoading}
                  className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {schedLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Menyimpan Jadwal...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Jadwalkan Game & Kirim RSVP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INFO CLUB */}
      {showEditClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#74B72E]" />
                <h3 className="text-lg font-bold text-slate-900">Edit Info Club</h3>
              </div>
              <button
                onClick={() => setShowEditClubModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editClubError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {editClubError}
              </div>
            )}

            <form onSubmit={handleUpdateClub} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Nama Club
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Jakarta Padel Masters"
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Deskripsi Club
                </label>
                <textarea
                  placeholder="Deskripsi komunitas, jadwal rutin, lokasi biasa bermain..."
                  rows={3}
                  value={editClubDesc}
                  onChange={(e) => setEditClubDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditClubModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editClubLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {editClubLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HAPUS CLUB */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-red-200 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900">Hapus Club</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Peringatan: Tindakan ini permanen!</span>
              </div>
              <p className="text-[11px] text-red-600 leading-relaxed">
                Menghapus club <strong>{club.name}</strong> akan menghapus seluruh data anggota, jadwal pertandingan in-advance, RSVP, dan riwayat turnamen di dalamnya secara permanen.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteClub} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Ketik nama club <strong className="text-slate-900">"{club.name}"</strong> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  required
                  placeholder={club.name}
                  value={confirmDeleteName}
                  onChange={(e) => setConfirmDeleteName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || confirmDeleteName.trim() !== club.name.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {deleteLoading ? "Menghapus..." : "Hapus Club Permanen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UBAH ROLE MEMBER */}
      {roleModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#74B72E]" />
                <h3 className="text-lg font-bold text-slate-900">Ubah Role Anggota</h3>
              </div>
              <button
                onClick={() => setRoleModalMember(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Info Card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#74B72E]/15 border border-[#74B72E]/30 flex items-center justify-center font-bold text-[#32580E] text-sm">
                {(roleModalMember.user?.name || roleModalMember.invitedEmail).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {roleModalMember.user?.name || roleModalMember.invitedEmail.split("@")[0]}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {roleModalMember.invitedEmail}
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                Saat Ini: {club.ownerId === roleModalMember.userId ? "Owner" : roleModalMember.role}
              </span>
            </div>

            {roleError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {roleError}
              </div>
            )}

            <form onSubmit={handleSaveRoleChange} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Pilih Tingkat Akses / Role Baru:
                </label>
                <div className="space-y-2">
                  {/* Option 1: Member Biasa */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedNewRole === "MEMBER"
                        ? "bg-[#74B72E]/10 border-[#74B72E] ring-1 ring-[#74B72E]"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleOption"
                      value="MEMBER"
                      checked={selectedNewRole === "MEMBER"}
                      onChange={() => setSelectedNewRole("MEMBER")}
                      className="mt-1 text-[#74B72E] focus:ring-[#74B72E]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Member Biasa</div>
                      <div className="text-[11px] text-slate-500">
                        Hanya melihat detail grup, jadwal, dan melakukan konfirmasi RSVP tanding.
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Admin Club */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedNewRole === "ADMIN"
                        ? "bg-[#74B72E]/10 border-[#74B72E] ring-1 ring-[#74B72E]"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleOption"
                      value="ADMIN"
                      checked={selectedNewRole === "ADMIN"}
                      onChange={() => setSelectedNewRole("ADMIN")}
                      className="mt-1 text-[#74B72E] focus:ring-[#74B72E]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Admin Club</div>
                      <div className="text-[11px] text-slate-500">
                        Dapat membuat jadwal game in-advance, mengundang anggota, dan memulai turnamen.
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Transfer Ownership (Only if current caller is Owner) */}
                  {isOwner && (
                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedNewRole === "OWNER"
                          ? "bg-purple-50 border-purple-400 ring-1 ring-purple-400"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleOption"
                        value="OWNER"
                        checked={selectedNewRole === "OWNER"}
                        onChange={() => setSelectedNewRole("OWNER")}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <span>Transfer Ownership (Jadikan Owner)</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">Owner Utama</span>
                        </div>
                        <div className="text-[11px] text-purple-700/80">
                          Menyerahkan kepemilikan club kepada member ini. Status Anda akan menjadi Admin Club.
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {selectedNewRole === "OWNER" && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  ⚠️ <strong>Konfirmasi Transfer:</strong> Anda akan mengalihkan hak Owner club ke <strong>{roleModalMember.user?.name || roleModalMember.invitedEmail}</strong>.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={roleLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {roleLoading ? "Menyimpan..." : "Simpan Role Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
