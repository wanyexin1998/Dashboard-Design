#!/usr/bin/env node
// 构建：src/page.html（页面模板）+ 指标模块 + 筛选 / 页签 / 表格模块 → chart-studies.html（仓库根目录，自包含）。
//   node tools/build.mjs              生成 chart-studies.html
//   node tools/build.mjs --artifact   另生成 dist/chart-widgets-demo.html（发布到 Claude Artifact 用的正文）
//   node tools/build.mjs --check      只检查：生成结果与仓库里的 chart-studies.html 是否一致（不写文件）
// 只依赖 Node 自带模块。所有输入统一按 LF 处理，Windows 上检出的 CRLF 不影响产物。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const read = p => readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const concat = (dir, names) => names.map(n => read(`src/${dir}/${n}`)).join('');

function syntax(code, name) {
  try { new vm.Script(code, { filename: name }); }
  catch (e) { console.error(`✗ 语法错误 ${name}: ${e.message}`); process.exit(1); }
}
// Replace whatever sits between a BEGIN / END marker pair with the payload (markers stay in the page).
function put(html, begin, end, payload) {
  const a = html.indexOf(begin), b = html.indexOf(end);
  if (a < 0 || b < a || html.indexOf(begin, a + 1) >= 0) { console.error(`✗ 模板里找不到唯一的标记 ${begin}`); process.exit(1); }
  return html.slice(0, a) + begin + '\n' + payload + '\n' + end + html.slice(b + end.length);
}

const kpiJs = concat('kpi', ['kpi1.js', 'kpi2.js', 'kpi3.js', 'kpi4.js', 'kpi5.js']);
const fttJs = concat('ftt', ['ftt0.js', 'ftt1.js', 'ftt2.js', 'ftt3.js', 'ftt4.js', 'ftt5.js']);
syntax(kpiJs, 'src/kpi/kpi1–5.js');
syntax(fttJs, 'src/ftt/ftt0–5.js');

let html = read('src/page.html');
html = put(html, '/* KPI:BEGIN */', '/* KPI:END */', read('src/kpi/kpi.css').trim());
html = put(html, '/* FTT:BEGIN */', '/* FTT:END */', read('src/ftt/ftt.css').trim());
html = put(html, '/* KPI-JS:BEGIN */', '/* KPI-JS:END */', kpiJs.trim());
html = put(html, '/* FTT-JS:BEGIN */', '/* FTT-JS:END */', fttJs.trim());

// Every inline script of the finished page must parse (the page template carries the charts, ChartKit and ChartInspector).
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => syntax(m[1], `chart-studies.html <script> #${i + 1}`));

const OUT = path.join(ROOT, 'chart-studies.html');
if (args.has('--check')) {
  const same = existsSync(OUT) && readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') === html;
  console.log(same ? '✓ chart-studies.html 与源码一致' : '✗ chart-studies.html 与源码不一致：请运行 node tools/build.mjs 并提交产物');
  process.exit(same ? 0 : 1);
}
writeFileSync(OUT, html, 'utf8');
console.log(`✓ chart-studies.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);

if (args.has('--artifact')) {
  // Artifact 正文：去掉 <html>/<head> 外壳（宿主会包一层），顶栏的 sticky 让出安全区。
  const pick = (re, what) => { const m = html.match(re); if (!m) { console.error('✗ 生成 Artifact 时找不到 ' + what); process.exit(1); } return m[1]; };
  const title = pick(/<title>([\s\S]*?)<\/title>/, '<title>');
  const style = pick(/<style>([\s\S]*?)<\/style>/, '<style>')
    .replace('.topbar{height:76px;position:sticky;top:0;', '.topbar{height:76px;position:sticky;top:env(safe-area-inset-top,0px);');
  const headJs = pick(/<\/style>(<script>try\{var t=localStorage[\s\S]*?<\/script>)/, '首帧主题脚本');
  const body = pick(/<body>([\s\S]*)<\/body>/, '<body>');
  const out = `<title>${title}</title>\n<style>${style}</style>${headJs}\n${body}\n`;
  mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  writeFileSync(path.join(ROOT, 'dist', 'chart-widgets-demo.html'), out, 'utf8');
  console.log(`✓ dist/chart-widgets-demo.html  ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB（发布时把 视频图表设计蒸馏.md 作为同目录附件）`);
}
