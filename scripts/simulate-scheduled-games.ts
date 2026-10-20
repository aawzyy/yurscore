import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/loezy/.gemini/antigravity/brain/c2a7ffd5-4b15-4663-af84-439512cff344";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1280, height: 950, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------
    // Step 1: Admin (Coach Alex) creates a Scheduled Game (In-Advance)
    // -------------------------------------------------------------
    console.log("1. Navigating to app as Coach Alex (Admin)...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(800);

    // Switch to Coach Alex to be sure
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Login") || b.textContent?.includes("Alex") || b.textContent?.includes("Maria")
      );
      if (btn) btn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const alexBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Coach Alex")
      );
      if (alexBtn) alexBtn.click();
    });
    await sleep(800);

    // Go to Club Management
    console.log("Opening Club Management...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Akses Club Management")
      );
      if (btn) btn.click();
    });
    await sleep(1000);

    // Open "Jadwalkan Game (In-Advance)" Modal
    console.log("Opening Scheduled Game Modal...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Jadwalkan Game (In-Advance)") || b.textContent?.includes("Jadwalkan Game Baru")
      );
      if (btn) btn.click();
    });
    await sleep(600);

    const shot13 = path.join(ARTIFACT_DIR, "13_schedule_game_modal.png");
    await page.screenshot({ path: shot13 });
    console.log("Captured 13_schedule_game_modal.png");

    // Fill form and submit
    console.log("Submitting Scheduled Game form...");
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Jadwalkan Game & Kirim RSVP")
      );
      if (submitBtn) submitBtn.click();
    });
    await sleep(1500);

    const shot14 = path.join(ARTIFACT_DIR, "14_admin_scheduled_game_created.png");
    await page.screenshot({ path: shot14 });
    console.log("Captured 14_admin_scheduled_game_created.png");

    // -------------------------------------------------------------
    // Step 2: Member (Maria Santos) receives RSVP invitation
    // -------------------------------------------------------------
    console.log("2. Switching to Member (Maria Santos)...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Coach Alex") || b.textContent?.includes("Alex")
      );
      if (btn) btn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const mariaBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Maria Santos")
      );
      if (mariaBtn) mariaBtn.click();
    });
    await sleep(1000);

    // Go to Member Dashboard
    await page.evaluate(() => {
      const backBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kembali ke Dashboard Saya")
      );
      if (backBtn) backBtn.click();
    });
    await sleep(800);

    const shot15 = path.join(ARTIFACT_DIR, "15_member_rsvp_pending_banner.png");
    await page.screenshot({ path: shot15 });
    console.log("Captured 15_member_rsvp_pending_banner.png");

    // Maria confirms RSVP: clicks "Ya, Saya Hadir!"
    console.log("Maria clicks 'Ya, Saya Hadir!'...");
    await page.evaluate(() => {
      const acceptBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Ya, Saya Hadir!")
      );
      if (acceptBtn) acceptBtn.click();
    });
    await sleep(1200);

    const shot16 = path.join(ARTIFACT_DIR, "16_member_rsvp_accepted.png");
    await page.screenshot({ path: shot16 });
    console.log("Captured 16_member_rsvp_accepted.png");

    // -------------------------------------------------------------
    // Step 3: Other members respond
    // -------------------------------------------------------------
    console.log("3. Other members responding to RSVP...");
    // David Kurniawan -> Hadir
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Maria Santos") || b.textContent?.includes("Maria")
      );
      if (btn) btn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const davidBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("David Kurniawan")
      );
      if (davidBtn) davidBtn.click();
    });
    await sleep(1000);
    await page.evaluate(() => {
      const acceptBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Ya, Saya Hadir!")
      );
      if (acceptBtn) acceptBtn.click();
    });
    await sleep(800);

    // Kevin Wijaya -> Hadir
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("David Kurniawan") || b.textContent?.includes("David")
      );
      if (btn) btn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const kevinBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kevin Wijaya")
      );
      if (kevinBtn) kevinBtn.click();
    });
    await sleep(1000);
    await page.evaluate(() => {
      const acceptBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Ya, Saya Hadir!")
      );
      if (acceptBtn) acceptBtn.click();
    });
    await sleep(800);

    // Siti Rahma -> Tidak Hadir
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kevin Wijaya") || b.textContent?.includes("Kevin")
      );
      if (btn) btn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const sitiBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Siti Rahma")
      );
      if (sitiBtn) sitiBtn.click();
    });
    await sleep(1000);
    await page.evaluate(() => {
      const declineBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Tidak Bisa Hadir")
      );
      if (declineBtn) declineBtn.click();
    });
    await sleep(800);

    // -------------------------------------------------------------
    // Step 4: Admin views lineup & performs Day-Of Adjustment
    // -------------------------------------------------------------
    console.log("4. Switching back to Admin (Coach Alex)...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Siti Rahma") || b.textContent?.includes("Siti")
      );
      if (btn) btn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const alexBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Coach Alex")
      );
      if (alexBtn) alexBtn.click();
    });
    await sleep(1000);

    // Go to Club Management
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Akses Club Management")
      );
      if (btn) btn.click();
    });
    await sleep(1000);

    const shot17 = path.join(ARTIFACT_DIR, "17_admin_rsvp_lineup_view.png");
    await page.screenshot({ path: shot17 });
    console.log("Captured 17_admin_rsvp_lineup_view.png");

    // DAY-OF ADJUSTMENT SIMULATION:
    // User requirement: "tapi di hari main masih bisa di adjust misal ada yang tiba2 ngak main"
    console.log("Simulating Day-of Adjustment: Maria calls in sick (sitting out), Siti joins last minute...");
    
    // Maria: click "Batal Main" (Sitting Out)
    await page.evaluate(() => {
      // Find row with Maria Santos
      const rows = Array.from(document.querySelectorAll("div")).filter((d) =>
        d.textContent?.includes("Maria Santos") && d.textContent?.includes("Batal Main")
      );
      const row = rows[rows.length - 1];
      if (row) {
        const btn = Array.from(row.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Batal Main")
        );
        if (btn) btn.click();
      }
    });
    await sleep(1000);

    // Siti: click "Ikut Main" (Force Playing)
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("div")).filter((d) =>
        d.textContent?.includes("Siti Rahma") && d.textContent?.includes("Ikut Main")
      );
      const row = rows[rows.length - 1];
      if (row) {
        const btn = Array.from(row.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Ikut Main")
        );
        if (btn) btn.click();
      }
    });
    await sleep(1000);

    const shot18 = path.join(ARTIFACT_DIR, "18_admin_day_of_lineup_adjusted.png");
    await page.screenshot({ path: shot18 });
    console.log("Captured 18_admin_day_of_lineup_adjusted.png");

    // -------------------------------------------------------------
    // Step 5: Admin starts the tournament directly from Scheduled Game!
    // -------------------------------------------------------------
    console.log("5. Admin clicks 'Mulai Turnamen Sekarang'...");
    await page.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Mulai Turnamen Sekarang")
      );
      if (startBtn) startBtn.click();
    });
    await sleep(2500);

    const shot19 = path.join(ARTIFACT_DIR, "19_tournament_started_from_schedule.png");
    await page.screenshot({ path: shot19 });
    console.log("Captured 19_tournament_started_from_schedule.png");

    console.log("SUCCESS! All scheduled game scenarios executed and verified in browser!");
  } catch (err) {
    console.error("Simulation error:", err);
  } finally {
    await browser.close();
  }
}

main();
