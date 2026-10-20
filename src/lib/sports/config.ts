export type SportId = "padel" | "tennis" | "badminton" | "pickleball" | "table_tennis";

export type TournamentFormat = "americano" | "mexicano" | "round_robin" | "casual";

export type ScoringMode = "split_points" | "tennis_sets" | "rally_21" | "pickleball_11";

export interface ScoringPreset {
  id: ScoringMode;
  name: string;
  description: string;
  defaultTargetPoints: number;
  allowedTargetPoints: number[];
  allowCustomPoints?: boolean;
}

export interface SportDefinition {
  id: SportId;
  name: string;
  tagline: string;
  icon: string; // Lucide icon identifier
  color: string;
  accentBg: string;
  description: string;
  defaultFormat: TournamentFormat;
  supportedFormats: TournamentFormat[];
  scoringPresets: ScoringPreset[];
  minPlayers: number;
  recommendedPlayers: number;
  playersPerTeam: 1 | 2;
}

export const SPORTS_REGISTRY: Record<SportId, SportDefinition> = {
  padel: {
    id: "padel",
    name: "Padel",
    tagline: "High-energy wall & racket doubles game",
    icon: "ShieldAlert", // Padel racket vibe
    color: "#10b981", // Emerald
    accentBg: "from-emerald-500/20 to-teal-500/10",
    description: "The world's fastest growing racket sport. Played predominantly as doubles in an enclosed glass court.",
    defaultFormat: "americano",
    supportedFormats: ["americano", "mexicano", "round_robin", "casual"],
    scoringPresets: [
      {
        id: "split_points",
        name: "Americano 32 Points",
        description: "Standard Americano split points where both teams' scores sum up to 32 (e.g. 18-14, 20-12).",
        defaultTargetPoints: 32,
        allowedTargetPoints: [16, 21, 24, 32, 40],
        allowCustomPoints: true,
      },
      {
        id: "split_points",
        name: "Americano 24 Points (Fast)",
        description: "Quicker rounds split to 24 points.",
        defaultTargetPoints: 24,
        allowedTargetPoints: [16, 24, 32],
      },
      {
        id: "tennis_sets",
        name: "Standard Padel Match",
        description: "Sets of 6 games with Golden Point (Punto de Oro) on 40-40 deuce.",
        defaultTargetPoints: 6,
        allowedTargetPoints: [4, 6],
      },
    ],
    minPlayers: 4,
    recommendedPlayers: 8,
    playersPerTeam: 2,
  },
  pickleball: {
    id: "pickleball",
    name: "Pickleball",
    tagline: "Fast & fun dinking on court",
    icon: "Activity",
    color: "#f59e0b", // Amber
    accentBg: "from-amber-500/20 to-orange-500/10",
    description: "Combines elements of tennis, badminton and ping-pong. Great in doubles or singles.",
    defaultFormat: "americano",
    supportedFormats: ["americano", "mexicano", "round_robin", "casual"],
    scoringPresets: [
      {
        id: "pickleball_11",
        name: "First to 11 (Win by 2)",
        description: "Traditional pickleball rally scoring to 11 points.",
        defaultTargetPoints: 11,
        allowedTargetPoints: [11, 15, 21],
      },
      {
        id: "split_points",
        name: "Pickleball Americano 21",
        description: "Points split to 21 total.",
        defaultTargetPoints: 21,
        allowedTargetPoints: [15, 21, 24],
      },
    ],
    minPlayers: 4,
    recommendedPlayers: 8,
    playersPerTeam: 2,
  },
  badminton: {
    id: "badminton",
    name: "Badminton",
    tagline: "Lightning fast smashes & agility",
    icon: "Wind",
    color: "#3b82f6", // Blue
    accentBg: "from-blue-500/20 to-indigo-500/10",
    description: "Classic shuttlecock sport with intense rallies and quick reflexes.",
    defaultFormat: "americano",
    supportedFormats: ["americano", "round_robin", "casual"],
    scoringPresets: [
      {
        id: "rally_21",
        name: "BWF Rally 21 Points",
        description: "Standard BWF rally point scoring to 21, win by 2 (cap at 30).",
        defaultTargetPoints: 21,
        allowedTargetPoints: [15, 21, 30],
      },
      {
        id: "split_points",
        name: "Badminton Americano 24",
        description: "Rotate partners with 24 total points per match.",
        defaultTargetPoints: 24,
        allowedTargetPoints: [21, 24, 30],
      },
    ],
    minPlayers: 4,
    recommendedPlayers: 8,
    playersPerTeam: 2,
  },
  tennis: {
    id: "tennis",
    name: "Tennis",
    tagline: "Grand slam precision & endurance",
    icon: "CircleDot",
    color: "#84cc16", // Lime
    accentBg: "from-lime-500/20 to-emerald-500/10",
    description: "Traditional court tennis with game, set, match scoring.",
    defaultFormat: "casual",
    supportedFormats: ["casual", "americano", "round_robin"],
    scoringPresets: [
      {
        id: "tennis_sets",
        name: "Standard Match (1 or 3 Sets)",
        description: "15, 30, 40, Deuce/Advantage, 6 games per set.",
        defaultTargetPoints: 6,
        allowedTargetPoints: [4, 6],
      },
      {
        id: "split_points",
        name: "Tiebreak Americano (32 Pts)",
        description: "Super tiebreak rotation split to 32 points.",
        defaultTargetPoints: 32,
        allowedTargetPoints: [24, 32],
      },
    ],
    minPlayers: 4,
    recommendedPlayers: 8,
    playersPerTeam: 2,
  },
  table_tennis: {
    id: "table_tennis",
    name: "Table Tennis",
    tagline: "High-speed spin & table reflexes",
    icon: "Activity",
    color: "#ef4444",
    accentBg: "from-red-500/20 to-pink-500/10",
    description: "Fast ping-pong singles or doubles rallies with 11-point games.",
    defaultFormat: "americano",
    supportedFormats: ["americano", "mexicano", "round_robin", "casual"],
    scoringPresets: [
      {
        id: "pickleball_11",
        name: "ITTF 11 Points Game",
        description: "Standard 11 points game, win by 2.",
        defaultTargetPoints: 11,
        allowedTargetPoints: [11, 21],
      },
      {
        id: "split_points",
        name: "Ping Pong Americano 21",
        description: "21 total split points rotation.",
        defaultTargetPoints: 21,
        allowedTargetPoints: [15, 21, 32],
      },
    ],
    minPlayers: 4,
    recommendedPlayers: 8,
    playersPerTeam: 2,
  },
};

