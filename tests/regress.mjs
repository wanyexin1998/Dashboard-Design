// 第一阶段收尾对齐时修的页面问题，逐条回归（2026-09-23，见设计文档 §8.34）。
//   node tests/regress.mjs [page.html]
import { chromium } from 'playwright';
import { PAGE, url } from './lib.mjs';
const FILE = process.argv[2] || PAGE;
const b = await chromium.launch();
const errors = []; let pass = 0, fail = 0; const fails = [];
const ok = (cond, name, info = '') => { if (cond) pass++; else { fail++; fails.push(name + (info ? ' → ' + info : '')); } };
async function sec(name, fn) { try { await fn(); } catch (e) { fail++; fails.push(name + ' 崩溃: ' + String(e.message).split('\n')[0]); } }
async function fresh(hash = '', viewport = { width: 1320, height: 1000 }) {
  const p = await b.newPage({ viewport }); p.setDefaultTimeout(4000);
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`[${m.type()}] ${m.text()}`); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.goto(url(FILE) + hash); await p.waitForTimeout(600);
  await p.addStyleTag({ content: 'html,body{scroll-behavior:auto!important}' });
  return p;
}
const go = async (p, id) => { await p.locator('#' + id).scrollIntoViewIfNeeded(); await p.waitForTimeout(300); };
const txt = async (p, sel) => (await p.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim();
const live = (p, id) => p.evaluate(id => document.querySelector(`#${id} .chart-host > .sr-only[role="status"]`)?.textContent || '', id);

// P1 · back / forward to the all-default step restores the defaults
await sec('P1 地址后退', async () => {
  const p = await fresh(); await go(p, 'flt_quick');
  await p.locator('#flt_quick .fk-chip', { hasText: '近 7 天' }).click(); await p.waitForTimeout(200);
  ok((await p.evaluate(() => location.hash)).includes('f01=d7'), 'P1 选择后写入地址');
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => location.hash) === '', 'P1 后退后地址无哈希');
  ok(await p.locator('#flt_quick .fk-chip', { hasText: '本月' }).getAttribute('aria-checked') === 'true', 'P1 后退到全默认的一步：F01 回到本月',
     await p.locator('#flt_quick .fk-chip[aria-checked="true"]').innerText());
  await p.goForward(); await p.waitForTimeout(300);
  ok(await p.locator('#flt_quick .fk-chip', { hasText: '近 7 天' }).getAttribute('aria-checked') === 'true', 'P1 前进恢复近 7 天');
  await p.evaluate(() => { location.hash = 'tokens'; }); await p.waitForTimeout(200);
  ok(await p.locator('#flt_quick .fk-chip', { hasText: '近 7 天' }).getAttribute('aria-checked') === 'true', 'P1 普通锚点不影响状态');
  await p.close();
});

// P2 · F05 / F06 / F08 selections are compared and written in one fixed order
await sec('P2 选择顺序', async () => {
  const p = await fresh(); await go(p, 'flt_cascade');
  await p.locator('#flt_cascade [data-k="trig"]').click(); await p.waitForTimeout(150);
  const leaf = p.locator('#flt_cascade .col[data-level="2"] .fk-opt[data-key="east.js.nj.gl"]');
  await leaf.click(); await p.waitForTimeout(100); await p.locator('#flt_cascade .col[data-level="2"] .fk-opt[data-key="east.js.nj.gl"]').click(); await p.waitForTimeout(150);
  ok(!(await p.evaluate(() => location.hash)).includes('f05'), 'P2 F05 取消再勾回默认项不写地址', await p.evaluate(() => decodeURIComponent(location.hash)));
  await p.keyboard.press('Escape');
  await go(p, 'flt_facet');
  const chip = n => p.locator('#flt_facet [data-k="ch"] .fk-chip', { hasText: n });
  await chip('电商').click(); await chip('直营').click(); await p.waitForTimeout(150);
  const h1 = await p.evaluate(() => decodeURIComponent(location.hash));
  await chip('电商').click(); await chip('直营').click(); await p.waitForTimeout(100);
  await chip('直营').click(); await chip('电商').click(); await p.waitForTimeout(150);
  const h2 = await p.evaluate(() => decodeURIComponent(location.hash));
  ok(h1.includes('f06=direct,online~repeat') && h1 === h2, 'P2 F06 两种点击顺序写出同一个地址', `${h1} | ${h2}`);
  await go(p, 'flt_drawer');
  await p.locator('#flt_drawer [data-k="open"]').click(); await p.waitForTimeout(200);
  const reg = n => p.locator('#flt_drawer [data-k="d-reg"] .fk-chip', { hasText: n });
  await reg('华东').click(); await reg('华东').click(); await p.waitForTimeout(150);
  ok((await txt(p, '#flt_drawer [data-k="pending"]')).includes('没有未应用的改动'), 'P2 F08 取消再选回华东不算改动', await txt(p, '#flt_drawer [data-k="pending"]'));
  await p.keyboard.press('Escape'); await p.close();
});

