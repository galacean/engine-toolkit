import path from "path";
import { createServer } from "vite";
import playwright from "playwright";
import fs from "fs";

const browser = await playwright.chromium.launch({
  headless: false
});

async function runTests() {
  const server = await createServer({
    root: path.join(process.cwd())
  });
  await server.listen();
  server.printUrls();

  const page = await browser.newPage();
  page.setViewportSize({ width: 500, height: 500 });

  const pages = fs.readdirSync(path.join(__dirname, "pages"));
  for (let i = 0; i < pages.length; i++) {
    const pageName = path.basename(pages[i], ".html");
    await page.goto(`http://localhost:1237/pages/${pageName}.html`);
    if (fs.existsSync(path.join(__dirname, "tests", `${pageName}.ts`))) {
      const { run } = await import(`./tests/${pageName}.test`);
      if (run) run(page);
    }
  }

  browser.close()
  server.close()
}

runTests();
