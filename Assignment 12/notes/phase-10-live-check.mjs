import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../math-practice-app/package.json", import.meta.url),
);
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(
  new URL(
    "../math-practice-app/node_modules/.cache/playwright-browsers/",
    import.meta.url,
  ),
);
const { chromium } = require("@playwright/test");
const address = "https://jnuso.github.io/CSE-4095/";
const output = new URL(
  "../math-practice-app/output/playwright/phase-10-live/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const results = [];
try {
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    // Fresh disposable data: never use the student's browser or saved profile.
    const context = await browser.newContext({
      viewport,
      isMobile: name === "mobile",
      hasTouch: name === "mobile",
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type()))
          errors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.url().startsWith(address) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      for (const [route, heading] of [
        ["/", "Big ideas start with small steps."],
        ["/practice/setup", "Choose your practice"],
        ["/practice/summary", "Your practice recap"],
        ["/statistics", "Your statistics"],
        ["/settings", "Make it your own"],
        ["/unknown-page", "Let's find your way back."],
      ]) {
        const response = await page.goto(`${address}#${route}`);
        // Same-document hash navigations may not make an HTTP request.
        if (response) assert.equal(response.status(), 200);
        await page
          .getByRole("heading", { name: heading, exact: true, level: 1 })
          .waitFor();
        assert.equal((await page.reload()).status(), 200);
        await page
          .getByRole("heading", { name: heading, exact: true, level: 1 })
          .waitFor();
      }
      await page.goto(`${address}#/practice/setup`);
      await page
        .getByRole("radio", { name: "5 questions", exact: true })
        .check();
      await page
        .getByRole("button", { name: "Start Session", exact: true })
        .click();
      for (const right of [true, false, true, false, true]) {
        await page
          .getByRole("group", { name: "Answer choices" })
          .getByRole("button")
          .first()
          .click();
        await page
          .getByRole("button", { name: "Flip Card", exact: true })
          .click();
        await page
          .getByRole("button", {
            name: right ? "I Got It Right" : "I Got It Wrong",
            exact: true,
          })
          .click();
      }
      await page
        .getByRole("heading", { name: "Your practice recap", exact: true })
        .waitFor();
      const metric = (label) =>
        page.getByText(label, { exact: true }).locator("..").locator("dd");
      assert.equal(await metric("Accuracy").innerText(), "60%");
      await page.reload();
      await page
        .getByRole("heading", { name: "Your practice recap", exact: true })
        .waitFor();
      assert.equal(await metric("Questions attempted").innerText(), "5");
      assert.equal(await metric("Marked right").innerText(), "3");
      assert.equal(await metric("Marked wrong").innerText(), "2");
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-summary.png`, output)),
        fullPage: true,
      });
      await page
        .getByRole("link", { name: "View Statistics", exact: true })
        .click();
      const overall = page.getByLabel("Overall results", { exact: true });
      const overallMetric = (label) =>
        overall.getByText(label, { exact: true }).locator("..").locator("dd");
      assert.equal(await overallMetric("Questions attempted").innerText(), "5");
      assert.equal(await overallMetric("Marked right").innerText(), "3");
      assert.equal(await overallMetric("Marked wrong").innerText(), "2");
      assert.equal(await overallMetric("Accuracy").innerText(), "60%");
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-statistics.png`, output)),
        fullPage: true,
      });
      const settingsBefore = await page.evaluate(
        () => JSON.parse(localStorage.getItem("mathPractice.data")).settings,
      );
      await page
        .getByRole("button", { name: "Reset Statistics", exact: true })
        .click();
      await page.getByRole("dialog").waitFor();
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-reset-dialog.png`, output)),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Keep my history", exact: true })
        .click();
      assert.equal(await overallMetric("Questions attempted").innerText(), "5");
      await page
        .getByRole("button", { name: "Reset Statistics", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Erase history", exact: true })
        .click();
      await page.getByText(/No sessions yet/).waitFor();
      await page.reload();
      await page.getByText(/No sessions yet/).waitFor();
      const reset = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("mathPractice.data")),
      );
      assert.deepEqual(reset.records, []);
      assert.deepEqual(reset.settings, settingsBefore);
      await page.goto(`${address}#/practice/setup`);
      const skip = page.getByRole("link", {
        name: "Skip to content",
        exact: true,
      });
      await skip.focus();
      await skip.press("Enter");
      assert.equal(new URL(page.url()).hash, "#/practice/setup");
      assert.equal(
        await page
          .getByRole("main")
          .evaluate((element) => document.activeElement === element),
        true,
      );
      assert.deepEqual(errors, []);
      results.push({
        viewport: name,
        routesAndRefreshes: "passed",
        session: "5 attempts, 3 right, 2 wrong, 60%",
        persistedReload: "passed",
        skipLink: "passed",
        statistics: "5 attempts, 3 right, 2 wrong, 60%",
        resetCancelConfirmReloadAndPreferences: "passed",
        browserErrors: [],
      });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(
  new URL("results.json", output),
  JSON.stringify({ address, results }, null, 2) + "\n",
);
console.log(JSON.stringify({ address, results }, null, 2));
