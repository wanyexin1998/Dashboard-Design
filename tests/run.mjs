#!/usr/bin/env node
// 一键验收：依次跑各套检查，逐项给出 ✓ / ✗，任一失败时退出码为 1。
//   node tests/run.mjs          常规验收（约 8–10 分钟）
//   node tests/run.mjs --full   另跑读数浮层扫动（约 17 分钟）与 6 倍降速开销测量
// 需要先 npm install（Playwright）；首次在新机器上还要 npx playwright install chromium。
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, PAGE } from './lib.mjs';

const full = process.argv.includes('--full');
const T = f => path.join(ROOT, 'tests', f);
const count = (s, re) => (s.match(re) || []).length;
const suites = [
  ['产物与源码一致', [path.join(ROOT, 'tools', 'build.mjs'), '--check'], s => /✓ chart-studies\.html 与源码一致/.test(s)],
  ['筛选 / 页签 / 表格交互断言 · 深色', [T('fint.mjs'), PAGE, 'dark'], s => /pass \d+ fail 0\b/.test(s) && /errors: none/.test(s)],
  ['筛选 / 页签 / 表格交互断言 · 浅色', [T('fint.mjs'), PAGE, 'light'], s => /pass \d+ fail 0\b/.test(s) && /errors: none/.test(s)],
  ['指标组件交互断言 · 深色', [T('kint.mjs'), PAGE, 'dark'], s => /pass \d+ fail 0\b/.test(s) && /errors: none/.test(s)],
  ['指标组件交互断言 · 浅色', [T('kint.mjs'), PAGE, 'light'], s => /pass \d+ fail 0\b/.test(s) && /errors: none/.test(s)],
  ['三档视口无横向溢出、控制台 0 报错', [T('qa.mjs'), PAGE, 'qa'], s => count(s, /cards 51 scrollWidth (\d+) viewport \1\b/g) === 3 && /errors: none/.test(s)],
  ['键盘焦点环（键盘有、指针无）', [T('kbd.mjs'), PAGE], s => count(s, /^PASS /gm) >= 12 && count(s, /^FAIL /gm) === 0],
  ['宿主 console 没有 assert 时 51 张卡照常建出', [T('noassert.mjs'), PAGE], s => /"cards":51,"empty":0/.test(s) && /errors: none/.test(s)],
  ['第一阶段收尾修复回归（地址后退、选择顺序、截至日、播报、胶囊…）', [T('regress.mjs'), PAGE], s => /pass \d+ fail 0\b/.test(s) && /errors: none/.test(s)],
  ['读数浮层：点击后移出 / 卡内空白持续移动都会关闭', [T('readout/loop2.mjs'), PAGE], s => /\bGREEN\b/.test(s)],
  ['读数浮层：触屏固定、点外关闭，窄屏停靠区保留读数', [T('readout/touch.mjs'), PAGE], s => /\bGREEN\b/.test(s)],
];
if (full) suites.push(
  ['读数浮层：扫动时面板始终跟到指针（全部卡片）', [T('readout/stutter.mjs'), PAGE], s => /\bGREEN\b/.test(s)],
  ['读数浮层：6 倍降速下每次移动 p95 ≤ 16ms', [T('readout/lag.mjs'), PAGE, '', '6'], s => /p95 > 16ms 的卡片： 0/.test(s)],
);

let failed = 0;
for (const [name, argv, ok] of suites) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const outText = (r.stdout || '') + (r.stderr || '');
  const pass = r.status === 0 && ok(outText);
  if (!pass) failed++;
  console.log(`${pass ? '✓' : '✗'} ${name}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (!pass) console.log(outText.trim().split('\n').slice(-15).map(l => '    ' + l).join('\n'));
}
console.log(failed ? `\n${failed} 项未通过` : '\n全部通过');
process.exit(failed ? 1 : 0);
