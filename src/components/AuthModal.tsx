"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  gender: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: UserItem[];
  onLoginSuccess: (user: any) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  availableUsers,
  onLoginSuccess,
}: AuthModalProps) {
  const [tab, setTab] = useState<"demo" | "login" | "register">("demo");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("password123");
  const [gender, setGender] = useState("MALE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredNotice, setRegisteredNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleDemoLogin(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLoginSuccess(data.user);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLoginSuccess(data.user);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, gender }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.activatedClubInvites && data.activatedClubInvites.length > 0) {
        setRegisteredNotice(
          `Akun berhasil dibuat! Undangan dari club "${data.activatedClubInvites.join(", ")}" otomatis aktif.`
        );
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 1800);
      } else {
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#74B72E]/10 text-[#32580E] text-xs font-semibold mb-2 border border-[#74B72E]/25">
            <ShieldCheck className="w-3.5 h-3.5 text-[#74B72E]" /> YurScore Authentication
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Masuk ke YurScore</h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola club, undang anggota, atau buat turnamen tersimpan.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
          <button
            onClick={() => setTab("demo")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === "demo"
                ? "bg-[#74B72E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Demo Cepat (1-Klik)
          </button>
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === "login"
                ? "bg-[#74B72E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Login Email
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === "register"
                ? "bg-[#74B72E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {registeredNotice && (
          <div className="mb-4 p-3 rounded-xl bg-[#74B72E]/10 border border-[#74B72E]/25 text-xs text-[#32580E] flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#74B72E] shrink-0" />
            <span>{registeredNotice}</span>
          </div>
        )}

        {/* Tab 1: Instant Demo Switch */}
        {tab === "demo" && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs text-slate-500 mb-2">
              Pilih salah satu akun pengguna di bawah untuk mencoba langsung fitur:
            </p>
            {availableUsers.map((u) => (
              <button
                key={u.id}
                disabled={loading}
                onClick={() => handleDemoLogin(u.id)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-[#74B72E]/5 border border-slate-200 hover:border-[#74B72E]/50 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#74B72E]/15 border border-[#74B72E]/30 flex items-center justify-center font-bold text-[#32580E] text-xs">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-[#32580E] transition-colors">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-[#32580E] font-semibold">
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Login Email */}
        {tab === "login" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="reza@yurscore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E] focus:ring-1 focus:ring-[#74B72E]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E] focus:ring-1 focus:ring-[#74B72E]/30 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                (Untuk akun demo default password: password123)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] font-bold text-white text-sm transition-all shadow-md shadow-[#74B72E]/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Memproses..." : "Masuk ke Akun"}
            </button>
          </form>
        )}

        {/* Tab 3: Register */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E] focus:ring-1 focus:ring-[#74B72E]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E] focus:ring-1 focus:ring-[#74B72E]/30 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                * Jika Anda menerima undangan club ke email ini, status membership akan otomatis aktif!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                >
                  <option value="MALE">Laki-laki (Male)</option>
                  <option value="FEMALE">Perempuan (Female)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#74B72E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#74B72E] hover:bg-[#639E25] font-bold text-white text-sm transition-all shadow-md shadow-[#74B72E]/25 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? "Mendaftar..." : "Daftar & Masuk"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
