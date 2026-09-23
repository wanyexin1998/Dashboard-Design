// CPU profile of a pointer sweep over one card: which functions eat the time per move.
import { chromium } from 'playwright';
import { PAGE, url, out } from '../lib.mjs';
const FILE=process.argv[2]||PAGE,ID=process.argv[3]||'kpi_tabs';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});
await p.goto(url(FILE));await p.waitForTimeout(700);
await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},ID);
await p.mouse.move(4,500);await p.waitForTimeout(1400);
const t=await p.evaluate(id=>{const root=document.querySelector('#'+id+' .chart-host');const c=root.querySelector('svg[data-metric-probe]')||root.querySelector('[data-metric-target]');const r=c.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width*0.9};},ID);
const cdp=await p.context().newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
await p.mouse.move(t.x-t.w/2,t.y);await p.waitForTimeout(200);
await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:100});await cdp.send('Profiler.start');
for(let r=0;r<3;r++)for(let k=0;k<=40;k++){await p.mouse.move(t.x-t.w/2+t.w*(r%2?40-k:k)/40,t.y);}
const {profile}=await cdp.send('Profiler.stop');
const self=new Map();const byId=new Map(profile.nodes.map(n=>[n.id,n]));
const dt=profile.timeDeltas;const samples=profile.samples;
samples.forEach((sid,i)=>{const n=byId.get(sid);const key=`${n.callFrame.functionName||'(anon)'} @${n.callFrame.lineNumber}`;self.set(key,(self.get(key)||0)+(dt[i]||0));});
const total=[...self.values()].reduce((s,v)=>s+v,0);
[...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,22).forEach(([k,v])=>console.log(`${(v/1000).toFixed(1).padStart(7)}ms ${(v/total*100).toFixed(1).padStart(5)}%  ${k}`));
await b.close();
