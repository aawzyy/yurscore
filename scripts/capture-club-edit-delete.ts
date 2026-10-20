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
    // 1. Go to homepage as Reza (Admin/Owner)
    console.log("Loading homepage as Reza...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.body.innerText.includes("Reza"), { timeout: 10000 });
    await sleep(800);

    // 2. Open Club Management
    console.log("Opening Club Management...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kelola Club") || b.textContent?.includes("Club Management")
      );
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.waitForFunction(() => document.body.innerText.includes("Jakarta Padel Masters"), { timeout: 10000 });
    await sleep(600);

    // Capture Club View with Edit & Delete buttons
    const shot36 = path.join(ARTIFACT_DIR, "36_admin_club_view_edit_delete_buttons.png");
    await page.screenshot({ path: shot36 });
    console.log("Captured 36_admin_club_view_edit_delete_buttons.png");

    // 3. Click "Edit Info Club" button
    console.log("Opening Edit Info Club Modal...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Edit Info Club")
      );
      if (btn) btn.click();
    });
    await sleep(600);

    const shot37 = path.join(ARTIFACT_DIR, "37_modal_edit_club_info.png");
    await page.screenshot({ path: shot37 });
    console.log("Captured 37_modal_edit_club_info.png");

    // Close edit modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.trim() === "Batal"
      );
      if (btn) btn.click();
    });
    await sleep(500);

    // 4. Click "Hapus Club" button
    console.log("Opening Hapus Club Modal...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Hapus Club")
      );
      if (btn) btn.click();
    });
    await sleep(600);

    const shot38 = path.join(ARTIFACT_DIR, "38_modal_delete_club_confirmation.png");
    await page.screenshot({ path: shot38 });
    console.log("Captured 38_modal_delete_club_confirmation.png");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

main();
