import { chromium } from 'playwright';
import { PAGE, url, out } from './lib.mjs';
const SP=out('kint');
const FILE=process.argv[2]||PAGE, THEME=process.argv[3]||'dark';
const browser=await chromium.launch(); const errors=[]; const fails=[]; const ok=[];
const page=await browser.newPage({viewport:{width:1320,height:900}});
await page.addInitScript(t=>{try{localStorage.setItem('chart-studies-theme',t);}catch(e){}},THEME);
page.on('console',m=>{if(['error','warning','assert'].includes(m.type()))errors.push(`[${m.type()}] ${m.text()}`);});
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
await page.goto(url(FILE)); await page.waitForTimeout(300);
await (await page.$('[data-filter="kpi"]')).click();
for(const c of await page.$$('.specimen:not([hidden])')){await c.scrollIntoViewIfNeeded();await page.waitForTimeout(40);}
await page.waitForTimeout(1300);
const expect=(name,cond,detail='')=>{(cond?ok:fails).push(name+(cond?'':' → '+detail));};
const sel=id=>`#${id}`;
const txt=async s=>(await page.$eval(s,e=>e.textContent.trim()));
const panel=async()=>page.$eval('.metric-panel',e=>e.hidden?'(hidden)':e.textContent);
async function hover(s){const el=await page.$(s);await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(260);return b;}
async function shot(id,name){const el=await page.$(sel(id));await el.scrollIntoViewIfNeeded();await page.waitForTimeout(80);await el.screenshot({path:`${SP}/i_${THEME}_${name}.png`});}
// K01 states
await page.click('#kpi_value [data-choice="loading"]');await page.waitForTimeout(300);await shot('kpi_value','k01_loading');
const h1=await page.$eval('#kpi_value .kpi-card',e=>e.getBoundingClientRect().height);
for(const s of ['empty','error','stale','ok']){await page.click(`#kpi_value [data-choice="${s}"]`);await page.waitForTimeout(260);const h=await page.$eval('#kpi_value .kpi-card',e=>e.getBoundingClientRect().height);expect('K01 same height '+s,Math.abs(h-h1)<1,h+' vs '+h1);if(s!=='ok')await shot('kpi_value','k01_'+s);}
await page.click('#kpi_value [data-choice="error"]');await page.waitForTimeout(250);await page.click('#kpi_value .kpi-card .kpi-retry');await page.waitForTimeout(250);
expect('K01 retry → loading',(await page.$eval('#kpi_value .kpi-card',e=>e.dataset.state))==='loading');await page.waitForTimeout(1400);
expect('K01 retry → ok',(await page.$eval('#kpi_value .kpi-card',e=>e.dataset.state))==='ok');
expect('K01 seg follows retry',(await page.$eval('#kpi_value [data-choice="ok"]',e=>e.getAttribute('aria-pressed')))==='true');
await hover('#kpi_value [data-k="num-box"]');const p1=await panel();expect('K01 full value in readout',p1.includes('12,864,000 元'),p1);
await page.screenshot({path:`${SP}/i_${THEME}_k01_panel.png`,clip:{x:0,y:0,width:1320,height:900}});
// K02
await hover('#kpi_delta [data-k="cmp0"]');const p2=await panel();expect('K02 readout base+verdict',p2.includes('5,512 元')&&p2.includes('向差'),p2);
await page.screenshot({path:`${SP}/i_${THEME}_k02_panel.png`});
// K03 scrub (headline must not follow)
{const b=await hover('#kpi_trend [data-k="spark"]');await page.mouse.move(b.x+b.width*.6,b.y+b.height/2);await page.waitForTimeout(150);
 const rv=await txt('#kpi_trend [data-k="rv"]');expect('K03 readout moves',!rv.startsWith('9/22'),rv);expect('K03 headline stays',(await txt('#kpi_trend [data-k="num"]'))==='1,286.4');await shot('kpi_trend','k03_scrub');
 await page.mouse.move(5,5);await page.waitForTimeout(150);expect('K03 readout back to latest',(await txt('#kpi_trend [data-k="rv"]')).startsWith('9/22'));}
