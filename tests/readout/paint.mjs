// Rendering cost of one pointer sweep per card, from a Chrome trace: how much main-thread style / layout / paint
// and raster work the moving panel causes. Usage: node paint.mjs [file] [ids,comma]
import { chromium } from 'playwright';
import { PAGE, url, out } from '../lib.mjs';
const FILE=process.argv[2]||PAGE,ONLY=(process.argv[3]||'').split(',').filter(Boolean);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});
await p.goto(url(FILE));await p.waitForTimeout(700);
await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
let ids=await p.evaluate(()=>[...document.querySelectorAll('.specimen')].map(a=>a.id));if(ONLY.length)ids=ids.filter(i=>ONLY.includes(i));
const NAMES=['UpdateLayoutTree','Layout','Paint','PrePaint','Layerize','RasterTask','EventDispatch','FunctionCall'];
const rows=[];
for(const id of ids){
  await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},id);
  await p.mouse.move(4,500);await p.keyboard.press('Escape');await p.waitForTimeout(1300);
  const t=await p.evaluate(id=>{const root=document.querySelector('#'+id+' .chart-host');const c=root.querySelector('svg[data-metric-probe]')||root.querySelector('[data-metric-target]');if(!c)return null;const r=c.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+Math.min(r.height/2,200),w:Math.max(80,r.width*0.9)};},id);
  if(!t)continue;
  await p.mouse.move(t.x-t.w/2,t.y);await p.waitForTimeout(300);
  await b.startTracing(p,{categories:['devtools.timeline','disabled-by-default-devtools.timeline','cc','viz']});
  for(let k=0;k<=40;k++){await p.mouse.move(t.x-t.w/2+t.w*k/40,t.y+Math.sin(k/3)*6);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>r())));}
  await p.waitForTimeout(100);
  const buf=await b.stopTracing();const ev=JSON.parse(buf.toString()).traceEvents;
  const acc={};NAMES.forEach(n=>acc[n]={n:0,ms:0});let paintArea=0;
  for(const e of ev){if(!acc[e.name]||e.ph!=='X')continue;acc[e.name].n++;acc[e.name].ms+=(e.dur||0)/1000;
    if(e.name==='Paint'&&e.args?.data?.clip){const c=e.args.data.clip;const xs=[c[0],c[2],c[4],c[6]],ys=[c[1],c[3],c[5],c[7]];paintArea+=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys));}}
  rows.push({id,acc,paintArea});
  await p.mouse.move(4,500);
}
console.log('41 步扫动，每步一帧；次数 / 毫秒');
console.log('  card         style        layout       paint        raster       paint 面积(px²)');
for(const r of rows){const a=r.acc,f=k=>`${String(a[k].n).padStart(3)}/${a[k].ms.toFixed(1).padStart(6)}`;
  console.log(`  ${r.id.padEnd(12)} ${f('UpdateLayoutTree')}  ${f('Layout')}  ${f('Paint')}  ${f('RasterTask')}  ${Math.round(r.paintArea)}`);}
await b.close();
