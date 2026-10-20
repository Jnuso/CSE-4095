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
const { chromium, expect } = require("@playwright/test");
const address = "https://jnuso.github.io/CSE-4095/";
const output = new URL(
  "../math-practice-app/output/playwright/phase-15-live/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const results = [];
try {
  for (const [viewport, size] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
      viewport: size,
      isMobile: viewport === "mobile",
      hasTouch: viewport === "mobile",
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (["error", "warning"].includes(m.type())) errors.push(m.text());
      });
      page.on("response", (r) => {
        if (r.url().startsWith(address) && r.status() >= 400)
          errors.push(`${r.status()} ${r.url()}`);
      });
      const raw = () =>
        page.evaluate(() => localStorage.getItem("mathPractice.data"));
      const data = async () => JSON.parse(await raw());
      const total = (label) =>
        page
          .getByLabel("Mistake and review totals", { exact: true })
          .getByText(label, { exact: true })
          .locator("..")
          .locator("dd");
      async function counters(active, mastered, practiced, right) {
        for (const [label, value] of [
          ["Active mistake patterns", active],
          ["Mastered mistake patterns", mastered],
          ["Similar questions practiced", practiced],
          ["Review questions marked right", right],
        ]) {
          await expect(total(label)).toHaveText(String(value));
        }
      }
      async function report(right) {
        await page
          .getByRole("group", { name: "Answer choices", exact: true })
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
      async function regular() {
        await page.goto(address + "#/practice/setup");
        await page
          .getByRole("radio", { name: "Regular practice", exact: true })
          .check();
        await page
          .getByRole("radio", { name: "5 questions", exact: true })
          .check();
        await page
          .getByRole("button", { name: "Start Session", exact: true })
          .click();
      }
      await page.goto(address + "#/statistics");
      await counters(0, 0, 0, 0);
      await regular();
      for (const right of [false, false, true, true, true]) await report(right);
      await page
        .getByRole("link", { name: "Practice Mistakes", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Start Session", exact: true })
        .click();
      for (let i = 0; i < 5; i++) await report(true);
      await page
        .getByRole("link", { name: "View Statistics", exact: true })
        .click();
      await counters(1, 1, 5, 5);
      await expect(
        page.getByText("Addition — 2 misses.", { exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("list", {
            name: "Most frequently missed facts",
            exact: true,
          })
          .getByRole("listitem"),
      ).toHaveCount(2);
      const activeList = page.getByRole("list", {
        name: "Active mistake details",
        exact: true,
      });
      await expect(activeList.getByRole("article")).toHaveCount(1);
      await expect(activeList.getByRole("progressbar")).toHaveAttribute(
        "value",
        "2",
      );
      const before = await raw();
      const section = page.getByRole("region", {
        name: "Mistakes and review",
        exact: true,
      });
      await section.screenshot({
        path: fileURLToPath(
          new URL(`${viewport}-active-statistics.png`, output),
        ),
        animations: "disabled",
      });
      const masteredRadio = page.getByRole("radio", {
        name: "Mastered mistakes (1)",
        exact: true,
      });
      await masteredRadio.focus();
      await page.keyboard.press("Space");
      const masteredList = page.getByRole("list", {
        name: "Mastered mistake details",
        exact: true,
      });
      await expect(masteredList.getByRole("article")).toHaveCount(1);
      await expect(masteredList.getByRole("progressbar")).toHaveAttribute(
        "value",
        "3",
      );
      await expect(masteredList.locator("time")).toHaveCount(1);
      await section.screenshot({
        path: fileURLToPath(
          new URL(`${viewport}-mastered-statistics.png`, output),
        ),
        animations: "disabled",
      });
      assert.equal(await raw(), before);
      await page.reload();
      await counters(1, 1, 5, 5);
      assert.equal(await raw(), before);
      await page.getByRole("link", { name: "Settings", exact: true }).click();
      await page
        .getByRole("button", { name: "Save Settings", exact: true })
        .click();
      await page.getByRole("link", { name: "Statistics", exact: true }).click();
      await counters(1, 1, 5, 5);
      await page
        .getByRole("button", { name: "Reset Statistics", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Keep my history", exact: true })
        .click();
      await counters(1, 1, 5, 5);
      await page
        .getByRole("button", { name: "Reset Statistics", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Erase history", exact: true })
        .click();
      await counters(0, 0, 0, 0);
      await expect(page.getByText(/No remembered mistakes yet/)).toBeVisible();
      const preferences = (await data()).settings;
      await regular();
      await report(false);
      await page.getByRole("link", { name: "Statistics", exact: true }).click();
      await counters(1, 0, 0, 0);
      assert.deepEqual((await data()).settings, preferences);
      await page.getByRole("link", { name: "Settings", exact: true }).click();
      await page
        .getByRole("button", {
          name: "Clear All Application Data",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Erase all app data", exact: true })
        .click();
      await page.getByRole("link", { name: "Statistics", exact: true }).click();
      await counters(0, 0, 0, 0);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(errors, []);
      results.push({
        viewport,
        realRegularMisses: 2,
        realReviewReports: 5,
        activePatterns: 1,
        masteredPatterns: 1,
        reviewCorrect: 5,
        highestFactTies: 2,
        originalOperationAttribution: "Addition, 2 misses",
        progress: "active 2/3, mastered 3/3",
        keyboardViewsReadOnlyReloadAndSettings: "passed",
        resetCancelConfirmAndClear: "passed",
        browserErrors: errors,
      });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
const result = { address, results };
await writeFile(
  new URL("results.json", output),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
