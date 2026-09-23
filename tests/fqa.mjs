import { chromium } from 'playwright';
import { PAGE, url, out } from './lib.mjs';
const FILE=process.argv[2]||PAGE,THEME=process.argv[3]||'dark',W=+(process.argv[4]||1320),TAG=process.argv[5]||'f',SHOTS=process.argv[6]!=='noshot';
const OUT=out('fqa');
const b=await chromium.launch();const page=await b.newPage({viewport:{width:W,height:1000},deviceScaleFactor:1});
const errors=[];page.on('console',m=>{if(['error','warning','assert'].includes(m.type()))errors.push(`[${m.type()}] ${m.text()}`);});page.on('pageerror',e=>errors.push('pageerror: '+e.message));
await page.addInitScript(t=>{try{localStorage.setItem('chart-studies-theme',t);}catch(e){}},THEME);
await page.goto(url(FILE));await page.waitForTimeout(600);
const ids=await page.evaluate(()=>[...document.querySelectorAll('.specimen')].map(a=>a.id).filter(id=>/^(flt|tab|tbl)_|kpi_score|kpi_target|kpi_ring/.test(id)));
for(const id of ids){await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(350);}
await page.waitForTimeout(500);
const sw=await page.evaluate(()=>document.documentElement.scrollWidth);
const over=await page.evaluate(()=>{const out=[];document.querySelectorAll('.specimen *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&r.right>document.documentElement.clientWidth+1&&!el.closest('.tb-wrap,.tk-scroll,.fk-pop,.tk-menu')&&getComputedStyle(el).visibility!=='hidden')out.push((el.closest('.specimen')?.id||'')+'|'+(el.className.baseVal??el.className)+'|'+Math.round(r.right));});return out.slice(0,12);});
console.log(TAG,THEME,W,'cards',ids.length,'scrollWidth',sw,'overflow',JSON.stringify(over));
if(SHOTS){for(const id of ids){await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(120);await page.locator('#'+id+' .specimen-shell').screenshot({path:`${OUT}/${TAG}_${THEME}_${W}_${id}.png`});}}
console.log('errors:',errors.length?'\n'+errors.slice(0,30).join('\n'):'none');
await b.close();
