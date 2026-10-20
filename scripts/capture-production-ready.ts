import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/loezy/.gemini/antigravity/brain/c2a7ffd5-4b15-4663-af84-439512cff344";

async function sleep(ms: number) {
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
    // 1. Reza Admin Dashboard
    console.log("Loading Dashboard as Reza (Admin)...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(800);

    const shot20 = path.join(ARTIFACT_DIR, "20_reza_admin_dashboard.png");
    await page.screenshot({ path: shot20 });
    console.log("Captured 20_reza_admin_dashboard.png");

    // 2. Open User Dropdown showing 12 users
    console.log("Opening User Dropdown...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reza")
      );
      if (btn) btn.click();
    });
    await sleep(500);

    const shot21 = path.join(ARTIFACT_DIR, "21_twelve_users_dropdown.png");
    await page.screenshot({ path: shot21 });
    console.log("Captured 21_twelve_users_dropdown.png");

    // 3. Switch to Savira (Female Member with Pending RSVP or History)
    console.log("Switching to Savira...");
    await page.evaluate(() => {
      const saviraBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Savira")
      );
      if (saviraBtn) saviraBtn.click();
    });
    await sleep(1000);

    const shot22 = path.join(ARTIFACT_DIR, "22_savira_member_dashboard.png");
    await page.screenshot({ path: shot22 });
    console.log("Captured 22_savira_member_dashboard.png");

    // 4. Switch to Dini (Female Member with Pending RSVP)
    console.log("Switching to Dini...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Savira")
      );
      if (btn) btn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const diniBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Dini")
      );
      if (diniBtn) diniBtn.click();
    });
    await sleep(1000);

    const shot23 = path.join(ARTIFACT_DIR, "23_dini_member_rsvp_pending.png");
    await page.screenshot({ path: shot23 });
    console.log("Captured 23_dini_member_rsvp_pending.png");

    // 5. Open Club Management as Reza to see all 12 members in list
    console.log("Switching back to Reza to view 12 club members list...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Dini")
      );
      if (btn) btn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const rezaBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reza")
      );
      if (rezaBtn) rezaBtn.click();
    });
    await sleep(1000);

    await page.evaluate(() => {
      const clubBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Akses Club Management")
      );
      if (clubBtn) clubBtn.click();
    });
    await sleep(1000);

    const shot24 = path.join(ARTIFACT_DIR, "24_club_12_members_and_schedule.png");
    await page.screenshot({ path: shot24 });
    console.log("Captured 24_club_12_members_and_schedule.png");

    console.log("Finished capturing all production-ready screens!");
  } catch (err) {
    console.error("Capture error:", err);
  } finally {
    await browser.close();
  }
}

main();
