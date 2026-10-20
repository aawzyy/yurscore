import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/home/loezy/.gemini/antigravity/brain/c2a7ffd5-4b15-4663-af84-439512cff344";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
    defaultViewport: { width: 1280, height: 950, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  try {
    // ---- Shot 30: Club Management View ----
    console.log("Loading as Reza for Club View...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => document.body.innerText.includes("Reza"),
      { timeout: 10000 }
    );
    await sleep(1000);

    // Click "Akses Club Management" or similar
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Club Management") || b.textContent?.includes("Kelola Club")
      );
      if (btn) btn.click();
    });
    await sleep(1500);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "30_corporate_minimalist_club_view.png") });
    console.log("✅ 30_corporate_minimalist_club_view.png");

    // ---- Shot 31 & 32: Tournament Arena ----
    console.log("Starting free game tournament...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.body.innerText.includes("Reza"), { timeout: 10000 });
    await sleep(800);

    // Open Free Game Modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Main Bebas") || b.textContent?.includes("Free Game")
      );
      if (btn) btn.click();
    });
    await sleep(800);

    // Start tournament
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Mulai Turnamen Sekarang")
      );
      if (btn) btn.click();
    });
    
    // Wait for navigation
    try {
      await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 });
    } catch {}
    await sleep(2000);
    
    // Wait for tournament to render
    await page.waitForFunction(
      () => document.body.innerText.includes("Court") || document.body.innerText.includes("Ronde"),
      { timeout: 10000 }
    );
    await sleep(800);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "31_corporate_minimalist_tournament_arena.png") });
    console.log("✅ 31_corporate_minimalist_tournament_arena.png");

    // Switch to standings tab
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Papan Klasemen")
      );
      if (btn) btn.click();
    });
    await sleep(800);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "32_corporate_minimalist_standings.png") });
    console.log("✅ 32_corporate_minimalist_standings.png");

    // ---- Shot 33: Auth Modal ----
    console.log("Capturing Auth Modal...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => document.body.innerText.includes("Reza") || document.body.innerText.includes("Masuk"),
      { timeout: 10000 }
    );
    await sleep(800);

    // Logout
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Logout") || b.textContent?.includes("Keluar")
      );
      if (btn) btn.click();
    });
    await sleep(1500);

    // Open Auth modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Masuk") || b.textContent?.includes("Login")
      );
      if (btn) btn.click();
    });
    await sleep(800);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "33_corporate_minimalist_auth_modal.png") });
    console.log("✅ 33_corporate_minimalist_auth_modal.png");

    console.log("\n🎉 All remaining screenshots captured!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

main();
