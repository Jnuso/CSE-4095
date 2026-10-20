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
  "../math-practice-app/output/playwright/phase-11-live/",
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
      await page.goto(`${address}#/settings`);
      await page
        .getByRole("button", { name: "Clear selection", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Save Settings", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("checkbox", { name: "Division", exact: true })
        .check();
      await page.getByRole("radio", { name: /^Advanced/ }).check();
      await page
        .getByRole("radio", { name: "5 questions", exact: true })
        .check();
      await page.getByRole("checkbox", { name: /^Card animation/ }).uncheck();
      await page
        .getByRole("checkbox", { name: /^Show explanations/ })
        .uncheck();
      await page
        .getByRole("button", { name: "Save Settings", exact: true })
        .click();
      await page
        .getByRole("status", { name: "Settings update" })
        .filter({ hasText: "Settings saved" })
        .waitFor();
      await page.reload();
      assert.equal(
        await page
          .getByRole("checkbox", { name: /^Card animation/ })
          .isChecked(),
        false,
      );
      assert.equal(
        await page
          .getByRole("checkbox", { name: /^Show explanations/ })
          .isChecked(),
        false,
      );
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-settings.png`, output)),
        fullPage: true,
      });
      await page.getByRole("link", { name: "Practice", exact: true }).click();
      assert.equal(
        await page
          .getByRole("checkbox", { name: "Division", exact: true })
          .isChecked(),
        true,
      );
      assert.equal(
        await page.getByRole("radio", { name: /^Advanced/ }).isChecked(),
        true,
      );
      assert.equal(
        await page
          .getByRole("radio", { name: "5 questions", exact: true })
          .isChecked(),
        true,
      );
      await page.getByRole("radio", { name: /^Beginner/ }).check();
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
        assert.equal(await page.locator(".answer-explanation").count(), 0);
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
      const read = () =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("mathPractice.data")),
        );
      const practiced = await read();
      assert.equal(practiced.records[0].session.difficulty, 1);
      assert.equal(practiced.settings.defaultDifficulty, 4);
      await page
        .getByRole("link", { name: "View Statistics", exact: true })
        .click();
      const overall = page.getByLabel("Overall results", { exact: true });
      assert.equal(
        await overall
          .getByText("Accuracy", { exact: true })
          .locator("..")
          .locator("dd")
          .innerText(),
        "60%",
      );
      await page.getByRole("link", { name: "Settings", exact: true }).click();
      await page
        .getByRole("button", {
          name: "Clear All Application Data",
          exact: true,
        })
        .click();
      await page.getByRole("dialog").waitFor();
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-clear-dialog.png`, output)),
        fullPage: false,
      });
      await page
        .getByRole("button", { name: "Keep my data", exact: true })
        .click();
      assert.deepEqual((await read()).records, practiced.records);
      await page
        .getByRole("button", {
          name: "Clear All Application Data",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Erase all app data", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "Big ideas start with small steps.",
          exact: true,
        })
        .waitFor();
      assert.equal(new URL(page.url()).hash, "#/");
      await page.reload();
      const cleared = await read();
      assert.deepEqual(cleared.records, []);
      assert.deepEqual(cleared.settings, {
        soundEffectsEnabled: false,
        cardAnimationEnabled: true,
        showExplanations: true,
        defaultSessionLength: 10,
        defaultDifficulty: 1,
        defaultOperations: ["addition"],
        masteryThreshold: 3,
      });
      assert.deepEqual(errors, []);
      results.push({
        viewport: name,
        settingsSaveReload: "passed",
        defaultsAndSessionOverride: "passed",
        hiddenExplanations: "passed",
        statistics: "5 attempted, 3 right, 2 wrong, 60%",
        clearCancelConfirmHomeReloadDefaults: "passed",
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