// P3 · a shared link with an earlier as-of date: K04 / K05 follow on load
await sec('P3 截至日链接', async () => {
  const p = await fresh('#!asof=0914'); await go(p, 'kpi_target'); await p.waitForTimeout(900);
  ok((await txt(p, '#kpi_target [data-k="span"]')).includes('9/1–9/14'), 'P3 K04 打开即按 9/14', await txt(p, '#kpi_target [data-k="span"]'));
  const rate = await txt(p, '#kpi_target [data-k="rate"]');
  ok(rate !== '71.5%', 'P3 K04 达成率随截至日变化', rate);
  // P4 · F01 / F02 calendars follow the as-of date both ways
  await p.locator('#asof-pill button').click(); await p.waitForTimeout(300);
  await go(p, 'flt_range'); await p.locator('#flt_range [data-k="trig"]').click(); await p.waitForTimeout(200);
  ok(await p.locator('#flt_range td[data-k="2026-09-20"]').getAttribute('aria-disabled') === null, 'P4 回到最新后 F02 可选 9/20');
  await p.keyboard.press('Escape'); await p.close();
  const q = await fresh(); await go(q, 'flt_panel');
  await q.locator('#flt_panel td[data-k="2026-09-14"]').click(); await q.locator('#flt_panel [data-k="asof"]').click(); await q.waitForTimeout(300);
  // P11 · the copy says what really follows the as-of date
  ok((await live(q, 'flt_panel')).includes('筛选、页签、表格与 K04、K05 已按该日重算'), 'P11 设截至日的播报', await live(q, 'flt_panel'));
  ok(await q.evaluate(() => document.querySelector('#flt_panel').textContent.includes('让筛选、页签、表格与 K04、K05 按该日重算')), 'P11 F11 说明文字');
  await go(q, 'flt_range'); await q.locator('#flt_range [data-k="trig"]').click(); await q.waitForTimeout(200);
  ok(await q.locator('#flt_range td[data-k="2026-09-20"]').getAttribute('aria-disabled') === 'true', 'P4 截至日设为 9/14 后 F02 不能选 9/20');
  // P8 · month change from ‹ is announced through the readout live region
  await q.locator('#flt_range .fk-cal-nav[data-nav="-1"]').first().click(); await q.waitForTimeout(150);
  ok((await live(q, 'flt_range')).includes('2026 年 8 月'), 'P8 换月经读数层播报', await live(q, 'flt_range'));
  await q.keyboard.press('Escape'); await q.close();
});

// P5 · T05: after 「标记已处理」 focus stays at the same position in the list
await sec('P5 T05 焦点', async () => {
  const p = await fresh(); await go(p, 'tab_badge');
  const btns = p.locator('#tab_badge [role="tabpanel"]:not([hidden]) [data-a="done"]');
  const n0 = await btns.count(); const third = await btns.nth(2).getAttribute('data-id');
  await btns.nth(2).click(); await p.waitForTimeout(200);
  const f = await p.evaluate(() => ({ id: document.activeElement?.dataset.id, a: document.activeElement?.dataset.a }));
  const expect = await p.locator('#tab_badge [role="tabpanel"]:not([hidden]) [data-a="done"]').nth(2).getAttribute('data-id');
  ok(n0 >= 4 && f.a === 'done' && f.id === expect && f.id !== third, 'P5 焦点落到同一位置的下一条', JSON.stringify({ n0, f, expect }));
  await p.close();
});

