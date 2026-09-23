// Stutter loop for 读数浮层: sweep the mouse steadily across each chart (one step per frame) and check, after every step,
// that a visible panel sits where position() would put it for the current pointer.
//   frozen = panel visible but left/top not at the expected spot for this pointer (it stopped following)
//   blink  = panel visible → hidden → visible again during one continuous sweep
// Usage: node stutter.mjs [file] [ids,comma] [stepPx]
import { chromium } from 'playwright';
import { PAGE, url, out } from '../lib.mjs';
const FILE=process.argv[2]||PAGE,ONLY=(process.argv[3]||'').split(',').filter(Boolean),STEP=+(process.argv[4]||6);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});p.setDefaultTimeout(5000);
const perr=[];p.on('pageerror',e=>perr.push(e.message));
await p.goto(url(FILE));await p.waitForTimeout(700);
await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
let ids=await p.evaluate(()=>[...document.querySelectorAll('.specimen')].map(a=>a.id));if(ONLY.length)ids=ids.filter(i=>ONLY.includes(i));
// sample after the next frame: where is the panel, where should it be
const sample=(x,y)=>p.evaluate(([x,y])=>new Promise(res=>requestAnimationFrame(()=>{
  const f=document.querySelector('.metric-panel');if(!f||f.hidden)return res({vis:false});
  const owner=document.querySelector('.has-inspector.metric-inspecting');if(!owner)return res({vis:true,odd:'no owner'});
  const b=owner.closest('.specimen-shell').getBoundingClientRect(),tb=(document.querySelector('.topbar')?.getBoundingClientRect().bottom||0)+8;
  const w=f.offsetWidth,h=f.offsetHeight,fr=f.getBoundingClientRect();
  const left=Math.max(8,b.left+8),right=Math.min(innerWidth-8,b.right-8),top=Math.max(tb,b.top+8),bottom=Math.min(innerHeight-8,b.bottom-8);
  let ex=x+14,ey=y-h-14;if(ex+w>right)ex=x-w-14;if(ey<top)ey=y+14;
  ex=Math.min(Math.max(ex,left),Math.max(left,right-w));ey=Math.min(Math.max(ey,top),Math.max(top,bottom-h));
  res({vis:true,dx:+(fr.left-ex).toFixed(1),dy:+(fr.top-ey).toFixed(1)});
})),[x,y]);
const rows=[];
for(const id of ids){
  await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},id);
  await p.mouse.move(4,500);await p.keyboard.press('Escape');await p.waitForTimeout(1300);
  const t=await p.evaluate(id=>{const root=document.querySelector('#'+id+' .chart-host');const R=root.getBoundingClientRect();
    const els=[...root.querySelectorAll('svg[data-metric-probe],[data-metric-target]')].filter(e=>{const r=e.getBoundingClientRect();if(r.width<4||r.height<4||e.closest('[hidden]')||r.top<100||r.bottom>innerHeight-10)return false;const x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);return top&&(e===top||e.contains(top));});
    if(!els.length)return null;const r=els[0].getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2,x0:R.left+12,x1:R.right-12,y0:Math.max(110,R.top+8),y1:Math.min(innerHeight-12,R.bottom-8)};},id);
  if(!t)continue;
  const row={id,n:0,vis:0,frozen:0,blink:0,worst:0};
  for(const dir of ['h','v']){
    const [a0,a1]=dir==='h'?[t.x0,t.x1]:[t.y0,t.y1];const steps=Math.max(8,Math.round((a1-a0)/STEP));
    await p.mouse.move(dir==='h'?a0:t.x,dir==='h'?t.y:a0);await p.waitForTimeout(250);
    let was=null;
    for(let k=0;k<=steps;k++){
      const x=dir==='h'?a0+(a1-a0)*k/steps:t.x,y=dir==='h'?t.y:a0+(a1-a0)*k/steps;
      await p.mouse.move(x,y);const s=await sample(x,y);row.n++;
      if(s.vis){row.vis++;const off=Math.max(Math.abs(s.dx??0),Math.abs(s.dy??0));if(off>1.5){row.frozen++;row.worst=Math.max(row.worst,Math.round(off));}if(was===false&&row.seen)row.blink++;row.seen=true;}
      was=s.vis;
    }
    row.seen=false;await p.mouse.move(4,500);await p.waitForTimeout(300);
  }
  delete row.seen;rows.push(row);
}
const bad=rows.filter(r=>r.frozen);
console.log(`扫动步长 ${STEP}px（每步一帧）；frozen = 面板可见但没跟到指针处的采样数`);
rows.filter(r=>r.frozen||r.blink).sort((a,b)=>b.frozen-a.frozen).forEach(r=>console.log(`  ${r.id.padEnd(12)} samples=${String(r.n).padStart(3)} visible=${String(r.vis).padStart(3)} frozen=${String(r.frozen).padStart(3)} (最大偏差 ${r.worst}px) blink=${r.blink}`));
const tot=rows.reduce((s,r)=>({n:s.n+r.n,vis:s.vis+r.vis,frozen:s.frozen+r.frozen,blink:s.blink+r.blink}),{n:0,vis:0,frozen:0,blink:0});
console.log(`合计 ${rows.length} 张卡：samples=${tot.n} visible=${tot.vis} frozen=${tot.frozen} blink=${tot.blink}`);
console.log('pageerrors',perr.length?perr.slice(0,3):'none');
console.log(tot.frozen?'RED':'GREEN');
await b.close();
