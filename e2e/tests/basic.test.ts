import { Page } from "playwright";

export function run(page: Page) {
  page.mouse.move(250, 265);
  page.mouse.down();
  page.mouse.move(250, 400);
}
