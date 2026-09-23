// Red/green loop for the two symptoms the user reported:
//  A1 点击后移出卡片：click a target, move the pointer off the card → panel hidden within 450 ms
//  A2 移动中不消失：hover a target, then keep moving over empty space inside the card for ~600 ms → panel hidden,
//     and while it is still visible it must not stay frozen where it was (it follows or goes away)
import { chromium } from 'playwright';
import { PAGE, url, out } from '../lib.mjs';
const FILE=process.argv[2]||PAGE,ONLY=(process.argv[3]||'').split(',').filter(Boolean);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});p.setDefaultTimeout(4000);
const perr=[];p.on('pageerror',e=>perr.push(e.message));
await p.goto(url(FILE));await p.waitForTimeout(700);
await p.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
const vis=()=>p.evaluate(()=>{const f=document.querySelector('.metric-panel');return !!f&&!f.hidden;});
let ids=await p.evaluate(()=>[...document.querySelectorAll('.specimen')].map(a=>a.id));if(ONLY.length)ids=ids.filter(i=>ONLY.includes(i));
const a1=[],a2=[];let n1=0,n2=0;
for(const id of ids){
  await p.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'start'});window.scrollBy(0,-90);},id);
  await p.mouse.move(4,500);await p.waitForTimeout(1300);
  const t=await p.evaluate(id=>{const root=document.querySelector('#'+id+' .chart-host');const R=root.getBoundingClientRect();
    const els=[...root.querySelectorAll('svg[data-metric-probe],[data-metric-target]')].filter(e=>{const r=e.getBoundingClientRect();if(r.width<4||r.height<4||e.closest('[hidden]')||r.top<100||r.bottom>innerHeight-10)return false;const x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);return top&&(e===top||e.contains(top));});
    if(!els.length)return null;const e=els[0],r=e.getBoundingClientRect();
    // an empty strip inside the card: the chart-host's own top padding (no targets there)
    return {x:r.left+r.width/2,y:r.top+r.height/2,ey:R.top+6,ex0:R.left+20,ex1:R.right-20,d:e.tagName.toLowerCase()+'.'+String(e.className.baseVal??e.className).split(' ')[0]};},id);
  if(!t)continue;
  // A1
  await p.keyboard.press('Escape');await p.mouse.move(4,500);await p.waitForTimeout(200);
  await p.mouse.move(t.x-2,t.y);await p.mouse.move(t.x,t.y);await p.waitForTimeout(200);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(150);
  if(await vis()){n1++;await p.mouse.move(4,t.y,{steps:6});await p.waitForTimeout(450);if(await vis())a1.push(`${id} (${t.d})`);}
  // A2
  await p.keyboard.press('Escape');await p.mouse.move(4,500);await p.waitForTimeout(250);
  await p.mouse.move(t.x-2,t.y);await p.mouse.move(t.x,t.y);await p.waitForTimeout(220);
  if(await vis()){n2++;
    const before=await p.evaluate(()=>{const f=document.querySelector('.metric-panel');const r=f.getBoundingClientRect();return Math.round(r.left)+','+Math.round(r.top);});
    await p.mouse.move(t.x,t.ey,{steps:4});
    for(let k=0;k<36;k++){await p.mouse.move(t.ex0+(t.ex1-t.ex0)*(k%18)/18,t.ey);await p.waitForTimeout(16);}
    const r=await p.evaluate(()=>{const f=document.querySelector('.metric-panel');const q=f.getBoundingClientRect();return {vis:!f.hidden,pos:Math.round(q.left)+','+Math.round(q.top)};});
    if(r.vis)a2.push(`${id} (${t.d})${r.pos===before?' · 面板停在原处不动':''}`);}
}
console.log(`A1 点击后移出卡片仍显示：${a1.length} / ${n1}`);a1.forEach(s=>console.log('   ',s));
console.log(`A2 移到卡内空白处并持续移动 ~600ms 仍显示：${a2.length} / ${n2}`);a2.forEach(s=>console.log('   ',s));
console.log('pageerrors',perr.length?perr.slice(0,3):'none');
console.log(a1.length+a2.length?'RED':'GREEN');
await b.close();