// K03 keyboard
await page.focus('#kpi_trend [data-k="spark"]');await page.keyboard.press('Home');await page.waitForTimeout(80);expect('K03 Home → 9/1',(await txt('#kpi_trend [data-k="rv"]')).startsWith('9/1'),await txt('#kpi_trend [data-k="rv"]'));
expect('K03 aria-valuetext',(await page.$eval('#kpi_trend [data-k="spark"]',e=>e.getAttribute('aria-valuetext'))).startsWith('9/1 '));
// K04 year
await page.click('#kpi_target [data-choice="year"]');await page.waitForTimeout(900);
expect('K04 year rate',(await txt('#kpi_target [data-k="rate"]'))==='73.5%',await txt('#kpi_target [data-k="rate"]'));
expect('K04 year chip',(await txt('#kpi_target [data-k="pace"]')).includes('超前 0.9pp'),await txt('#kpi_target [data-k="pace"]'));
expect('K04 year target in 亿',(await txt('#kpi_target [data-k="f-target"] b'))==='1.56 亿',await txt('#kpi_target [data-k="f-target"] b'));
await shot('kpi_target','k04_year');
await page.click('#kpi_target [data-choice="quarter"]');await page.waitForTimeout(900);expect('K04 quarter 持平',(await txt('#kpi_target [data-k="pace"]')).includes('持平'),await txt('#kpi_target [data-k="pace"]'));await shot('kpi_target','k04_quarter');
// K05 linked highlight
await hover('#kpi_ring .kpi-card [data-k="gap"]');expect('K05 row on',await page.$eval('#kpi_ring .kpi-card [data-k="gap"]',e=>e.classList.contains('on')));await shot('kpi_ring','k05_gap');
await hover('#kpi_ring .kpi-card [data-k="time"]');await shot('kpi_ring','k05_time');
// K06
await page.click('#kpi_status [data-choice="last"]');await page.waitForTimeout(800);
const chips=await page.$$eval('#kpi_status [data-k="chip"]',els=>els.map(e=>e.textContent));expect('K06 last month 异常 ×2',chips.every(c=>c.includes('异常')),chips.join());await shot('kpi_status','k06_last');
await page.click('#kpi_status [data-choice="week"]');await page.waitForTimeout(800);const chips2=await page.$$eval('#kpi_status [data-k="chip"]',els=>els.map(e=>e.textContent));expect('K06 week 正常 / 关注',chips2[0].includes('正常')&&chips2[1].includes('关注'),chips2.join());
// K08
await page.click('#kpi_rank [data-choice="growth"]');await page.waitForTimeout(800);
const order=await page.$$eval('#kpi_rank .kpi-rank-row',els=>els.map(e=>e.querySelector('.nm').textContent));expect('K08 DOM order by growth',order.join()==='西南,华南,华东,华北,华中,其他',order.join());
const firstY=await page.$eval('#kpi_rank .kpi-rank-row',e=>e.style.transform);expect('K08 first row at top',/translateY\(0(\.0)?px\)/.test(firstY),firstY);
await shot('kpi_rank','k08_growth');
// K09
{const svgs=await page.$$('#kpi_trio [data-k="spark"]');const b=await svgs[2].boundingBox();await page.mouse.move(b.x+b.width-3,b.y+b.height/2);await page.waitForTimeout(150);const rv=await page.$$eval('#kpi_trio [data-k="rv"]',e=>e.map(x=>x.textContent));expect('K09 partial month readout',rv[2].includes('1–22 日'),rv[2]);await shot('kpi_trio','k09_scrub');await page.mouse.move(5,5);}
// P01
await page.click('#kpi_strip [data-choice="yoy"]');await page.waitForTimeout(700);
const md=await page.$eval('#kpi_strip [data-id="margin"] [data-k="d"]',e=>[e.className,e.textContent]);expect('P01 margin yoy −0.6pp bad',md[0].includes('bad')&&md[1].includes('0.6pp'),md.join('|'));
await page.focus('#kpi_strip .kpi-strip-item');await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);
expect('P01 roving focus',await page.evaluate(()=>document.activeElement.dataset.id)==='ord');const pp=await panel();expect('P01 readout on focus',pp.includes('订单数'),pp);
await shot('kpi_strip','p01_yoy');
// P02
await hover('#kpi_hero .kpi-row[data-part="need"]');expect('P02 need line shown',(await page.$eval('#kpi_hero svg',s=>[...s.querySelectorAll('line')].some(l=>l.getAttribute('stroke-dasharray')==='1 3'&&l.getAttribute('opacity')==='1'))));await shot('kpi_hero','p02_need');
await hover('#kpi_hero .kpi-row[data-part="behind"]');await shot('kpi_hero','p02_behind');
{const b=await hover('#kpi_hero svg');await page.mouse.move(b.x+b.width*.3,b.y+b.height/2);await page.waitForTimeout(300);const p=await panel();expect('P02 probe readout',p.includes('累计营收')&&p.includes('目标节奏'),p);expect('P02 headline stays',(await txt('#kpi_hero [data-k="num"]'))==='1,286.4');await page.screenshot({path:`${SP}/i_${THEME}_p02_probe.png`});}
// P03
await page.click('#kpi-tab-refund');await page.waitForTimeout(800);expect('P03 note',(await txt('#kpi_tabs [data-k="note"]')).includes('上限 2.00%'),await txt('#kpi_tabs [data-k="note"]'));
expect('P03 aria-selected',(await page.$eval('#kpi-tab-refund',e=>e.getAttribute('aria-selected')))==='true');await shot('kpi_tabs','p03_refund');
await page.focus('#kpi-tab-refund');await page.keyboard.press('ArrowLeft');await page.waitForTimeout(800);expect('P03 arrow → 客单价',(await page.$eval('#kpi-tab-aov',e=>e.getAttribute('aria-selected')))==='true');
{const b=await hover('#kpi_tabs svg');await page.mouse.move(b.x+b.width*.5,b.y+b.height/2);await page.waitForTimeout(300);const p=await panel();expect('P03 probe readout',p.includes('客单价')&&p.includes('目标'),p);expect('P03 tab value stays',(await txt('#kpi-tab-aov .v')).startsWith('5,320'));}
// P04
await page.click('#kpi_grid [data-choice="year"]');await page.waitForTimeout(800);
const rev=[await txt('#kpi_grid [data-id="rev"] [data-k="num"]'),await txt('#kpi_grid [data-id="rev"] [data-k="num-unit"]')];expect('P04 year revenue 1.15 亿元',rev.join(' ')==='1.15 亿元',rev.join(' '));
const ord=[await txt('#kpi_grid [data-id="ord"] [data-k="num"]'),await txt('#kpi_grid [data-id="ord"] [data-k="num-unit"]')];expect('P04 year orders 2.2 万单',ord.join(' ')==='2.2 万单',ord.join(' '));
await shot('kpi_grid','p04_year');
// P05
await page.click('#kpi_score .tb-sort[data-col="status"]');await page.waitForTimeout(600);
let firstRow=await txt('#kpi_score tbody tr th');expect('P05 status sort → 营收 first',firstRow==='营收',firstRow);expect('P05 aria-sort',(await page.$eval('#kpi_score thead th:has(.tb-sort[data-col="status"])',e=>e.getAttribute('aria-sort')))==='descending');
await shot('kpi_score','p05_status');
await page.click('#kpi_score .tb-sort[data-col="ach"]');await page.waitForTimeout(600);firstRow=await txt('#kpi_score tbody tr th');expect('P05 ach sort → 退款率 first',firstRow==='退款率',firstRow);
await page.click('#kpi_score .tb-sort[data-col="ach"]');await page.waitForTimeout(600);firstRow=await txt('#kpi_score tbody tr th');expect('P05 ach asc → 营收 first',firstRow==='营收',firstRow);
await hover('#kpi_score tbody tr');const p5=await panel();expect('P05 row readout',p5.includes('时间进度'),p5);
// P07
await page.click('#kpi_chain [data-choice="total"]');await page.waitForTimeout(700);const lastR=await page.$$eval('#kpi_chain [data-k="r"]',e=>e.map(x=>x.textContent));expect('P07 cumulative 5.0%',lastR[4].includes('5.0%'),lastR.join('|'));await shot('kpi_chain','p07_total');
await hover('#kpi_chain .kpi-stage[data-level="2"]');const p7=await panel();expect('P07 readout loss',p7.includes('本步流失')&&p7.includes('6,152'),p7);
// theme switch keeps state
await page.evaluate(()=>window.scrollTo(0,0));await page.click(`[data-theme-choice="${THEME==='dark'?'light':'dark'}"]`);await page.waitForTimeout(500);
const order2=await page.$$eval('#kpi_rank .kpi-rank-row',els=>els.map(e=>e.querySelector('.nm').textContent));expect('theme switch keeps K08 order',order2[0]==='西南',order2.join());
expect('theme switch keeps P04 year',(await txt('#kpi_grid [data-id="rev"] [data-k="num"]'))==='1.15');
// replay restores
await page.click('#replay-all');await page.waitForTimeout(1400);
expect('replay resets K08',(await page.$$eval('#kpi_rank .kpi-rank-row',els=>els[0].querySelector('.nm').textContent))==='华东');
expect('replay resets P05',(await txt('#kpi_score tbody tr th'))==='营收'&&(await page.$$('#kpi_score thead th[aria-sort]')).length===0);
expect('replay resets K01 values',(await txt('#kpi_value [data-k="num"]'))==='1,286.4');
// reduced motion: instant end state
await page.evaluate(()=>window.scrollTo(0,0));await page.check('#reduce-motion');await page.click('#kpi_target [data-choice="year"]');await page.waitForTimeout(30);
expect('reduced motion instant',(await txt('#kpi_target [data-k="rate"]'))==='73.5%',await txt('#kpi_target [data-k="rate"]'));
console.log('pass',ok.length,'fail',fails.length);fails.forEach(f=>console.log('  ✗',f));
console.log('errors:',errors.length?errors:'none');
await browser.close();
