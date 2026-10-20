import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/home/loezy/.gemini/antigravity/brain/c2a7ffd5-4b15-4663-af84-439512cff344";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  try {
    // 1. Mobile Homepage / Dashboard
    console.log("Loading Mobile Homepage...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.body.innerText.includes("Reza"), { timeout: 10000 });
    await sleep(800);

    const shot1 = path.join(ARTIFACT_DIR, "mobile_01_homepage.png");
    await page.screenshot({ path: shot1, fullPage: false });
    console.log("Captured mobile_01_homepage.png");

    // Full page dashboard to see entire mobile scroll
    const shot1Full = path.join(ARTIFACT_DIR, "mobile_01_homepage_full.png");
    await page.screenshot({ path: shot1Full, fullPage: true });
    console.log("Captured mobile_01_homepage_full.png");

    // 2. Mobile User Dropdown
    console.log("Opening User Dropdown on mobile...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.closest("header") && (b.textContent?.includes("Reza") || b.textContent?.includes("RE"))
      );
      if (btn) btn.click();
    });
    await sleep(500);

    const shot2 = path.join(ARTIFACT_DIR, "mobile_02_user_dropdown.png");
    await page.screenshot({ path: shot2 });
    console.log("Captured mobile_02_user_dropdown.png");

    // Close dropdown
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.closest("header") && (b.textContent?.includes("Reza") || b.textContent?.includes("RE"))
      );
      if (btn) btn.click();
    });
    await sleep(400);

    // 3. Free Game Modal on mobile
    console.log("Opening Free Game Modal on mobile...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Free Game")
      );
      if (btn) btn.click();
    });
    await sleep(600);

    const shot3 = path.join(ARTIFACT_DIR, "mobile_03_free_game_modal.png");
    await page.screenshot({ path: shot3 });
    console.log("Captured mobile_03_free_game_modal.png");

    // Close Free Game modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.trim() === "Batal"
      );
      if (btn) btn.click();
    });
    await sleep(500);

    // 4. Mobile Club View
    console.log("Opening Club View on mobile...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kelola Club") || b.textContent?.includes("Club Management")
      );
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.waitForFunction(() => document.body.innerText.includes("Jakarta Padel Masters"), { timeout: 10000 });
    await sleep(600);

    const shot4 = path.join(ARTIFACT_DIR, "mobile_04_club_view.png");
    await page.screenshot({ path: shot4, fullPage: true });
    console.log("Captured mobile_04_club_view.png");

    // 5. Back to Dashboard, start Free Game and view Tournament Arena on mobile
    console.log("Navigating back to Dashboard...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kembali ke Dashboard")
      );
      if (btn) btn.click();
    });
    await sleep(800);

    // Open Free Game modal and click "Mulai Turnamen Sekarang"
    console.log("Starting quick free game tournament on mobile...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Main Free Game Cepat")
      );
      if (btn) btn.click();
    });
    await sleep(600);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Mulai Turnamen Sekarang")
      );
      if (btn) btn.click();
    });
    await sleep(2500);

    const shot5 = path.join(ARTIFACT_DIR, "mobile_05_tournament_arena.png");
    await page.screenshot({ path: shot5, fullPage: true });
    console.log("Captured mobile_05_tournament_arena.png");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

main();
