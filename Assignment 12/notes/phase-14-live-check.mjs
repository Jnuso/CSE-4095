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
  "../math-practice-app/output/playwright/phase-14-live/",
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
      const data = () =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("mathPractice.data")),
        );
      const metric = (name) =>
        page.getByText(name, { exact: true }).locator("..").locator("dd");
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
      await page.goto(address + "#/practice/setup");
      await expect(
        page.getByRole("radio", { name: "Mistake review", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("radio", { name: "5 questions", exact: true })
        .check();
      await page
        .getByRole("button", { name: "Start Session", exact: true })
        .click();
      for (const right of [false, true, true, true, true]) await report(right);
      await expect(metric("Accuracy")).toHaveText("80%");
      const original = (await data()).mistakePatterns[0];
      assert.equal((await data()).mistakePatterns.length, 1);
      await page
        .getByRole("link", { name: "Practice Mistakes", exact: true })
        .click();
      await expect(
        page.getByRole("radio", { name: "Mistake review", exact: true }),
      ).toBeChecked();
      await page.getByRole("radio", { name: /^Easy/ }).check();
      await expect(
        page.getByRole("button", { name: "Start Session", exact: true }),
      ).toBeDisabled();
      await page.getByRole("radio", { name: /^Beginner/ }).check();
      await page.screenshot({
        path: fileURLToPath(new URL(`${viewport}-review-setup.png`, output)),
        fullPage: true,
        animations: "disabled",
      });
      await page
        .getByRole("button", { name: "Start Session", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Your mistake review", exact: true }),
      ).toBeVisible();
      await report(true);
      assert.equal((await data()).mistakePatterns[0].similarCorrectCount, 1);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Your mistake review", exact: true }),
      ).toBeVisible();
      assert.equal((await data()).mistakePatterns[0].similarCorrectCount, 1);
      await report(false);
      assert.equal((await data()).mistakePatterns[0].similarCorrectCount, 0);
      await page.screenshot({
        path: fileURLToPath(new URL(`${viewport}-review-card.png`, output)),
        fullPage: true,
        animations: "disabled",
      });
      for (let i = 0; i < 3; i++) await report(true);
      await expect(
        page.getByRole("heading", { name: "Your practice recap", exact: true }),
      ).toBeVisible();
      await expect(metric("Mistake-review questions completed")).toHaveText(
        "4",
      );
      const mastered = await data();
      assert.equal(mastered.reviewEvents.length, 5);
      assert.equal(mastered.mistakePatterns.length, 1);
      assert.equal(mastered.mistakePatterns[0].id, original.id);
      assert.equal(mastered.mistakePatterns[0].incorrectCount, 2);
      assert.equal(mastered.mistakePatterns[0].similarCorrectCount, 3);
      assert.equal(mastered.mistakePatterns[0].mastered, true);
      await expect(
        page.getByRole("button", { name: "Practice Mistakes", exact: true }),
      ).toBeDisabled();
      await page.screenshot({
        path: fileURLToPath(new URL(`${viewport}-review-summary.png`, output)),
        fullPage: true,
        animations: "disabled",
      });
      await page.reload();
      assert.deepEqual(
        (await data()).mistakePatterns,
        mastered.mistakePatterns,
      );
      await page
        .getByRole("link", { name: "Practice Again", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Choose your practice",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Mistake review", exact: true }),
      ).toBeDisabled();
      await page.getByRole("link", { name: "Settings", exact: true }).click();
      await page
        .getByRole("button", { name: "Save Settings", exact: true })
        .click();
      assert.deepEqual(
        (await data()).mistakePatterns,
        mastered.mistakePatterns,
      );
      await page
        .getByRole("button", {
          name: "Clear All Application Data",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Erase all app data", exact: true })
        .click();
      assert.deepEqual((await data()).reviewEvents ?? [], []);
      assert.deepEqual((await data()).mistakePatterns ?? [], []);
      assert.deepEqual(errors, []);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      results.push({
        viewport,
        regularPractice: "5 attempts, 80%",
        reviewEligibilityAndFiltering: "passed",
        savedSuccessAndReload: "passed",
        wrongResetsOriginal: "passed",
        consecutiveMastery: "3 correct after miss",
        newSessionReviewCount: 4,
        totalReviewJournal: 5,
        masteryReloadAndSettingsIdempotence: "passed",
        masteredReviewDisabledAndAgainOpensSetup: "passed",
        clearAllErasesReview: "passed",
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
