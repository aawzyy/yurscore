import { Suspense } from "react";
import { TournamentClient } from "./tournament-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              Memuat Arena Turnamen...
            </div>
          </div>
        </div>
      }
    >
      <TournamentClient tournamentId={id} />
    </Suspense>
  );
}
