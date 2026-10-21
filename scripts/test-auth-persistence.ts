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
    // 1. Visit fresh page (no cookies)
    console.log("1. Visiting fresh page without cookies...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(800);

    const isPublic = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Scoring Pintar") && text.includes("Login / Masuk") && !text.includes("Halo, Reza!");
    });
    console.log("Is Public Landing Page on fresh visit?", isPublic);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "01_fresh_public_landing_mobile.png"), fullPage: true });

    // 2. Click "Login / Masuk" in navbar
    console.log("2. Clicking Login / Masuk...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Login / Masuk")
      );
      if (btn) btn.click();
    });
    await sleep(600);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "02_auth_modal_login_email.png") });

    // 3. Switch to "Akun Demo" and log in as Ardhi
    console.log("3. Switching to Akun Demo and selecting Ardhi...");
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Akun Demo"
      );
      if (tab) tab.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const ardhiBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Ardhi")
      );
      if (ardhiBtn) ardhiBtn.click();
    });
    await sleep(1500);

    const isArdhiLoggedIn = await page.evaluate(() => {
      return document.body.innerText.includes("Halo, Ardhi!");
    });
    console.log("Is Ardhi logged in?", isArdhiLoggedIn);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "03_logged_in_as_ardhi.png"), fullPage: false });

    // 4. Refresh page to verify persistence
    console.log("4. Refreshing page to verify persistence...");
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(800);

    const isStillArdhi = await page.evaluate(() => {
      return document.body.innerText.includes("Halo, Ardhi!");
    });
    console.log("After reload, is still logged in as Ardhi?", isStillArdhi);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "04_after_refresh_still_ardhi.png"), fullPage: false });

    // 5. Open user dropdown and click Logout
    console.log("5. Logging out...");
    await page.evaluate(() => {
      const userBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.closest("header") && (b.textContent?.includes("Ardhi") || b.textContent?.includes("AR"))
      );
      if (userBtn) userBtn.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Logout")
      );
      if (logoutBtn) logoutBtn.click();
    });
    await sleep(1000);

    const isLoggedOut = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Login / Masuk") && !text.includes("Halo, Ardhi!") && !text.includes("Halo, Reza!");
    });
    console.log("After clicking Logout, is logged out to public?", isLoggedOut);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "05_after_logout_public.png"), fullPage: false });

    // 6. Reload page to verify it does NOT revert to Reza
    console.log("6. Reloading after logout to verify no auto-login to Reza...");
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(800);

    const isStillLoggedOut = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Login / Masuk") && !text.includes("Halo, Reza!");
    });
    console.log("After reload, is STILL logged out (NOT Reza)?", isStillLoggedOut);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "06_after_reload_still_logged_out.png"), fullPage: false });

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

main();
