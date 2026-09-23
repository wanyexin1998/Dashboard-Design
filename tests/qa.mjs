import { chromium } from 'playwright';
import { PAGE, url, out } from './lib.mjs';
const SP = out('qa');
const FILE = process.argv[2] || PAGE;
const TAG = process.argv[3] || 'qa';
const THEME = process.argv[4] || '';
const browser = await chromium.launch();
const errors = [];
async function run(width, height, name, interact, opts = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, ...opts });
  if (THEME) await page.addInitScript(t => { try { localStorage.setItem('chart-studies-theme', t); } catch (e) {} }, THEME);
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_')) errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(url(FILE));
  await page.waitForTimeout(400);
  const cards = await page.$$('.specimen');
  for (const c of cards) { await c.scrollIntoViewIfNeeded(); await page.waitForTimeout(80); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(2200);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(name, 'cards', cards.length, 'scrollWidth', sw, 'viewport', width);
  await page.screenshot({ path: `${SP}/${TAG}_${name}_full.png`, fullPage: true });
  if (interact) await interact(page, cards);
  await page.close();
}
await run(1320, 900, 'desktop', async (page, cards) => {
  const shot = async (i, n) => { await cards[i].scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await cards[i].screenshot({ path: `${SP}/${TAG}_d_${n}.png` }); };
  // hover a ring → floating inspector
  { const el = (await cards[0].$$('svg circle[stroke="transparent"]'))[0]; const b = await el.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + 8); await page.waitForTimeout(300); await page.screenshot({ path: `${SP}/${TAG}_d_rings_hover.png`, clip: { x: 0, y: Math.max(0, b.y - 200), width: 1320, height: 520 } }); }
  // bars: click month, click a bar
  { await cards[3].scrollIntoViewIfNeeded(); await (await cards[3].$('[data-range="month"]')).click(); await page.waitForTimeout(800); const g = (await cards[3].$$('.bbar'))[9]; await g.click(); await page.waitForTimeout(300); await shot(3, 'bars_month_sel'); }
  // focus: keyboard scrub
  { await cards[4].scrollIntoViewIfNeeded(); const svg = await cards[4].$('svg.focus-svg'); await svg.focus(); await page.keyboard.press('Shift+ArrowLeft'); await page.keyboard.press('Shift+ArrowLeft'); await page.waitForTimeout(300); await shot(4, 'focus_key'); }
  // goal: drag handle
  { await cards[6].scrollIntoViewIfNeeded(); const c = await cards[6].$('.goal-control circle'); const b = await c.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 - 40, { steps: 8 }); await page.waitForTimeout(250); await shot(6, 'goal_drag'); await page.mouse.up(); }
  // share: click legend
  { await cards[8].scrollIntoViewIfNeeded(); const lg = (await cards[8].$$('.demo-c-legend'))[1]; await lg.click(); await page.waitForTimeout(500); await shot(8, 'share_sel'); }
  // bubble: click Walk
  { await cards[9].scrollIntoViewIfNeeded(); const g = (await cards[9].$$('.demo-c-target'))[0]; await g.click(); await page.waitForTimeout(1700); await shot(9, 'bubble_focus'); }
  // line: smooth + select
  { await cards[10].scrollIntoViewIfNeeded(); await (await cards[10].$('[data-choice="smooth"]')).click(); await page.waitForTimeout(800); const g = (await cards[10].$$('.ext-action'))[5]; await g.click(); await page.waitForTimeout(300); await shot(10, 'line_smooth_sel'); }
  // combo: hover a month
  { await cards[11].scrollIntoViewIfNeeded(); const g = (await cards[11].$$('.ext-action'))[2]; const b = await g.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(350); await page.screenshot({ path: `${SP}/${TAG}_d_combo_hover.png`, clip: { x: 0, y: Math.max(0, b.y - 260), width: 1320, height: 520 } }); await page.mouse.move(5, 5); }
  // waterfall: plan
  { await cards[12].scrollIntoViewIfNeeded(); await (await cards[12].$('[data-choice="plan"]')).click(); await page.waitForTimeout(900); await shot(12, 'waterfall_plan'); }
  // matrix: q2 + select
  { await cards[13].scrollIntoViewIfNeeded(); await (await cards[13].$('[data-choice="q2"]')).click(); await page.waitForTimeout(950); const g = (await cards[13].$$('.ext-action'))[1]; await g.click(); await page.waitForTimeout(300); await shot(13, 'matrix_q2_sel'); }
  // tree: vertical + collapse
  { await cards[14].scrollIntoViewIfNeeded(); await (await cards[14].$('[data-choice="vertical"]')).click(); await page.waitForTimeout(800); const g = (await cards[14].$$('.ext-action'))[1]; await g.click(); await page.waitForTimeout(500); await shot(14, 'tree_vertical_collapsed'); }
  // filter
  { await page.evaluate(() => window.scrollTo(0, 0)); await (await page.$('[data-filter="structure"]')).click(); await page.waitForTimeout(400); await page.screenshot({ path: `${SP}/${TAG}_d_filter_structure.png`, fullPage: true }); await (await page.$('[data-filter="all"]')).click(); }
});
await run(800, 900, 'tablet');
await run(390, 844, 'phone', async (page, cards) => {
  // tap a bar → dock
  await cards[3].scrollIntoViewIfNeeded(); const g = (await cards[3].$$('.bbar'))[3]; await g.tap(); await page.waitForTimeout(400); await cards[3].screenshot({ path: `${SP}/${TAG}_p_bars_dock.png` });
  await cards[9].scrollIntoViewIfNeeded(); await cards[9].screenshot({ path: `${SP}/${TAG}_p_bubble.png` });
  await cards[14].scrollIntoViewIfNeeded(); await cards[14].screenshot({ path: `${SP}/${TAG}_p_tree.png` });
}, { hasTouch: true, isMobile: true });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
