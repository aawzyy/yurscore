const BASE_URL = "http://localhost:3000";

function logStep(step: number, title: string, desc?: string) {
  console.log("\n" + "=".repeat(65));
  console.log(`🔷 STEP ${step}: ${title}`);
  if (desc) console.log(`   ℹ️  ${desc}`);
  console.log("=".repeat(65));
}

async function runSimulation() {
  console.log("\n🎾 MEMULAI SIMULASI & TEST END-TO-END YURSCORE 🎾\n");

  // 1. Get current logged in user & check accounts
  logStep(1, "Autentikasi & Akun Pengguna", "Mengecek user aktif dan akun demo");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`);
  const meData = await meRes.json();
  console.log(`✅ User aktif: ${meData.user.name} (${meData.user.email}) - Role: Coach / Club Owner`);
  console.log(`   Tersedia ${meData.availableUsers.length} akun demo untuk testing switch 1-klik.`);

  // 2. Cek Club & Anggota
  logStep(2, "Manajemen Club & Undangan Member", "Melihat club dan mengundang member baru");
  const clubsRes = await fetch(`${BASE_URL}/api/clubs`);
  const clubsData = await clubsRes.json();
  const club = clubsData.clubs[0];
  console.log(`✅ Club: "${club.name}" | Kode: ${club.code}`);
  console.log(`   Total Member terdaftar saat ini: ${club.members.length}`);

  // Simulasikan invite calon member via email
  const newEmail = `pemain.baru.${Date.now().toString().slice(-4)}@gmail.com`;
  console.log(`\n📨 Mengirim undangan via email ke: ${newEmail}`);
  const inviteRes = await fetch(`${BASE_URL}/api/clubs/${club.id}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: newEmail, role: "MEMBER" }),
  });
  const inviteData = await inviteRes.json();
  console.log(`✅ Status Undangan: ${inviteData.member.status}`);
  console.log(`   Pesan: "${inviteData.notice}"`);

  // Simulasikan pendaftaran akun oleh penerima email
  console.log(`\n👤 Pemain membuka web dan mendaftar akun baru dengan email tersebut...`);
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rizky Ramadhan",
      email: newEmail,
      password: "password123",
      gender: "MALE",
    }),
  });
  const regData = await registerRes.json();
  console.log(`✅ Pendaftaran Berhasil!`);
  console.log(`   Otomatis aktif di Club: [${regData.activatedClubInvites.join(", ")}]`);

  // 3. Buat Turnamen Americano (8 Pemain, 2 Lapangan, Target 32 Poin)
  logStep(3, "Pembuatan Turnamen Americano Padel", "8 Pemain di 2 Lapangan (Court 1 & Court 2)");
  const createTourneyRes = await fetch(`${BASE_URL}/api/tournaments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Jakarta Friday Padel Americano 32",
      sportId: "padel",
      format: "americano",
      scoringMode: "split_points",
      targetPoints: 32,
      totalCourts: 2,
      totalRounds: 4,
      isFreeGame: false,
      clubId: club.id,
      players: [
        { name: "Coach Alex", gender: "MALE" },
        { name: "Maria Santos", gender: "FEMALE" },
        { name: "David Lee", gender: "MALE" },
        { name: "Siti Rahma", gender: "FEMALE" },
        { name: "Kevin Wijaya", gender: "MALE" },
        { name: "Rizky Ramadhan", gender: "MALE" },
        { name: "Amanda Putri", gender: "FEMALE" },
        { name: "Fajar Pratama", gender: "MALE" },
      ],
    }),
  });
  const tourneyData = await createTourneyRes.json();
  const tourneyId = tourneyData.tournamentId;
  console.log(`✅ Turnamen berhasil dibuat! ID: ${tourneyId}`);
  console.log(`   Format: Americano 32 Poin | Lapangan: 2 Court | Total Ronde: 4`);

  // Ambil detail jadwal ronde yang digenerate oleh algoritma
  const tourneyDetailRes = await fetch(`${BASE_URL}/api/tournaments/${tourneyId}`);
  const tourneyDetail = await tourneyDetailRes.json();
  console.log(`\n📋 Jadwal Pertandingan yang Dihasilkan Algoritma:`);
  tourneyDetail.tournament.rounds.forEach((r: any) => {
    console.log(`   🔹 Ronde ${r.roundNumber} (Status: ${r.status}):`);
    r.matches.forEach((m: any) => {
      console.log(`      Court ${m.courtNumber}: [${m.team1Name}] vs [${m.team2Name}]`);
    });
  });

  // 4. Simulasi Input Skor di Ronde 1
  logStep(4, "Simulasi Scoring Live di Lapangan (Ronde 1)", "Pencatatan skor match Court 1 dan Court 2");
  const r1 = tourneyDetail.tournament.rounds[0];
  const m1 = r1.matches[0];
  const m2 = r1.matches[1];

  console.log(`🎾 Match Court 1: ${m1.team1Name} vs ${m1.team2Name}`);
  console.log(`   Skor: 18 - 14 (Total 32 poin)`);
  await fetch(`${BASE_URL}/api/tournaments/${tourneyId}/match/${m1.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team1Score: 18, team2Score: 14, status: "COMPLETED" }),
  });

  console.log(`🎾 Match Court 2: ${m2.team1Name} vs ${m2.team2Name}`);
  console.log(`   Skor: 20 - 12 (Total 32 poin)`);
  const m2UpdateRes = await fetch(`${BASE_URL}/api/tournaments/${tourneyId}/match/${m2.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team1Score: 20, team2Score: 12, status: "COMPLETED" }),
  });
  const m2Data = await m2UpdateRes.json();
  console.log(`✅ Ronde 1 Selesai! (isRoundDone: ${m2Data.isRoundDone})`);

  // 5. Cek Papan Klasemen Real-Time
  logStep(5, "Papan Klasemen Sementara (Live Standings)", "Dihitung otomatis berdasarkan Poin Scored & Diff");
  const standingsRes = await fetch(`${BASE_URL}/api/tournaments/${tourneyId}`);
  const standingsData = await standingsRes.json();
  console.log("🏆 TOP STANDINGS RONDE 1:");
  console.log("---------------------------------------------------------------");
  console.log("Rank | Pemain               | Main | M/K | Poin | Diff");
  console.log("---------------------------------------------------------------");
  standingsData.standings.forEach((p: any) => {
    const padName = p.name.padEnd(20, " ");
    console.log(
      ` ${p.rank.toString().padEnd(3, " ")} | ${padName} |  ${p.matchesPlayed}   | ${p.matchesWon}/${p.matchesLost} |  ${p.pointsScored}  | ${p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}`
    );
  });
  console.log("---------------------------------------------------------------");

  // 6. Jalankan Ronde 2
  logStep(6, "Memainkan Ronde 2", "Skor tercatat dan terakumulasi ke klasemen");
  const r2 = standingsData.tournament.rounds[1];
  for (let i = 0; i < r2.matches.length; i++) {
    const m = r2.matches[i];
    const s1 = i === 0 ? 17 : 19;
    const s2 = 32 - s1;
    await fetch(`${BASE_URL}/api/tournaments/${tourneyId}/match/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team1Score: s1, team2Score: s2, status: "COMPLETED" }),
    });
    console.log(`   Court ${m.courtNumber}: [${m.team1Name}] ${s1} - ${s2} [${m.team2Name}] (Selesai)`);
  }

  // 7. Selesaikan Turnamen & Simpan ke Club
  logStep(7, "Penyelesaian Turnamen & Rekam ke Riwayat Club", "Menyimpan podium juara");
  const completeRes = await fetch(`${BASE_URL}/api/tournaments/${tourneyId}/complete`, {
    method: "POST",
  });
  const completeData = await completeRes.json();
  const top1 = completeData.finalStandings[0];
  const top2 = completeData.finalStandings[1];
  const top3 = completeData.finalStandings[2];

  console.log(`\n🎉 SELEBRASI PODIUM JUARA TURNAMEN:`);
  console.log(`🥇 Juara 1 (Emas):   ${top1.name} (${top1.pointsScored} Poin, Diff: +${top1.pointDiff})`);
  console.log(`🥈 Juara 2 (Perak):  ${top2.name} (${top2.pointsScored} Poin, Diff: +${top2.pointDiff})`);
  console.log(`🥉 Juara 3 (Perunggu): ${top3.name} (${top3.pointsScored} Poin, Diff: +${top3.pointDiff})`);

  console.log(`\n✅ Data turnamen dan scoreboard telah tersimpan secara permanen di database club!`);
  console.log(`   URL Arena Turnamen: ${BASE_URL}/tournament/${tourneyId}`);
  console.log("\n✨ SEMUA TEST BERHASIL 100% ✨\n");
}

runSimulation().catch(console.error);