// P6 · ticking rows is announced
await sec('P6 勾选播报', async () => {
  const p = await fresh(); await go(p, 'tbl_detail');
  await p.locator('#tbl_detail .g-act [data-choice="select"]').click(); await p.locator('#tbl_detail tbody tr[data-key="south"]').click(); await p.waitForTimeout(150);
  ok((await live(p, 'tbl_detail')).includes('已选 1 行'), 'P6 勾选一行播报', await live(p, 'tbl_detail'));
  await p.locator('#tbl_detail tbody tr[data-key="south"]').click(); await p.waitForTimeout(150);
  ok((await live(p, 'tbl_detail')).includes('已取消全部选择'), 'P6 取消后播报', await live(p, 'tbl_detail'));
  await p.close();
});

// P7 · K04 / K06 chips are updated in place (so their colour transition plays)
await sec('P7 胶囊', async () => {
  const p = await fresh(); await go(p, 'kpi_target'); await p.waitForTimeout(900);
  await p.evaluate(() => { window.__k04 = document.querySelector('#kpi_target .kpi-chip'); window.__k06 = document.querySelector('#kpi_status [data-k="chip"] .kpi-chip'); });
  await p.click('#kpi_target [data-choice="year"]'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.__k04?.isConnected && window.__k04.textContent.includes('超前')), 'P7 K04 胶囊原位换档');
  await go(p, 'kpi_status'); await p.click('#kpi_status [data-choice="last"]'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.__k06?.isConnected && window.__k06.classList.contains('bad')), 'P7 K06 胶囊原位换档');
  await p.close();
});

// P9 · the area chart keeps the readout layer's key hint after its entrance replay
await sec('P9 面积图读屏提示', async () => {
  const p = await fresh(); await go(p, 'range'); await p.waitForTimeout(1500);
  const label = await p.locator('#range svg[data-metric-probe]').getAttribute('aria-label');
  ok(label.endsWith('；左右方向键选择采样点') && label.split('左右方向键').length === 2, 'P9 aria-label 保留一次按键提示', label);
  await p.close();
});

// P10 · P12 · P13 · head description, F07 tooltip, calendar header contrast
await sec('P10 P12 P13', async () => {
  const p = await fresh();
  ok((await p.getAttribute('meta[name="description"]', 'content')).startsWith('51 种可交互组件'), 'P10 description');
  await go(p, 'flt_applied');
  const add = p.locator('#flt_applied [data-k="add"]');
  ok(await add.isDisabled() && await add.getAttribute('title') === '示例条件都已加上', 'P12 F07 禁用时有悬浮说明', String(await add.getAttribute('title')));
  const c = await p.evaluate(() => { const th = document.querySelector('#flt_panel .fk-cal-grid th.we'), s = getComputedStyle(document.querySelector('#flt_panel')); return th ? [getComputedStyle(th).color, s.getPropertyValue('--c-text-4').trim()] : null; });
  const hex = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255})`; };
  ok(c && c[0] === hex(c[1]), 'P13 周末表头用 --c-text-4', JSON.stringify(c));
  await p.close();
});

// P14 · B05 / B06 scroll boxes become named regions only while they overflow
await sec('P14 表格滚动区', async () => {
  const wide = await fresh();
  ok(await wide.evaluate(() => ['tbl_group', 'tbl_expand'].every(id => !document.querySelector(`#${id} .tb-wrap`).hasAttribute('role'))), 'P14 1320 宽不溢出时不是 region');
  await wide.close();
  const p = await fresh('', { width: 390, height: 844 }); await go(p, 'tbl_group'); await go(p, 'tbl_expand');
  const r = await p.evaluate(() => ['tbl_group', 'tbl_expand'].map(id => { const w = document.querySelector(`#${id} .tb-wrap`); return [w.scrollWidth > w.clientWidth + 1, w.getAttribute('role'), w.getAttribute('tabindex'), !!document.getElementById(w.getAttribute('aria-labelledby') || '-')]; }));
  ok(r.every(x => !x[0] || (x[1] === 'region' && x[2] === '0' && x[3])), 'P14 390 宽溢出时成为有名称的 region', JSON.stringify(r));
  await p.close();
});

console.log(`pass ${pass} fail ${fail}`); fails.forEach(f => console.log('  ✗ ' + f));
console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
await b.close();
