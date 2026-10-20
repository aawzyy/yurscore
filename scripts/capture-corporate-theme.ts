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
    // 1. Reza Corporate Minimalist Homepage/Dashboard
    console.log("Loading Homepage as Reza...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    // Wait for React hydration - the navbar should show "Reza" after hydration
    await page.waitForFunction(
      () => document.body.innerText.includes("Reza"),
      { timeout: 10000 }
    );
    await sleep(1000);

    const shot26 = path.join(ARTIFACT_DIR, "26_corporate_minimalist_homepage.png");
    await page.screenshot({ path: shot26 });
    console.log("✅ 26_corporate_minimalist_homepage.png");

    // 2. Open Free Game Modal
    console.log("Opening Free Game Modal...");
    const freeGameBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Main Bebas") || b.textContent?.includes("Free Game")
      );
    });
    if (freeGameBtn) {
      await (freeGameBtn as any).click();
      await sleep(800);
    }

    const shot27 = path.join(ARTIFACT_DIR, "27_corporate_minimalist_freegame_modal.png");
    await page.screenshot({ path: shot27 });
    console.log("✅ 27_corporate_minimalist_freegame_modal.png");

    // Close Free Game Modal
    const cancelBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.trim() === "Batal"
      );
    });
    if (cancelBtn) {
      await (cancelBtn as any).click();
      await sleep(500);
    }

    // 3. Open User Dropdown 
    console.log("Opening User Dropdown...");
    const userBtn = await page.evaluateHandle(() => {
      // Look for the navbar user toggle - it has the user initials or name
      return Array.from(document.querySelectorAll("button")).find((b) => {
        const text = b.textContent?.trim() || "";
        return text.includes("Reza") && b.closest("nav,header");
      });
    });
    if (userBtn) {
      await (userBtn as any).click();
      await sleep(600);
    }

    const shot28 = path.join(ARTIFACT_DIR, "28_corporate_minimalist_user_dropdown.png");
    await page.screenshot({ path: shot28 });
    console.log("✅ 28_corporate_minimalist_user_dropdown.png");

    // 4. Switch to Savira (member)
    console.log("Switching to Savira...");
    const saviraBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Savira")
      );
    });
    if (saviraBtn) {
      await (saviraBtn as any).click();
      await sleep(1500);
      // Wait for hydration after user switch
      await page.waitForFunction(
        () => document.body.innerText.includes("Savira"),
        { timeout: 10000 }
      );
      await sleep(500);
    }

    const shot29 = path.join(ARTIFACT_DIR, "29_corporate_minimalist_member_dashboard.png");
    await page.screenshot({ path: shot29 });
    console.log("✅ 29_corporate_minimalist_member_dashboard.png");

    // 5. Switch back to Reza and go to Club View
    console.log("Switching back to Reza for Club View...");
    // Click the user button in nav to open dropdown
    const savNavBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) => {
        const text = b.textContent?.trim() || "";
        return text.includes("Savira") && b.closest("nav,header");
      });
    });
    if (savNavBtn) {
      await (savNavBtn as any).click();
      await sleep(500);
    }
    const rezaBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reza") && !b.closest("nav,header")
      );
    });
    if (rezaBtn) {
      await (rezaBtn as any).click();
      await sleep(1500);
      await page.waitForFunction(
        () => document.body.innerText.includes("Reza"),
        { timeout: 10000 }
      );
      await sleep(500);
    }

    // Click "Akses Club Management"
    const clubBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Club Management") || b.textContent?.includes("Kelola Club")
      );
    });
    if (clubBtn) {
      await (clubBtn as any).click();
      await sleep(1200);
    }

    const shot30 = path.join(ARTIFACT_DIR, "30_corporate_minimalist_club_view.png");
    await page.screenshot({ path: shot30 });
    console.log("✅ 30_corporate_minimalist_club_view.png");

    // 6. Create a quick free game tournament to test arena
    console.log("Creating free game tournament for arena screenshots...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => document.body.innerText.includes("Reza"),
      { timeout: 10000 }
    );
    await sleep(800);

    // Click Free Game button
    const fg2 = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Main Bebas") || b.textContent?.includes("Free Game")
      );
    });
    if (fg2) {
      await (fg2 as any).click();
      await sleep(800);
    }

    // Click "Mulai Turnamen Sekarang"
    const startBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Mulai Turnamen Sekarang")
      );
    });
    if (startBtn) {
      await (startBtn as any).click();
      console.log("Clicked start tournament, waiting for redirect...");
      // Wait for navigation to /tournament/...
      await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});
      await sleep(2000);
      // Wait for tournament content to appear
      await page.waitForFunction(
        () => document.body.innerText.includes("Court") || document.body.innerText.includes("Ronde"),
        { timeout: 10000 }
      );
      await sleep(500);
    }

    const shot31 = path.join(ARTIFACT_DIR, "31_corporate_minimalist_tournament_arena.png");
    await page.screenshot({ path: shot31 });
    console.log("✅ 31_corporate_minimalist_tournament_arena.png");

    // Switch to Standings tab
    const standingsTab = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Papan Klasemen")
      );
    });
    if (standingsTab) {
      await (standingsTab as any).click();
      await sleep(800);
    }

    const shot32 = path.join(ARTIFACT_DIR, "32_corporate_minimalist_standings.png");
    await page.screenshot({ path: shot32 });
    console.log("✅ 32_corporate_minimalist_standings.png");

    // 7. Auth Modal (log out first)
    console.log("Capturing Auth Modal...");
    // Navigate to homepage and trigger logout
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => document.body.innerText.includes("Reza") || document.body.innerText.includes("Masuk"),
      { timeout: 10000 }
    );
    await sleep(600);

    // Try to find and click Logout button
    const logoutBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Logout") || b.textContent?.includes("Keluar")
      );
    });
    if (logoutBtn) {
      await (logoutBtn as any).click();
      await sleep(1200);
    }

    // Now try to click login button to open auth modal
    const loginBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Masuk") || b.textContent?.includes("Login")
      );
    });
    if (loginBtn) {
      await (loginBtn as any).click();
      await sleep(800);
    }

    const shot33 = path.join(ARTIFACT_DIR, "33_corporate_minimalist_auth_modal.png");
    await page.screenshot({ path: shot33 });
    console.log("✅ 33_corporate_minimalist_auth_modal.png");

    console.log("\n🎉 All screenshots captured successfully!");
  } catch (err) {
    console.error("Error during puppeteer run:", err);
  } finally {
    await browser.close();
  }
}

main();
