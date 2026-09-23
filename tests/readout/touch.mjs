// Touch / narrow checks for 读数浮层 after the hover fixes:
//  W1 wide + touch: tap a target → floating panel shows and stays (pinned) → tap outside the chart → panel goes away
//  N1 narrow (390) + touch: tap a target → the card's dock shows the readout (floating stays hidden) and keeps it
import { chromium } from 'playwright';
import { PAGE, url } from '../lib.mjs';
const FILE=process.argv[2]||PAGE,ONLY=(process.argv[3]||'bars,line,combo,share,kpi_tabs,kpi_hero,tbl_cross,matrix').split(',').filter(Boolean);
const b=await chromium.launch();const out=[];let bad=0;
async function run(label,ctxOpts,fn){const ctx=await b.newContext(ctxOpts);const p=await ctx.newPage();p.setDefaultTimeout(4000);const perr=[];p.on('pageerror',e=>perr.push(e.message));
  await p.goto(url(FILE));await p.waitForTimeout(700);await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
  for(const id of ONLY){
    await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},id);await p.waitForTimeout(1300);
    const t=await p.evaluate(id=>{const root=document.querySelector('#'+id+' .chart-host');
      const els=[...root.querySelectorAll('svg[data-metric-probe],[data-metric-target]')].filter(e=>{const r=e.getBoundingClientRect();if(r.width<4||r.height<4||e.closest('[hidden]')||r.top<100||r.bottom>innerHeight-10)return false;const x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);return top&&(e===top||e.contains(top));});
      if(!els.length)return null;const r=els[0].getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};},id);
    if(!t){out.push(`${label} ${id}: 没有可点的目标`);continue;}
    const r=await fn(p,id,t);if(!r.ok)bad++;out.push(`${label} ${id}: ${r.ok?'PASS':'FAIL'} ${r.msg}`);
  }
  if(perr.length){bad++;out.push(`${label} pageerrors: ${perr.slice(0,2).join(' | ')}`);}
  await ctx.close();}
const state=(p,id)=>p.evaluate(id=>{const f=document.querySelector('.metric-panel'),d=document.querySelector('#'+id+' .metric-dock');return {vis:!!f&&!f.hidden&&getComputedStyle(f).display!=='none',dock:d?(d.querySelector('.metric-placeholder')?'placeholder':d.textContent.trim().slice(0,24)):'none'};},id);
await run('W1 宽屏触屏',{viewport:{width:1320,height:900},hasTouch:true},async(p,id,t)=>{
  await p.touchscreen.tap(t.x,t.y);await p.waitForTimeout(150);const a=await state(p,id);
  await p.waitForTimeout(600);const b2=await state(p,id);
  await p.touchscreen.tap(20,300);await p.waitForTimeout(200);const c=await state(p,id);   // page gutter, outside every card
  return {ok:a.vis&&b2.vis&&!c.vis,msg:`点后=${a.vis} 600ms后=${b2.vis} 点卡外后=${c.vis}`};});
await run('N1 窄屏触屏',{viewport:{width:390,height:844},hasTouch:true,isMobile:true},async(p,id,t)=>{
  await p.touchscreen.tap(t.x,t.y);await p.waitForTimeout(150);const a=await state(p,id);
  await p.waitForTimeout(600);const b2=await state(p,id);
  return {ok:!a.vis&&a.dock!=='placeholder'&&b2.dock===a.dock,msg:`浮层=${a.vis} 停靠区=「${a.dock}」 600ms后=「${b2.dock}」`};});
out.forEach(s=>console.log(s));console.log(bad?'RED':'GREEN');
await b.close();
