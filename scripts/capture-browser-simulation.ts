import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/loezy/.gemini/antigravity/brain/c2a7ffd5-4b15-4663-af84-439512cff344";

async function clickByText(page: any, tag: string, text: string) {
  return await page.evaluate(
    ({ tag, text }: { tag: string; text: string }) => {
      const elements = Array.from(document.querySelectorAll(tag));
      const found = elements.find((el) =>
        el.textContent?.toLowerCase().includes(text.toLowerCase())
      ) as HTMLElement | undefined;
      if (found) {
        found.click();
        return true;
      }
      return false;
    },
    { tag, text }
  );
}

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log("Launching headless Chrome browser...");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1280, height: 850, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  try {
    // 1. Homepage
    console.log("Navigating to Homepage...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    const shot1 = path.join(ARTIFACT_DIR, "01_homepage.png");
    await page.screenshot({ path: shot1 });
    console.log("Captured 01_homepage.png");

    // 2. Open Free Game Modal
    console.log("Opening Free Game modal...");
    await clickByText(page, "button", "Mulai Free Game Sekarang");
    await new Promise((r) => setTimeout(r, 600));

    // Click "Contoh 8 Pemain"
    console.log("Selecting 8 players preset...");
    await clickByText(page, "button", "Contoh 8 Pemain");
    await new Promise((r) => setTimeout(r, 400));

    // Click "2 Lapangan"
    console.log("Selecting 2 Lapangan...");
    await clickByText(page, "button", "2 Lapangan");
    await new Promise((r) => setTimeout(r, 400));

    const shot2 = path.join(ARTIFACT_DIR, "02_free_game_setup.png");
    await page.screenshot({ path: shot2 });
    console.log("Captured 02_free_game_setup.png");

    // 3. Start Tournament
    console.log("Starting Tournament...");
    await clickByText(page, "button", "Mulai Turnamen Sekarang");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    const shot3 = path.join(ARTIFACT_DIR, "03_tournament_live_courts.png");
    await page.screenshot({ path: shot3 });
    console.log("Captured 03_tournament_live_courts.png");

    // 4. Fill match scores
    console.log("Entering scores on Court 1 and Court 2...");
    // Court 1: Click 18-14
    await page.evaluate(() => {
      const qb = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.textContent?.trim() === "18-14"
      );
      if (qb[0]) qb[0].click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // Court 1: Kunci & Selesai
    await page.evaluate(() => {
      const locks = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.textContent?.includes("Kunci & Selesai")
      );
      if (locks[0]) locks[0].click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Court 2: Click 20-12
    await page.evaluate(() => {
      const qb = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.textContent?.trim() === "20-12"
      );
      if (qb[1]) qb[1].click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // Court 2: Kunci & Selesai
    await page.evaluate(() => {
      const locks = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.textContent?.includes("Kunci & Selesai")
      );
      if (locks[1]) locks[1].click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot4 = path.join(ARTIFACT_DIR, "04_scoring_in_action.png");
    await page.screenshot({ path: shot4 });
    console.log("Captured 04_scoring_in_action.png");

    // 5. Switch to Leaderboard tab
    console.log("Opening Standings Tab...");
    await clickByText(page, "button", "Papan Klasemen");
    await new Promise((r) => setTimeout(r, 600));

    const shot5 = path.join(ARTIFACT_DIR, "05_live_leaderboard.png");
    await page.screenshot({ path: shot5 });
    console.log("Captured 05_live_leaderboard.png");

    // 6. Complete Tournament & trigger confetti podium
    console.log("Completing Tournament & Podium Celebration...");
    await clickByText(page, "button", "Selesaikan Turnamen");
    await new Promise((r) => setTimeout(r, 900));

    const shot6 = path.join(ARTIFACT_DIR, "06_podium_confetti.png");
    await page.screenshot({ path: shot6 });
    console.log("Captured 06_podium_confetti.png");

    // 7. Back to Club Dashboard
    console.log("Navigating back to Club Dashboard...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    await page.evaluate(() => {
      const el = document.getElementById("club-management-section");
      if (el) el.scrollIntoView();
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot7 = path.join(ARTIFACT_DIR, "07_club_dashboard.png");
    await page.screenshot({ path: shot7 });
    console.log("Captured 07_club_dashboard.png");

    console.log("🎉 ALL SCREENSHOTS SAVED SUCCESSFULLY TO ARTIFACT DIR!");
  } catch (err) {
    console.error("Error during browser automation:", err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
