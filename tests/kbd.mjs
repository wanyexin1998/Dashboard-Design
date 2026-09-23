// Keyboard users must still get focus rings; pointer users must not.
import { chromium } from 'playwright';
import { PAGE, url, out } from './lib.mjs';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});p.setDefaultTimeout(4000);
await p.goto(url(process.argv[2]||PAGE));await p.waitForTimeout(600);
await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
const ring=()=>p.evaluate(()=>{const a=document.activeElement;if(!a||a===document.body)return 'body';const cs=getComputedStyle(a);const c=(a.className&&a.className.baseVal!==undefined?a.className.baseVal:a.className)||'';return `${a.tagName.toLowerCase()}.${String(c).split(' ')[0]} outline=${cs.outlineStyle} ${cs.outlineWidth} filter=${cs.filter} input=${document.documentElement.dataset.input||'-'}`;});
const res=[];const ok=(c,n,i)=>res.push((c?'PASS ':'FAIL ')+n+' → '+i);
const go=async id=>{await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},id);await p.waitForTimeout(900);};
// 1 Tab from the top of the page lands on a control with a ring
await p.keyboard.press('Tab');await p.keyboard.press('Tab');let r=await ring();ok(/outline=solid 2px/.test(r),'纯键盘 Tab：有焦点环',r);
// 2 click a chip → no ring; arrow key → ring
await go('flt_quick');await p.locator('#flt_quick .fk-chip',{hasText:'近 7 天'}).click();await p.waitForTimeout(150);r=await ring();ok(/outline=none/.test(r),'F01 鼠标点快捷项：无焦点环',r);
await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);r=await ring();ok(/outline=solid 2px/.test(r),'F01 接着按 →：焦点环出现',r);
// 3 click option in F03 → focus returns to combobox without a ring; ArrowDown → ring
await go('flt_single');await p.locator('#flt_single [data-k="combo"]').click();await p.waitForTimeout(150);await p.locator('#flt_single .fk-opt').nth(2).click();await p.waitForTimeout(200);r=await ring();ok(/outline=none/.test(r)&&/fk-field/.test(r),'F03 鼠标选完选项：焦点回到下拉框但无焦点环',r);
await p.keyboard.press('Escape');await p.waitForTimeout(100);r=await ring();ok(/outline=solid 2px/.test(r),'F03 接着按键：焦点环出现',r);
// 4 focus timeline: click → no dashed frame; arrow → frame
await go('focus');const fs=p.locator('#focus svg.focus-svg');const bb=await fs.boundingBox();await p.mouse.click(bb.x+bb.width*.6,bb.y+bb.height*.6);await p.waitForTimeout(200);r=await ring();ok(/outline=none/.test(r),'专注分段图 点击 / 拖动：无虚线框',r);
await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);r=await ring();ok(!/outline=none/.test(r),'专注分段图 接着按 →：焦点框出现',r);
// 5 goal: click → no handle ring; ArrowUp → handle ring (keyboard-focus)
await go('goal');const gl=p.locator('#goal .goal-control');const gb=await gl.boundingBox();await p.mouse.click(gb.x+gb.width*.5,gb.y+gb.height*.5);await p.waitForTimeout(200);
let hr=await p.evaluate(()=>{const c=document.querySelector('#goal .goal-control');const h=c.querySelector(':scope>circle');return c.classList.contains('keyboard-focus')+' '+getComputedStyle(h).strokeWidth;});ok(/^false/.test(hr),'目标线 点击：把手无焦点环',hr);
await p.keyboard.press('ArrowUp');await p.waitForTimeout(200);hr=await p.evaluate(()=>{const c=document.querySelector('#goal .goal-control');const h=c.querySelector(':scope>circle');return c.classList.contains('keyboard-focus')+' '+getComputedStyle(h).strokeWidth;});ok(/^true 3/.test(hr),'目标线 接着按 ↑：把手焦点环出现',hr);
// 6 table sort by mouse → focus stays on sort button without ring
await go('tbl_detail');await p.locator('#tbl_detail .tb-sort[data-col="rev"]').click();await p.waitForTimeout(500);r=await ring();ok(/tb-sort/.test(r)&&/outline=none/.test(r),'B01 鼠标排序：焦点留在表头但无焦点环',r);
// 7 B05 expand by mouse → no ring on the re-rendered button
await go('tbl_group');await p.locator('#tbl_group tr.grp[data-key="north"] .tb-exp').click();await p.waitForTimeout(300);r=await ring();ok(/tb-exp/.test(r)&&/outline=none/.test(r),'B05 鼠标展开：无焦点环',r);
// 8 T08 new view by mouse → focus on new tab without ring
await go('tab_dyn');await p.locator('#tab_dyn [data-k="add"]').click();await p.waitForTimeout(600);r=await ring();ok(/tk-tab/.test(r)&&/outline=none/.test(r),'T08 鼠标新建视图：焦点到新页签但无焦点环',r);
console.log(res.join('\n'));await b.close();
