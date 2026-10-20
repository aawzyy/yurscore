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
    await page.waitForFunction(() => document.body.innerText.includes("Jakarta Padel Masters"), { timeout: 10000 });
    await sleep(600);

    // 3. Find Ardhi in member list and click "Ubah Role"
    console.log("Finding Ardhi specifically...");
    await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll("div"));
      const ardhiRow = allDivs.find((d) => {
        const text = d.textContent || "";
        return text.includes("Ardhi") && text.includes("ardhi@yurscore.com");
      });
      if (ardhiRow) {
        const btn = Array.from(ardhiRow.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Ubah Role")
        );
        if (btn) btn.click();
      }
    });
    await sleep(800);

    // Capture screenshot of Modal Ubah Role for Ardhi
    const shot39 = path.join(ARTIFACT_DIR, "39_modal_ubah_role_member.png");
    await page.screenshot({ path: shot39 });
    console.log("Captured 39_modal_ubah_role_member.png with Ardhi!");

    // 4. Select "Transfer Ownership (Jadikan Owner)"
    await page.evaluate(() => {
      const radio = document.querySelector('input[value="OWNER"]') as HTMLInputElement;
      if (radio) {
        radio.click();
      }
    });
    await sleep(500);

    const shot40 = path.join(ARTIFACT_DIR, "40_transfer_ownership_selected.png");
    await page.screenshot({ path: shot40 });
    console.log("Captured 40_transfer_ownership_selected.png with Ardhi!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

main();
