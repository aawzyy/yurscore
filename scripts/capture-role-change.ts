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
    // 1. Go to homepage as Reza (Owner)
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
    await page.waitForFunction(() => document.body.innerText.includes("Anggota Club"), { timeout: 10000 });
    await sleep(600);

    // 3. Find Ardhi in member list and click "Ubah Role"
    console.log("Finding Ardhi and clicking 'Ubah Role'...");
    await page.evaluate(() => {
      const memberRows = Array.from(document.querySelectorAll("div")).filter((d) =>
        d.textContent?.includes("Ardhi") && d.textContent?.includes("ardhi@yurscore.com")
      );
      if (memberRows.length > 0) {
        const btn = Array.from(memberRows[0].querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Ubah Role")
        );
        if (btn) btn.click();
      }
    });
    await sleep(800);

    // Capture screenshot of Modal Ubah Role
    const shot39 = path.join(ARTIFACT_DIR, "39_modal_ubah_role_member.png");
    await page.screenshot({ path: shot39 });
    console.log("Captured 39_modal_ubah_role_member.png");

    // 4. Select "Transfer Ownership (Jadikan Owner)"
    console.log("Selecting Transfer Ownership to Ardhi...");
    await page.evaluate(() => {
      const radio = document.querySelector('input[value="OWNER"]') as HTMLInputElement;
      if (radio) {
        radio.click();
      }
    });
    await sleep(500);

    const shot40 = path.join(ARTIFACT_DIR, "40_transfer_ownership_selected.png");
    await page.screenshot({ path: shot40 });
    console.log("Captured 40_transfer_ownership_selected.png");

    // 5. Submit Transfer Ownership
    console.log("Saving role change...");
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Simpan Role Baru")
      );
      if (saveBtn) saveBtn.click();
    });
    await sleep(2000);

    // Capture Ardhi as new Owner
    const shot41 = path.join(ARTIFACT_DIR, "41_ardhi_is_now_owner.png");
    await page.screenshot({ path: shot41 });
    console.log("Captured 41_ardhi_is_now_owner.png");

    // 6. Transfer back to Reza to keep Reza as Owner
    console.log("Transferring ownership back to Reza...");
    // Ardhi is owner now, switch to Ardhi first
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(600);
    // Switch to Ardhi
    await page.evaluate(() => {
      const userBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.closest("header") && (b.textContent?.includes("Reza") || b.textContent?.includes("RE"))
      );
      if (userBtn) userBtn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const ardhiBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Ardhi")
      );
      if (ardhiBtn) ardhiBtn.click();
    });
    await sleep(1500);

    // Go to Club Management
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Kelola Club") || b.textContent?.includes("Club Management")
      );
      if (btn) btn.click();
    });
    await sleep(1500);

    // Find Reza and click "Ubah Role"
    await page.evaluate(() => {
      const memberRows = Array.from(document.querySelectorAll("div")).filter((d) =>
        d.textContent?.includes("Reza") && d.textContent?.includes("reza@yurscore.com")
      );
      if (memberRows.length > 0) {
        const btn = Array.from(memberRows[0].querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Ubah Role")
        );
        if (btn) btn.click();
      }
    });
    await sleep(800);

    // Click OWNER radio
    await page.evaluate(() => {
      const radio = document.querySelector('input[value="OWNER"]') as HTMLInputElement;
      if (radio) radio.click();
    });
    await sleep(400);

    // Click save
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Simpan Role Baru")
      );
      if (saveBtn) saveBtn.click();
    });
    await sleep(2000);

    // Switch back to Reza
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(600);
    await page.evaluate(() => {
      const userBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.closest("header") && (b.textContent?.includes("Ardhi") || b.textContent?.includes("AR"))
      );
      if (userBtn) userBtn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const rezaBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reza")
      );
      if (rezaBtn) rezaBtn.click();
    });
    await sleep(1500);
    console.log("Ownership successfully restored to Reza!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

main();
