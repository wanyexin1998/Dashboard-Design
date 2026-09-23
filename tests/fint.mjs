import { chromium } from 'playwright';
import { PAGE, url, out } from './lib.mjs';
const FILE=process.argv[2]||PAGE,THEME=process.argv[3]||'dark';
const b=await chromium.launch();
const errors=[];let pass=0,fail=0;const fails=[];
async function sec(name,fn){try{await fn();}catch(e){fail++;fails.push(name+' 崩溃: '+String(e.message).split('\n')[0]);}}
function ok(cond,name,info=''){if(cond){pass++;}else{fail++;fails.push(name+(info?' → '+info:''));}}
async function fresh(hash=''){const page=await b.newPage({viewport:{width:1320,height:1000}});page.setDefaultTimeout(4000);
  page.on('console',m=>{if(['error','warning','assert'].includes(m.type()))errors.push(`[${m.type()}] ${m.text()}`);});page.on('pageerror',e=>errors.push('pageerror: '+e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
  await page.addInitScript(t=>{try{localStorage.setItem('chart-studies-theme',t);}catch(e){}},THEME);
  await page.goto(url(FILE)+hash);await page.waitForTimeout(500);return page;}
const txt=async(p,sel)=>(await p.locator(sel).first().innerText()).replace(/\s+/g,' ').trim();
const hash=p=>p.evaluate(()=>decodeURIComponent(location.hash));
let p=await fresh();
const go=async id=>{await p.locator('#'+id).scrollIntoViewIfNeeded();await p.waitForTimeout(250);};
await sec('F01',async()=>{
await go('flt_quick');
await p.locator('#flt_quick .fk-chip',{hasText:'近 7 天'}).click();await p.waitForTimeout(150);
ok((await txt(p,'#flt_quick [data-k="span"]')).includes('9/17 – 9/23'),'F01 近7天区间',await txt(p,'#flt_quick [data-k="span"]'));
ok((await hash(p)).includes('f01=d7'),'F01 写进 hash',await hash(p));
await p.locator('#flt_quick .fk-chip',{hasText:'今日'}).click();await p.waitForTimeout(150);
ok(await p.locator('#flt_quick [data-k="empty"]').isVisible()&&!(await p.locator('#flt_quick [data-k="data"]').isVisible()),'F01 今日空态');
await p.locator('#flt_quick .fk-chip',{hasText:'今日'}).focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(120);
ok(await p.locator('#flt_quick .fk-chip',{hasText:'昨日'}).getAttribute('aria-checked')==='true','F01 方向键移动即选中');
// custom range via calendar keyboard
await p.locator('#flt_quick [data-k="custom"]').click();await p.waitForTimeout(200);
ok(await p.locator('#flt_quick [data-k="pop"]').isVisible(),'F01 自定义弹层打开');
await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');await p.keyboard.press('Enter');await p.keyboard.press('ArrowLeft');await p.keyboard.press('Enter');await p.waitForTimeout(100);
ok(!(await p.locator('#flt_quick [data-k="ok"]').isDisabled()),'F01 选完起止后确定可用',await txt(p,'#flt_quick [data-k="picked"]'));
await p.locator('#flt_quick [data-k="ok"]').click();await p.waitForTimeout(150);
ok((await txt(p,'#flt_quick [data-k="custom"]')).includes('9/19 – 9/20'),'F01 自定义区间回写',await txt(p,'#flt_quick [data-k="custom"]'));
ok(await p.evaluate(()=>document.activeElement?.dataset.k==='custom'),'F01 关闭后焦点回到触发器');
});
await sec('F02',async()=>{
await go('flt_range');
await p.locator('#flt_range [data-k="trig"]').click();await p.waitForTimeout(150);
await p.locator('#flt_range [data-p="d7"]').click();await p.locator('#flt_range [data-k="ok"]').click();await p.waitForTimeout(200);
ok((await txt(p,'#flt_range [data-k="tv"]')).includes('9/16 – 9/22'),'F02 预设近7天',await txt(p,'#flt_range [data-k="tv"]'));
ok((await txt(p,'#flt_range [data-k="d-rev"]')).includes('%'),'F02 对比期变化');
await p.locator('#flt_range [data-k="trig"]').click();await p.locator('#flt_range [data-p="last"]').click();await p.locator('#flt_range [data-k="ok"]').click();await p.waitForTimeout(200);
ok((await txt(p,'#flt_range [data-k="d-rev"]')).includes('无逐日数据'),'F02 上月对比 7 月写原因',await txt(p,'#flt_range [data-k="d-rev"]'));
await p.locator('#flt_range [data-k="trig"]').click();await p.keyboard.press('Escape');await p.waitForTimeout(100);
ok(await p.locator('#flt_range [data-k="pop"]').isHidden()&&await p.evaluate(()=>document.activeElement?.dataset.k==='trig'),'F02 Esc 关闭并回焦');
});
await sec('F03',async()=>{
await go('flt_single');
await p.locator('#flt_single [data-k="combo"]').focus();await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(900);
ok((await txt(p,'#flt_single [data-k="val"]'))==='直营','F03 键盘选择',await txt(p,'#flt_single [data-k="val"]'));
ok((await txt(p,'#flt_single [data-k="v"]')).includes('556.1'),'F03 结果随选择',await txt(p,'#flt_single [data-k="v"]'));
ok(await p.locator('#flt_single [data-k="list"]').isHidden(),'F03 选后关闭');
});
await sec('F04',async()=>{
await go('flt_multi');
await p.locator('#flt_multi .fk-field').click();await p.keyboard.type('华中');await p.keyboard.press('Enter');await p.waitForTimeout(150);
ok((await txt(p,'#flt_multi [data-k="selcount"]')).includes('4 / 6'),'F04 搜索后 Enter 勾选',await txt(p,'#flt_multi [data-k="selcount"]'));
await p.locator('#flt_multi .fk-all').click();await p.waitForTimeout(100);
ok((await txt(p,'#flt_multi [data-k="selcount"]')).includes('6 / 6'),'F04 全选');
ok(await p.locator('#flt_multi .fk-all').getAttribute('aria-checked')==='true','F04 全选 aria-checked');
await p.keyboard.press('Escape');await p.waitForTimeout(80);
});
await sec('F05',async()=>{
await go('flt_cascade');
await p.locator('#flt_cascade [data-k="trig"]').click();await p.waitForTimeout(120);
await p.locator('#flt_cascade .fk-opt',{hasText:'江苏'}).click();await p.locator('#flt_cascade .fk-opt',{hasText:'徐州'}).click();await p.locator('#flt_cascade .col[data-level="2"] .fk-opt',{hasText:'鼓楼'}).click();await p.waitForTimeout(120);
ok((await txt(p,'#flt_cascade [data-k="count"]')).includes('3'),'F05 全路径多选',await txt(p,'#flt_cascade [data-k="count"]'));
ok((await txt(p,'#flt_cascade [data-k="dup"]')).includes('徐州'),'F05 重名说明');
await p.keyboard.press('Escape');
});
await sec('F06',async()=>{
await go('flt_facet');
await p.locator('#flt_facet [data-k="ch"] .fk-chip',{hasText:'直营'}).click();await p.waitForTimeout(120);
ok((await p.locator('#flt_facet .fk-mx .c.on').count())===1,'F06 交集命中一格');
ok((await txt(p,'#flt_facet [data-k="rev"]')).includes('358.1'),'F06 交集值',await txt(p,'#flt_facet [data-k="rev"]'));
});
await sec('F07',async()=>{
await go('flt_applied');
const steps0=await p.locator('#flt_applied .fk-step').count();
await p.locator('#flt_applied .fk-tag[data-id="channel"] .x').focus();await p.keyboard.press('Enter');await p.waitForTimeout(150);
ok((await p.locator('#flt_applied .fk-step').count())===steps0-1,'F07 删除条件');
ok(await p.evaluate(()=>document.activeElement?.closest('.fk-tag')?.dataset.id==='link'),'F07 删除后焦点到下一个 chip');
await p.locator('#flt_applied [data-k="add"]').click();await p.locator('#flt_applied [data-k="addlist"] [data-id="channel"]').click();await p.waitForTimeout(120);
ok((await p.locator('#flt_applied .fk-step').count())===steps0,'F07 加回条件');
});
await sec('F08',async()=>{
await go('flt_drawer');
await p.locator('#flt_drawer [data-k="open"]').click();await p.waitForTimeout(150);
ok(await p.locator('#flt_drawer .fk-drawer').isVisible()&&await p.evaluate(()=>!!document.activeElement?.closest('.fk-drawer')),'F08 抽屉打开，焦点进入');
await p.keyboard.press('Escape');await p.waitForTimeout(120);
ok(await p.locator('#flt_drawer .fk-drawer').isHidden()&&await p.evaluate(()=>document.activeElement?.dataset.k==='open'),'F08 Esc 关闭回焦');
await p.locator('#flt_drawer [data-k="open"]').click();await p.locator('#flt_drawer [data-k="d-gr"] .fk-chip',{hasText:'下降'}).click();await p.waitForTimeout(80);
ok((await txt(p,'#flt_drawer [data-k="pending"]')).includes('1 项未应用'),'F08 未应用计数',await txt(p,'#flt_drawer [data-k="pending"]'));
await p.locator('#flt_drawer [data-k="apply"]').click();await p.waitForTimeout(200);
ok(await p.locator('#flt_drawer .tb-layer[data-layer="empty"]').isVisible(),'F08 应用后空结果');
await p.locator('#flt_drawer .tb-exits button',{hasText:'清空全部'}).click();await p.waitForTimeout(200);
ok((await p.locator('#flt_drawer tbody tr').count())===15,'F08 空态出路：清空全部',String(await p.locator('#flt_drawer tbody tr').count()));
});
await sec('F09',async()=>{
await go('flt_link');
await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="east"]').click();await p.waitForTimeout(250);
ok((await txt(p,'#flt_link [data-k="chips"]')).includes('来自 区域营收'),'F09 单击即联动：来源 chip');
ok((await p.locator('#flt_link [data-k="b"] .fk-hbar[data-id="direct"] .v').innerText())==='186.4','F09 渠道图按联动重算',await p.locator('#flt_link [data-k="b"] .fk-hbar[data-id="direct"] .v').innerText());
ok(await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="east"]').getAttribute('aria-pressed')==='true','F09 来源图高亮被点项');
ok((await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="south"] .v').innerText())==='298.3','F09 来源图不被自己过滤');
await p.locator('#flt_link [data-k="b"] .fk-hbar[data-id="online"]').click();await p.waitForTimeout(200);
ok((await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="south"] .v').innerText())==='71.4','F09 两个来源取交集',await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="south"] .v').innerText());
await p.locator('#flt_link [data-k="sw"]').click();await p.waitForTimeout(150);
ok((await p.locator('#flt_link .fk-tag.dash').count())===0,'F09 关闭开关清除联动');
await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="south"]').click();await p.waitForTimeout(150);
ok((await p.locator('#flt_link .fk-tag.dash').count())===0&&(await p.locator('#flt_link [data-k="b"] .fk-hbar[data-id="direct"] .v').innerText())==='556.1','F09 关闭后单击只选中');
await p.locator('#flt_link [data-k="sw"]').click();await p.locator('#flt_link [data-k="a"] .fk-hbar[data-id="north"]').click();await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.waitForTimeout(150);
ok((await p.locator('#flt_link .fk-tag.dash').count())===0,'F09 Esc 清除联动');
});
await sec('F10',async()=>{
await go('flt_result');
await p.locator('#flt_result [data-k="reg"] .fk-chip',{hasText:'华中'}).click();await p.waitForTimeout(150);
ok(await p.locator('#flt_result [data-k="empty"]').isVisible(),'F10 空结果');
await p.locator('#flt_result [data-k="exits"] button').first().click();await p.waitForTimeout(150);
ok(await p.locator('#flt_result [data-k="empty"]').isHidden()&&(await p.locator('#flt_result .fk-strip .hit').count())>0,'F10 出路：放宽阈值');
});
await sec('F11 + page as-of',async()=>{
await go('flt_panel');
await p.locator('#flt_panel td[data-k="2026-09-14"]').click();await p.waitForTimeout(120);
ok((await txt(p,'#flt_panel [data-k="rt"]')).includes('9 月 14 日'),'F11 选中日读数');
await p.locator('#flt_panel [data-k="asof"]').click();await p.waitForTimeout(400);
ok((await txt(p,'#asof-pill')).includes('9/14'),'F11 设为截至日：页级胶囊',await txt(p,'#asof-pill'));
ok((await hash(p)).includes('asof=0914'),'as-of 写进 hash');
ok((await txt(p,'#kpi_target [data-k="span"]')).includes('9/1–9/14'),'K04 跟随截至日',await txt(p,'#kpi_target [data-k="span"]'));
ok((await txt(p,'#kpi_ring [data-k="period"]')).includes('截至 9/14'),'K05 跟随截至日',await txt(p,'#kpi_ring [data-k="period"]'));
ok((await p.locator('#tbl_compare tbody tr').first().locator('td').first().innerText())!=='412.6','B07 跟随截至日');
await p.locator('#flt_panel td[data-k="2026-09-14"]').focus();await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');await p.waitForTimeout(100);
ok((await txt(p,'#flt_panel [data-k="rt"]')).includes('9 月 14 日'),'F11 截至日之后不可选');
await p.locator('#asof-pill button').click();await p.waitForTimeout(300);
ok((await txt(p,'#asof-pill')).includes('9/22')&&(await txt(p,'#kpi_target [data-k="span"]')).includes('9/1–9/22'),'回到最新');
});
await sec('tabs',async()=>{
await go('tab_line');
await p.locator('#tab_line [role="tab"]').first().focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);
ok(await p.locator('#tab_line [role="tab"]').nth(1).getAttribute('aria-selected')==='true'&&await p.locator('#tab_line [data-p="trend"]').isVisible(),'T01 自动激活');
ok((await hash(p)).includes('t01=trend'),'T01 写进 hash');
ok((await p.locator('#tab_line [role="tab"][aria-selected="false"]').count())===3,'T01 其余 aria-selected=false');
ok(await p.locator('#tab_line [role="tab"]').nth(1).getAttribute('tabindex')==='0','T01 roving tabindex');
await go('tab_badge');
await p.locator('#tab_badge [data-a="done"]').first().click();await p.waitForTimeout(120);
ok((await p.locator('#tab_badge [role="tab"]').first().getAttribute('aria-label'))==='待办，4 项','T05 徽标计数写进 aria-label',await p.locator('#tab_badge [role="tab"]').first().getAttribute('aria-label'));
await go('tab_over');
await p.locator('#tab_over [data-k="more"]').click();await p.waitForTimeout(100);
ok(await p.locator('#tab_over [data-k="menu"]').isVisible(),'T06 更多菜单打开');
await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(200);
ok(await p.locator('#tab_over [data-k="menu"]').isHidden()&&(await p.locator('#tab_over [role="tab"][aria-selected="true"]').count())===1,'T06 菜单选中并关闭');
await go('tab_vert');
await p.locator('#tab_vert [role="tab"]').first().focus();await p.keyboard.press('ArrowDown');await p.waitForTimeout(100);
ok(await p.locator('#tab_vert [role="tab"]').nth(1).getAttribute('aria-selected')==='true','T07 纵向 ↓ 切换');
ok(await p.locator('#tab_vert [role="tablist"]').getAttribute('aria-orientation')==='vertical','T07 aria-orientation');
await go('tab_dyn');
await p.locator('#tab_dyn [role="tab"]').first().focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(100);
ok(await p.locator('#tab_dyn [role="tab"]').first().getAttribute('aria-selected')==='true'&&await p.evaluate(()=>document.activeElement?.textContent==='华东复盘'),'T08 手动激活：方向键只移焦点');
await p.keyboard.press('Enter');await p.waitForTimeout(500);
ok(await p.locator('#tab_dyn [role="tab"]').nth(1).getAttribute('aria-selected')==='true','T08 Enter 切换');
await p.locator('#tab_dyn [data-k="add"]').click();await p.waitForTimeout(500);
ok((await p.locator('#tab_dyn [role="tab"]').count())===4,'T08 新建视图');
await p.keyboard.press('Delete');await p.waitForTimeout(200);
ok((await p.locator('#tab_dyn [role="tab"]').count())===3&&await p.evaluate(()=>document.activeElement?.getAttribute('role')==='tab'),'T08 Delete 关闭并聚焦相邻页签');
});
await sec('tables',async()=>{
await go('tbl_detail');
await p.locator('#tbl_detail .g-act [data-choice="drill"]').click();await p.locator('#tbl_detail tbody tr[data-key="east"]').click();await p.waitForTimeout(200);
ok((await p.locator('#tbl_detail tbody tr').count())===3&&(await txt(p,'#tbl_detail [data-k="ctx"]')).includes('华东'),'B01 下钻');
await p.locator('#tbl_detail [data-k="up"]').click();await p.waitForTimeout(150);
ok((await p.locator('#tbl_detail tbody tr').count())===6,'B01 面包屑返回');
await p.locator('#tbl_detail .g-act [data-choice="select"]').click();await p.locator('#tbl_detail tbody tr[data-key="south"]').click();await p.waitForTimeout(120);
ok((await txt(p,'#tbl_detail [data-k="ctx"]')).includes('已选 1 行'),'B01 勾选');
await p.locator('#tbl_detail thead [data-k="all"]').click();await p.waitForTimeout(100);
ok((await p.locator('#tbl_detail tbody input:checked').count())===6,'B01 表头全选');
await p.locator('#tbl_detail .g-act [data-choice="filter"]').click();await p.locator('#tbl_detail tbody tr[data-key="south"]').click();await p.waitForTimeout(200);
ok((await p.locator('#tbl_detail [data-k="side-bars"] .fk-hbar[data-id="direct"] .v').innerText())==='130.2'&&(await p.locator('#tbl_detail .fk-tag.dash').count())===1,'B01 联动');
await p.locator('#tbl_detail .g-gran [data-choice="day"]').click();await p.waitForTimeout(200);
ok(await p.locator('#tbl_detail .tb-pager').isVisible()&&(await txt(p,'#tbl_detail .tb-pager')).includes('共 132 行'),'B01 超过 50 行分页',await txt(p,'#tbl_detail .tb-pager'));
ok((await p.locator('#tbl_detail tbody tr').count())===20,'B01 每页 20 行');
const firstKey=await p.locator('#tbl_detail tbody tr').first().getAttribute('data-key');
await p.locator('#tbl_detail .tb-pages [aria-label="第 2 页"]').click();await p.waitForTimeout(120);
ok((await p.locator('#tbl_detail tbody tr').first().getAttribute('data-key'))!==firstKey,'B01 翻页');
await p.locator('#tbl_detail .g-gran [data-choice="region"]').click();await p.locator('#tbl_detail .g-act [data-choice="inspect"]').click();await p.waitForTimeout(150);
const sortBtn=p.locator('#tbl_detail thead .tb-sort[data-col="rev"]');
await sortBtn.click();await p.waitForTimeout(80);const th=p.locator('#tbl_detail thead th',{has:p.locator('.tb-sort[data-col="rev"]')});
ok(await th.getAttribute('aria-sort')==='descending','B01 排序：降序');
await sortBtn.click();await p.waitForTimeout(80);ok(await th.getAttribute('aria-sort')==='ascending','B01 排序：升序');
await sortBtn.click();await p.waitForTimeout(80);ok(await th.getAttribute('aria-sort')===null&&(await p.locator('#tbl_detail thead th[aria-sort]').count())===0,'B01 排序：回到默认并移除 aria-sort');
await p.locator('#tbl_detail tbody tr').first().focus();await p.keyboard.press('ArrowDown');await p.waitForTimeout(60);
ok(await p.evaluate(()=>document.activeElement?.dataset.key==='south'),'B01 ↑↓ 行间移动');
await go('tbl_cross');
await p.locator('#tbl_cross [data-choice="day"]').click();await p.waitForTimeout(120);
ok(await p.locator('#tbl_cross [data-k="banner"]').isVisible(),'B03 规模阈值提示');
await p.locator('#tbl_cross [data-k="go"]').click();await p.waitForTimeout(150);
ok((await p.locator('#tbl_cross thead th').count())===24,'B03 仍然展开 22 列',String(await p.locator('#tbl_cross thead th').count()));
const tot=await p.evaluate(()=>{const f=document.querySelector('#tbl_cross tfoot tr');const cells=[...f.cells].slice(1,-1).map(c=>parseFloat(c.textContent.replace(/,/g,'')));const s=cells.reduce((a,b)=>a+b,0);return [Math.round(s*10)/10,parseFloat(f.cells[f.cells.length-1].textContent.replace(/,/g,''))];});
ok(Math.abs(tot[0]-tot[1])<.05,'B03 合计 = 各列合计之和',JSON.stringify(tot));
await go('tbl_group');
await p.locator('#tbl_group tr.grp[data-key="north"] .tb-exp').click();await p.waitForTimeout(100);
ok((await p.locator('#tbl_group tbody:nth-of-type(3) tr.member:not([hidden])').count())===3,'B05 展开分组');
ok(await p.locator('#tbl_group tr.grp[data-key="north"] .tb-exp').getAttribute('aria-expanded')==='true','B05 aria-expanded');
await go('tbl_expand');
await p.locator('#tbl_expand tr[data-key="south"] .tb-exp').click();await p.waitForTimeout(100);
ok((await p.locator('#tbl_expand tr.child:not([hidden])').count())===5,'B06 展开华南（华东 3 + 华南 2）',String(await p.locator('#tbl_expand tr.child:not([hidden])').count()));
await p.keyboard.press('ArrowLeft');await p.waitForTimeout(100);
ok((await p.locator('#tbl_expand tr.child:not([hidden])').count())===3,'B06 ← 收起');
await go('tbl_compare');
ok((await p.locator('#tbl_compare thead th[scope="colgroup"]').count())===3,'B07 三个列组表头');
const hd=await p.locator('#tbl_compare tbody tr').first().locator('td').first().getAttribute('headers');
ok(hd&&hd.split(' ').length===3,'B07 headers = 行 组 列',hd);
ok((await p.locator('#tbl_compare colgroup[span="2"]').count())===3,'B07 colgroup span');
await p.locator('#tbl_compare [data-choice="empty"]').click();await p.waitForTimeout(250);
ok(await p.locator('#tbl_compare .tb-layer[data-layer="empty"]').isVisible(),'B07 空态');
const h1=await p.locator('#tbl_compare .tb-stack').boundingBox();await p.locator('#tbl_compare [data-choice="ok"]').click();await p.waitForTimeout(250);const h2=await p.locator('#tbl_compare .tb-stack').boundingBox();
ok(Math.abs(h1.height-h2.height)<1,'B07 五态等高',`${h1.height} vs ${h2.height}`);
});
await sec('P05 on TableKit',async()=>{
await go('kpi_score');
const ach=p.locator('#kpi_score thead .tb-sort[data-col="ach"]');
await ach.click();await p.waitForTimeout(500);ok((await p.locator('#kpi_score tbody th').first().innerText())==='退款率','P05 达成降序');
await ach.click();await p.waitForTimeout(500);ok((await p.locator('#kpi_score tbody th').first().innerText())==='营收','P05 达成升序');
await ach.click();await p.waitForTimeout(500);ok((await p.locator('#kpi_score tbody th').first().innerText())==='营收'&&(await p.locator('#kpi_score thead th[aria-sort]').count())===0,'P05 三态回默认');
const st=p.locator('#kpi_score thead .tb-sort[data-col="status"]');await st.click();await p.waitForTimeout(500);
ok((await p.locator('#kpi_score tbody th').first().innerText())==='营收','P05 状态降序：最严重在前（同档按达成升序）',await p.locator('#kpi_score tbody th').first().innerText());
});
await sec('inspector on dynamic rows',async()=>{
await go('tbl_expand');const row=p.locator('#tbl_expand tbody tr[data-key="north"]');await row.hover();await p.waitForTimeout(300);
ok((await p.locator('.metric-panel').innerText()).includes('华北'),'读数浮层：动态行 lookup');
});
await p.close();
/* ---------- hash restore ---------- */
p=await fresh('#!f01=d7&t01=mix&asof=0914&f04=east,central&t08=online');
await sec('hash restore',async()=>{
await p.waitForTimeout(300);
ok(await p.locator('#flt_quick .fk-chip',{hasText:'近 7 天'}).getAttribute('aria-checked')==='true','hash 复原 F01');
ok(await p.locator('#tab_line [data-p="mix"]').isVisible(),'hash 复原 T01');
ok((await txt(p,'#asof-pill')).includes('9/14'),'hash 复原截至日');
ok((await txt(p,'#flt_multi [data-k="selcount"]')).includes('2 / 6'),'hash 复原 F04');
ok(await p.locator('#tab_dyn [role="tab"]',{hasText:'电商专题'}).getAttribute('aria-selected')==='true','hash 复原 T08');
// IO reset must not wipe restored state
for(const id of ['flt_quick','tab_line','flt_panel','flt_multi']){await p.locator('#'+id).scrollIntoViewIfNeeded();await p.waitForTimeout(250);}
ok(await p.locator('#flt_quick .fk-chip',{hasText:'近 7 天'}).getAttribute('aria-checked')==='true'&&(await txt(p,'#asof-pill')).includes('9/14'),'进入视口的首次重播不清掉 hash 状态');
// nav anchors do not reset state
await p.locator('.nav a[href="#tokens"]').click();await p.waitForTimeout(300);
ok((await txt(p,'#asof-pill')).includes('9/14'),'锚点跳转不清状态');
// replay all resets everything
await p.locator('#replay-all').click();await p.waitForTimeout(400);
ok((await txt(p,'#asof-pill')).includes('9/22')&&await p.locator('#flt_quick .fk-chip',{hasText:'本月'}).getAttribute('aria-checked')==='true','重播全部恢复默认');
});
await p.close();
console.log(THEME,'pass',pass,'fail',fail);if(fails.length)console.log(' FAIL: '+fails.join('\n FAIL: '));
console.log('errors:',errors.length?'\n'+[...new Set(errors)].slice(0,20).join('\n'):'none');
await b.close();
