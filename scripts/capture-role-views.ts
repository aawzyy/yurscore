import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/loezy/.gemini/antigravity/brain/c2a7ffd5-4b15-4663-af84-439512cff344";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1280, height: 950, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  try {
    // 1. Log in as Regular Member (Maria Santos)
    console.log("Logging in as Member (Maria Santos)...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));

    // Click profile dropdown in navbar and switch to Maria Santos
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Alex") || b.textContent?.includes("Login")
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const mariaBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Maria Santos")
      );
      if (mariaBtn) mariaBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Screenshot: Member Dashboard
    const shotMember = path.join(ARTIFACT_DIR, "08_member_dashboard_maria.png");
    await page.screenshot({ path: shotMember });
    console.log("Captured 08_member_dashboard_maria.png");

    // Click "Lihat Riwayat & Leaderboard" in Maria's club card
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Lihat Riwayat & Leaderboard")
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Screenshot: Member Club View (Read-Only)
    const shotMemberClub = path.join(ARTIFACT_DIR, "09_member_club_view_readonly.png");
    await page.screenshot({ path: shotMemberClub });
    console.log("Captured 09_member_club_view_readonly.png");

    // 2. Switch back to Admin (Coach Alex)
    console.log("Switching to Admin (Coach Alex)...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Maria")
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const alexBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Coach Alex")
      );
      if (alexBtn) alexBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Go to dashboard
    await page.evaluate(() => {
      const backBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kembali ke Dashboard")
      );
      if (backBtn) backBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Screenshot: Admin Dashboard (with "Akses Club Management")
    const shotAdmin = path.join(ARTIFACT_DIR, "10_admin_dashboard_alex.png");
    await page.screenshot({ path: shotAdmin });
    console.log("Captured 10_admin_dashboard_alex.png");

    // Click "Akses Club Management"
    await page.evaluate(() => {
      const mgmtBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Akses Club Management")
      );
      if (mgmtBtn) mgmtBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Screenshot: Admin Club Management View
    const shotAdminClub = path.join(ARTIFACT_DIR, "11_admin_club_management.png");
    await page.screenshot({ path: shotAdminClub });
    console.log("Captured 11_admin_club_management.png");

    // 3. Logout to capture public homepage
    console.log("Logging out to capture public homepage...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Alex")
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Logout")
      );
      if (logoutBtn) logoutBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotPublic = path.join(ARTIFACT_DIR, "12_public_homepage.png");
    await page.screenshot({ path: shotPublic });
    console.log("Captured 12_public_homepage.png");

    console.log("All role-based views captured successfully!");
  } catch (err) {
    console.error("Error capturing role views:", err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