export const FORMAT_DESCRIPTIONS: Record<
  TournamentFormat,
  { name: string; tag: string; badge: string; description: string }
> = {
  americano: {
    name: "Americano",
    tag: "Rotasi Pasangan Seimbang",
    badge: "Paling Populer",
    description:
      "Setiap pemain akan berpasangan dengan pemain yang berbeda di setiap ronde. Semua poin yang didapat dicatat secara individual di papan klasemen.",
  },
  mexicano: {
    name: "Mexicano",
    tag: "Dynamic Swiss Matchmaking",
    badge: "Kompetitif & Seru",
    description:
      "Ronde berikutnya ditentukan secara dinamis berdasarkan posisi klasemen sementara. Pemain peringkat atas akan bermain di lapangan utama melawan sesama papan atas sehingga pertandingan selalu berimbang!",
  },
  round_robin: {
    name: "Round Robin",
    tag: "Semua Tim Bertemu",
    badge: "Format Tetap",
    description:
      "Pasangan tim tetap (fixed pair) bermain melawan semua tim lawan satu per satu dalam liga mini.",
  },
  casual: {
    name: "Free Match / Casual",
    tag: "1 Pertandingan Bebas",
    badge: "Santai",
    description:
      "Pertandingan langsung tanpa sistem turnamen ronde. Cocok untuk sparring 1 set atau pertandingan eksibisi cepat.",
  },
};
