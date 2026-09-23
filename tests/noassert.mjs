// Simulate a host whose console has no assert(): the page must still build every card.
import { chromium } from 'playwright';
import { PAGE, url, out } from './lib.mjs';
const FILE=process.argv[2]||PAGE;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console.error: '+m.text());});
await p.addInitScript(()=>{try{console.assert=undefined;}catch(e){}});
await p.goto(url(FILE));await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const cards=[...document.querySelectorAll('.specimen')];const empty=cards.filter(c=>!c.querySelector('.chart-host')?.children.length).map(c=>c.id);return {cards:cards.length,empty:empty.length,emptyIds:empty.slice(0,12),hasFD:!!window.FilterData,hasKD:!!window.KpiData};});
console.log(JSON.stringify(r));console.log('errors:',errs.length?errs.slice(0,5):'none');
await b.close();
