import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
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
const output = new URL(
  "../math-practice-app/output/playwright/phase-16-live/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chromium" });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("https://jnuso.github.io/CSE-4095/#/practice/setup");
      await page
        .getByRole("radio", { name: "5 questions", exact: true })
        .check();
      await page
        .getByRole("button", { name: "Start Session", exact: true })
        .click();
      const choices = page
        .getByRole("group", { name: "Answer choices", exact: true })
        .getByRole("button");
      await choices.first().focus();
      await page.keyboard.press("2");
      await expect(choices.nth(1)).toBeFocused();
      await expect(choices.nth(1)).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "Flip Card", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: /^Correct answer:/ }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: "I Got It Right", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: /= \?/ }),
      ).toHaveAccessibleDescription("Question 2 of 5");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await choices.first().click();
      await page
        .getByRole("button", { name: "Flip Card", exact: true })
        .click();
      assert.equal(
        await page
          .locator(".card-face")
          .evaluate((e) => getComputedStyle(e).animationName),
        "none",
      );
      await page.screenshot({
        path: fileURLToPath(new URL(`${width}-card.png`, output)),
        fullPage: true,
      });
      await page.getByRole("link", { name: "Settings", exact: true }).click();
      await page.addStyleTag({ content: ":root {font-size:32px!important}" });
      await page
        .getByRole("button", {
          name: "Clear All Application Data",
          exact: true,
        })
        .click();
      const keep = page.getByRole("button", {
        name: "Keep my data",
        exact: true,
      });
      await expect(keep).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "Erase all app data", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(keep).toBeFocused();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: fileURLToPath(new URL(`${width}-large-text-dialog.png`, output)),
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      assert.deepEqual(errors, []);
      console.log(
        JSON.stringify({
          width,
          shortcuts: true,
          focusProgress: true,
          reducedMotion: true,
          largeTextSimulation: true,
          dialogKeyboard: true,
          pageErrors: errors,
        }),
      );
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
