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
    defaultViewport: { width: 1280, height: 950, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  try {
    // 1. Load Homepage as Reza
    console.log("Loading homepage...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.body.innerText.includes("Reza"), { timeout: 10000 });
    await sleep(600);

    // 2. Switch to Savira (member)
    console.log("Switching to Savira...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reza") && b.closest("header")
      );
      if (btn) btn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Savira")
      );
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.waitForFunction(() => document.body.innerText.includes("Savira"), { timeout: 10000 });
    await sleep(600);

    // Capture Savira Member Dashboard with "Lihat Detail Grup" button
    const shot34 = path.join(ARTIFACT_DIR, "34_member_dashboard_detail_grup_btn.png");
    await page.screenshot({ path: shot34 });
    console.log("Captured 34_member_dashboard_detail_grup_btn.png");

    // 3. Click "Lihat Detail Grup"
    console.log("Clicking 'Lihat Detail Grup'...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Lihat Detail Grup")
      );
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.waitForFunction(() => document.body.innerText.includes("Jakarta Padel Masters"), { timeout: 10000 });
    await sleep(600);

    // Capture Savira viewing Club Details in read-only mode
    const shot35 = path.join(ARTIFACT_DIR, "35_member_viewing_club_details_readonly.png");
    await page.screenshot({ path: shot35 });
    console.log("Captured 35_member_viewing_club_details_readonly.png");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

main();
