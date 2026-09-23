// Jank loop: sweep the pointer across each card with the CPU throttled (slower machine / artifact viewer),
// record time spent in pointermove handlers and the length of every frame during the sweep.
import { chromium } from 'playwright';
import { PAGE, url, out } from '../lib.mjs';
const FILE=process.argv[2]||PAGE,ONLY=(process.argv[3]||'').split(',').filter(Boolean),RATE=+(process.argv[4]||6);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});
await p.addInitScript(()=>{window.__mv=[];let t0=0;addEventListener('pointermove',()=>{t0=performance.now();},true);
  document.addEventListener('DOMContentLoaded',()=>{addEventListener('pointermove',()=>{window.__mv.push(performance.now()-t0);},false);});
  window.__frames=[];let last=0,on=false;window.__startFrames=()=>{window.__frames=[];on=true;last=performance.now();const tick=t=>{if(!on)return;window.__frames.push(t-last);last=t;requestAnimationFrame(tick);};requestAnimationFrame(tick);};window.__stopFrames=()=>{on=false;};});
await p.goto(url(FILE));await p.waitForTimeout(700);
await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
const cdp=await p.context().newCDPSession(p);
let ids=await p.evaluate(()=>[...document.querySelectorAll('.specimen')].map(a=>a.id));if(ONLY.length)ids=ids.filter(i=>ONLY.includes(i));
const rows=[];
for(const id of ids){
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},id);
  await p.mouse.move(4,500);await p.waitForTimeout(1300);
  const t=await p.evaluate(([id,sel])=>{const root=document.querySelector('#'+id+' .chart-host');const c=sel?root.querySelector(sel):root.querySelector('svg[data-metric-probe]')||root.querySelector('[data-metric-target]');if(!c)return null;const r=(c.closest('svg')&&!c.matches('svg')?c.closest('svg'):c).getBoundingClientRect();const R=root.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+Math.min(r.height/2,200),w:Math.min(R.width*0.8,r.width>60?r.width*0.9:R.width*0.8)};},[id,process.env.SEL||'']);
  if(!t)continue;
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:RATE});
  await p.mouse.move(t.x-t.w/2,t.y);await p.waitForTimeout(200);
  await p.evaluate(()=>{window.__mv.length=0;window.__startFrames();});
  for(let k=0;k<=40;k++){await p.mouse.move(t.x-t.w/2+t.w*k/40,t.y+Math.sin(k/3)*6);}
  await p.waitForTimeout(150);
  const m=await p.evaluate(()=>{window.__stopFrames();const a=window.__mv.slice().sort((x,y)=>x-y),f=window.__frames.slice(1);const q=(arr,pp)=>arr.length?+arr[Math.min(arr.length-1,Math.floor(arr.length*pp))].toFixed(1):0;
    return {n:a.length,avg:a.length?+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(1):0,p95:q(a,.95),max:a.length?+a[a.length-1].toFixed(1):0,frames:f.length,long:f.filter(x=>x>34).length,worst:f.length?+Math.max(...f).toFixed(0):0};});
  rows.push({id,...m});
  await p.mouse.move(4,500);await p.keyboard.press('Escape');
}
await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
rows.sort((a,b)=>b.p95-a.p95);
console.log(`CPU ×${RATE}  pointermove 处理耗时（ms）与扫动期间的帧`);
rows.forEach(r=>console.log(`  ${r.id.padEnd(12)} moves=${String(r.n).padStart(2)} avg=${String(r.avg).padStart(5)} p95=${String(r.p95).padStart(5)} max=${String(r.max).padStart(5)} | frames=${r.frames} >34ms=${r.long} worst=${r.worst}`));
const bad=rows.filter(r=>r.p95>16);console.log('p95 > 16ms 的卡片：',bad.length,bad.map(r=>r.id).join(' '));
await b.close();
