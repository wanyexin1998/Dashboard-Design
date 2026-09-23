/* KPI cards & metric panels · 指标卡 / 指标面板. One set of facts; every derived number is computed, never typed. */
(() => {
  'use strict';
  try {   // a failing module reports and stops itself; the charts above keep working
  /* ---------- 1 · facts (as of 9/22; refreshed 9/23 09:30) ---------- */
  const DATA={
    asOf:{day:22,monthDays:30,qDay:84,qDays:92,yDay:265,yDays:365,updated:'9/23 09:30',stale:'9/23 01:30'},
    daily:{ // 9/1–9/22
      rev:[55.7,54.7,60.1,55.3,43.5,42.8,57.1,62.2,58.1,62.8,59.7,43.6,46.6,69.7,62.9,64.6,69.7,73.9,50.8,49.8,76.4,66.4], // 万元
      ord:[100,105,116,108,83,78,110,115,107,118,111,85,91,134,115,121,132,137,96,95,139,122],
      ref:[2,1,3,2,1,2,2,3,2,2,1,1,2,3,2,2,3,2,1,2,3,2]
    },
    hourly:[0.6,0.3,0.2,0.1,0.1,0.3,0.9,1.7,3.1,4.2,4.7,4.4,3.7,4.0,4.6,5.1,4.4,3.9,3.5,3.8,4.4,4.0,2.9,1.5], // 9/22 按小时，万元
    monthly:{ // 1–9 月；9 月只到 22 日
      days:[31,28,31,30,31,30,31,31,22],
      rev:[1186.4,1003.7,1178.9,1204.6,1248.3,1297.1,1404.2,1656.4,1286.4],
      ord:[2354,2015,2316,2348,2410,2475,2635,3023,2418],
      ref:[56,50,53,52,51,54,55,67,44],
      margin:[.366,.359,.371,.374,.378,.376,.380,.373,.384],
      ontime:[.978,.969,.976,.979,.982,.984,.976,.948,.9644]
    },
    base:{ // 同期基期：营收（万元）、订单、退款单、毛利率、及时率
      mom:{label:'环比（同期）',short:'环比',span:'8/1–8/22',was:'上期',rev:1184.5,ord:2149,ref:47,margin:.372,ontime:.951},
      yoyM:{label:'同比',short:'同比',span:'2025/9/1–9/22',was:'去年',rev:1060.5,ord:2044,ref:43,margin:.390,ontime:.9724},
      qoq:{label:'环比（上季同期）',short:'环比',span:'4/1–6/22',was:'上季',rev:3396.8,ord:6561,ref:143,margin:.375,ontime:.981},
      yoyY:{label:'同比',short:'同比',span:'2025/1/1–9/22',was:'去年',rev:9725.2,ord:19160,ref:452,margin:.381,ontime:.9786}
    },
    target:{month:{rev:1800,ord:3300,margin:.38,refund:.02,ontime:.98},quarter:{rev:4750},year:{rev:15600}},
    orderMix:{fresh:1012,repeat:1406},
    regions:[['华东',412.6,384.0],['华南',298.3,263.2],['华北',236.5,228.4],['西南',171.2,143.5],['华中',102.4,105.4],['其他',65.4,60.0]], // 本月, 8/1–8/22
    funnel:[['访客',48210],['注册',12684],['线索',6532],['商机',3988],['成交',2418]],
    service:{week:{label:'本周',span:'9/16–9/22',ontime:.9862,response:5.4},month:{label:'本月',span:'9/1–9/22',response:3.6},last:{label:'上月',span:'8/1–8/31',response:8.7}}
  };
  /* ---------- 2 · derived values ---------- */
  const sum=a=>a.reduce((s,v)=>s+v,0),A=DATA.asOf,MO=DATA.monthly,DY=DATA.daily;
  const agg=idx=>{const rev=sum(idx.map(i=>MO.rev[i])),ord=sum(idx.map(i=>MO.ord[i])),ref=sum(idx.map(i=>MO.ref[i]));
    return {rev,ord,ref,aov:rev*1e4/ord,refund:ref/ord,margin:sum(idx.map(i=>MO.rev[i]*MO.margin[i]))/rev,ontime:sum(idx.map(i=>MO.ord[i]*MO.ontime[i]))/ord};};
  const rated=b=>({...b,aov:b.rev*1e4/b.ord,refund:b.ref/b.ord});
  const B={mom:rated(DATA.base.mom),yoyM:rated(DATA.base.yoyM),qoq:rated(DATA.base.qoq),yoyY:rated(DATA.base.yoyY)};
  const SC={
    month:{id:'month',label:'本月',span:'9/1–9/22',cur:agg([8]),cmp:B.mom,cmp2:B.yoyM,elapsed:A.day,total:A.monthDays,target:DATA.target.month.rev},
    quarter:{id:'quarter',label:'本季',span:'7/1–9/22',cur:agg([6,7,8]),cmp:B.qoq,elapsed:A.qDay,total:A.qDays,target:DATA.target.quarter.rev},
    year:{id:'year',label:'本年',span:'1/1–9/22',cur:agg([0,1,2,3,4,5,6,7,8]),cmp:B.yoyY,elapsed:A.yDay,total:A.yDays,target:DATA.target.year.rev}
  };
  Object.values(SC).forEach(s=>{s.time=s.elapsed/s.total;s.left=s.total-s.elapsed;s.rate=s.cur.rev/s.target;s.gap=s.target-s.cur.rev;s.need=s.gap/s.left;});
  const TM=DATA.target.month;TM.aov=TM.rev*1e4/TM.ord; // 客单价目标 = 营收目标 ÷ 订单目标
  const CUM=DY.rev.reduce((a,v)=>(a.push((a.length?a[a.length-1]:0)+v),a),[]);
  const LAST7=sum(DY.rev.slice(-7))/7,FORECAST=CUM[CUM.length-1]+LAST7*SC.month.left;
  const near=(a,b,e=.05)=>Math.abs(a-b)<e;
  // Data self-check. Never call console.assert directly: some hosts (e.g. the artifact viewer) ship a console without it,
  // and a TypeError here would stop the whole page script. A failed check is reported, never thrown.
  const check=(ok,msg)=>{if(ok)return;try{const c=typeof console==='undefined'?null:console,f=c&&(c.error||c.log);if(typeof f==='function')f.call(c,'数据自检未通过：'+msg);}catch(e){}};
  check(near(sum(DY.rev),MO.rev[8])&&sum(DY.ord)===MO.ord[8]&&sum(DY.ref)===MO.ref[8],'KPI data: daily must add up to September');
  check(near(sum(DATA.hourly),DY.rev[DY.rev.length-1]),'KPI data: hours must add up to 9/22');
  check(near(sum(DATA.regions.map(r=>r[1])),MO.rev[8])&&near(sum(DATA.regions.map(r=>r[2])),DATA.base.mom.rev),'KPI data: regions must add up');
  check(DATA.funnel[DATA.funnel.length-1][1]===MO.ord[8]&&DATA.orderMix.fresh+DATA.orderMix.repeat===MO.ord[8],'KPI data: 成交 = 订单数 = 新客 + 复购');
  const MET={
    rev:{name:'营收',en:'REVENUE',kind:'amount',polarity:'up',change:'ratio',note:'确认收入，按签收日统计；不含退款'},
    ord:{name:'订单数',en:'ORDERS',kind:'count',unit:'单',polarity:'up',change:'ratio',note:'已支付订单，含新客与复购'},
    aov:{name:'客单价',en:'AOV',kind:'yuan',polarity:'up',change:'ratio',note:'营收 ÷ 订单数'},
    margin:{name:'毛利率',en:'MARGIN',kind:'rate',polarity:'up',change:'pp',note:'（营收 − 成本）÷ 营收'},
    refund:{name:'退款率',en:'REFUND',kind:'rate',polarity:'down',change:'pp',note:'退款订单 ÷ 订单数'},
    ontime:{name:'交付及时率',en:'ON-TIME',kind:'rate',polarity:'up',change:'pp',note:'按承诺时效签收的订单 ÷ 已签收订单'}
  };
  /* ---------- 3 · KpiKit: format, compare, judge, animate ---------- */
  const K=window.KpiKit=(()=>{
    const MINUS='−';
    // One Intl.NumberFormat per precision: toLocaleString with options builds a new formatter on every call, and readouts format on every move.
    const NF=new Map(),nf=(v,d=0)=>{let f=NF.get(d);if(!f){f=new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});NF.set(d,f);}return f.format(Math.abs(v));};
    const sgn=(v,d)=>v<0&&Math.round(Math.abs(v)*10**d)>0?MINUS:'';
    const scaleOf=(kind,v)=>kind==='amount'?(Math.abs(v)>=1e4?'亿':'万'):(kind==='count'||kind==='yuan')&&Math.abs(v)>=1e4?'万':'';
    // amount is stored in 万元. opts.scale pins the unit so one card keeps one unit (the largest number decides).
    function fmt(v,kind,o={}){
      if(v===null||v===undefined||!Number.isFinite(v))return {num:'—',unit:''};
      const sc=o.scale??scaleOf(kind,v);
      switch(kind){
        case 'amount':return sc==='亿'?{num:sgn(v,2)+nf(v/1e4,2),unit:o.short?'亿':'亿元'}:{num:sgn(v,1)+nf(v,1),unit:o.short?'万':'万元'};
        case 'yuan':return sc==='万'?{num:sgn(v/1e4,1)+nf(v/1e4,1),unit:'万元'}:{num:sgn(v,0)+nf(v,0),unit:'元'};
        case 'count':return sc==='万'?{num:sgn(v/1e4,1)+nf(v/1e4,1),unit:'万'+(o.unit||'')}:{num:sgn(v,0)+nf(v,0),unit:o.unit||''};
        case 'rate':{const d=o.d??1;return {num:sgn(v*100,d)+nf(v*100,d)+'%',unit:''};}
        case 'hours':return {num:sgn(v,1)+nf(v,1),unit:'小时'};
        default:return {num:sgn(v,o.d??0)+nf(v,o.d??0),unit:o.unit||''};
      }
    }
    const text=(v,kind,o)=>{const f=fmt(v,kind,o);return f.unit?f.num+' '+f.unit:f.num;};
    const cardScale=(kind,...vals)=>scaleOf(kind,Math.max(...vals.map(Math.abs)));
    // Period change: ratio in %, rate metrics in pp. Arrow = direction, colour = good / bad by polarity.
    function change(cur,base,{change:mode='ratio',polarity='up'}={}){
      if(!Number.isFinite(cur)||!Number.isFinite(base)||(mode==='ratio'&&!base))return null;
      return fromRaw(mode==='pp'?(cur-base)*100:(cur/base-1)*100,mode,polarity);
    }
    function fromRaw(raw,mode='ratio',polarity='up'){
      const shown=Math.round(raw*10)/10,flat=Math.abs(shown)<.05,up=raw>0,unit=mode==='pp'?'pp':'%';
      const tone=flat||polarity==='neutral'?'flat':(polarity==='up')===up?'good':'bad';
      return {raw,shown,flat,up,tone,unit,arrow:flat?'→':up?'↑':'↓',text:(flat?'':up?'+':MINUS)+nf(shown,1)+unit,
        dir:flat?'持平':up?'上升':'下降',verdict:flat?'持平':tone==='good'?'向好':tone==='bad'?'向差':'不判好坏'};
    }
    const deltaHTML=(d,k)=>`<span class="kpi-delta ${d?d.tone:'flat'}"${k?` data-k="${k}"`:''}>${d?`<i aria-hidden="true">${d.arrow}</i>${d.text}`:'—'}</span>`;
    function setDelta(el,d){el.className='kpi-delta '+(d?d.tone:'flat');el.innerHTML=d?`<i aria-hidden="true">${d.arrow}</i>${d.text}`:'—';}
    // Ahead / behind: subtract the two numbers exactly as the card shows them, so a reader can check it.
    function pace(rate,time){const pp=(Math.round(rate*1000)-Math.round(time*1000))/10;
      return Math.abs(pp)<.5?{tone:'flat',icon:'=',label:'持平',pp}:pp>0?{tone:'good',icon:'↑',label:'超前 '+nf(pp,1)+'pp',pp}:{tone:'warn',icon:'↓',label:'滞后 '+nf(pp,1)+'pp',pp};}
    const STATUS={good:{icon:'✓',label:'正常'},warn:{icon:'!',label:'关注'},bad:{icon:'✕',label:'异常'}};
    // Thresholds are judged on the raw value, never on the rounded display.
    const band=(v,[lo,hi],polarity='up')=>polarity==='down'?(v<=lo?'good':v<=hi?'warn':'bad'):(v>=hi?'good':v>=lo?'warn':'bad');
    const chipHTML=(tone,icon,label,k)=>`<span class="kpi-chip ${tone}"${k?` data-k="${k}"`:''}><i aria-hidden="true">${icon}</i>${label}</span>`;
    function setChip(el,tone,icon,label){el.className='kpi-chip '+tone;el.innerHTML=`<i aria-hidden="true">${icon}</i>${label}`;}
    const statusChip=(tone,k)=>chipHTML(tone,STATUS[tone].icon,STATUS[tone].label,k);
    // Count numbers from → to in one frame loop; the box keeps its final width so the unit does not slide.
    function count(C,key,items,dur=700){
      items.forEach(it=>{it.el.style.minWidth='';it.el.textContent=it.format(it.to);const w=it.el.getBoundingClientRect().width;if(w)it.el.style.minWidth=Math.ceil(w)+'px';});
      C.animate(key,dur,t=>items.forEach(it=>{const from=it.from??0;it.el.textContent=it.format(from+(it.to-from)*t);if(t>=1)it.el.style.minWidth='';}));
    }
    const lerp=(a,b,t)=>a+(b-a)*t;
    // Mini chart (area / line / bars) drawn at its real pixel width. The readout is written beside it;
    // the headline number stays on the current period (decision D6).
    function spark(C,svg,o){
      const n=o.values.length,H=o.height||44,pad=o.pad??3,kind=o.kind||'area';
      const vmax=o.max??Math.max(...o.values),vmin=kind==='bars'?0:(o.min??Math.min(...o.values));
      let W=0,progress=1,hot=null,pressed=false;
      svg.classList.add('kpi-spark');svg.style.height=H+'px';
      svg.setAttribute('role','slider');svg.setAttribute('tabindex','0');svg.setAttribute('aria-label',o.name+'；左右方向键逐点查看');
      svg.setAttribute('aria-valuemin','1');svg.setAttribute('aria-valuemax',String(n));
      const area=kind==='area'?C.s('path',{fill:o.color,stroke:'none'},svg):null;
      const line=kind!=='bars'?C.s('path',{fill:'none',stroke:o.color,'stroke-width':1.6,'stroke-linejoin':'round','stroke-linecap':'round',pathLength:1,'stroke-dasharray':'1 1'},svg):null;
      const bars=kind==='bars'?o.values.map(()=>C.s('rect',{rx:1,fill:o.color},svg)):[];
      const guide=C.s('line',{stroke:'var(--c-text)','stroke-opacity':.4,'stroke-dasharray':'2 3',visibility:'hidden','pointer-events':'none'},svg);
      const last=kind!=='bars'?C.s('circle',{r:3.2,fill:o.color,stroke:'var(--c-surface)','stroke-width':2,'pointer-events':'none'},svg):null;
      const hdot=kind!=='bars'?C.s('circle',{r:3,fill:'var(--c-surface)',stroke:'var(--c-text)','stroke-width':1.5,visibility:'hidden','pointer-events':'none'},svg):null;
      const step=()=>kind==='bars'?(W-2*pad)/n:(W-2*pad)/Math.max(1,n-1);
      const x=i=>kind==='bars'?pad+(i+.5)*step():pad+i*step();
      const y=v=>H-pad-(v-vmin)/((vmax-vmin)||1)*(H-2*pad);
      function draw(){
        W=svg.getBoundingClientRect().width;if(!W)return;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
        if(kind==='bars'){const bw=Math.max(1.5,Math.min(9,step()*.64));bars.forEach((r,i)=>{const h=Math.max(1,o.values[i]/(vmax||1)*(H-2*pad)*progress);r.setAttribute('x',(x(i)-bw/2).toFixed(1));r.setAttribute('width',bw.toFixed(1));r.setAttribute('y',(H-pad-h).toFixed(1));r.setAttribute('height',h.toFixed(1));const partial=o.partialLast&&i===n-1;r.setAttribute('stroke-dasharray',partial?'2 2':'none');C.paint(r,'stroke',partial?o.color:'none');});}
        else{const d=o.values.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join('');line.setAttribute('d',d);line.setAttribute('stroke-dashoffset',String(1-progress));
          if(area){area.setAttribute('d',d+`L${x(n-1).toFixed(1)},${H}L${x(0).toFixed(1)},${H}Z`);area.setAttribute('fill-opacity',(.15*progress).toFixed(3));}
          last.setAttribute('cx',x(n-1));last.setAttribute('cy',y(o.values[n-1]));last.setAttribute('opacity',progress>=.98?1:0);}
        mark();
      }
      // Scrubbing only moves the marks (bar emphasis, hollow dot, guide). The shape is redrawn on resize and entrance only,
      // and a move that stays on the same point writes nothing.
      function mark(){
        if(!W){draw();return;}
        if(kind==='bars')bars.forEach((r,i)=>{const partial=o.partialLast&&i===n-1;r.setAttribute('opacity',hot===null?(partial?.45:1):i===hot?1:.32);});
        else{if(hot!==null){hdot.setAttribute('cx',x(hot));hdot.setAttribute('cy',y(o.values[hot]));}hdot.setAttribute('visibility',hot===null?'hidden':'visible');}
        if(hot!==null){guide.setAttribute('x1',x(hot));guide.setAttribute('x2',x(hot));guide.setAttribute('y1',0);guide.setAttribute('y2',H);}
        guide.setAttribute('visibility',hot===null||kind==='bars'?'hidden':'visible');
      }
      let marked=false;
      function set(i){if(marked&&i===hot)return;marked=true;hot=i;mark();const at=i??n-1;svg.setAttribute('aria-valuenow',String(at+1));svg.setAttribute('aria-valuetext',o.valueText(at));o.onScrub&&o.onScrub(i);}
      const at=e=>{const r=svg.getBoundingClientRect(),px=e.clientX-r.left;return C.clamp(kind==='bars'?Math.floor((px-pad)/step()):Math.round((px-pad)/step()),0,n-1);};
      svg.addEventListener('pointerdown',e=>{pressed=true;try{svg.setPointerCapture(e.pointerId);}catch(_){}set(at(e));});
      svg.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&!pressed)return;set(at(e));});
      svg.addEventListener('pointerup',()=>{pressed=false;});svg.addEventListener('pointercancel',()=>{pressed=false;});
      svg.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&!pressed)set(null);});
      svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='Escape'){set(null);return;}const cur=hot??n-1;set(e.key==='Home'?0:e.key==='End'?n-1:C.clamp(cur+(e.key==='ArrowLeft'?-1:1),0,n-1));});
      svg.addEventListener('blur',()=>{if(hot!==null)set(null);});
      new ResizeObserver(draw).observe(svg);
      set(null);
      return {draw,progress(p){progress=p;draw();},clear(){hot=null;draw();o.onScrub&&o.onScrub(null);}};
    }
    // Probe-driven chart canvas: re-measure on resize and redraw in real pixels.
    function canvas(svg,draw){let W=0;const ro=new ResizeObserver(()=>{const w=svg.getBoundingClientRect().width;if(w&&Math.abs(w-W)>.5){W=w;draw(W);}});ro.observe(svg);return {width:()=>W,redraw(){const w=svg.getBoundingClientRect().width;if(w){W=w;draw(W);}}};}
    // Roving focus inside a group (strip items, tabs): one tab stop, arrows move.
    function roving(items,onMove){
      items.forEach((el,i)=>{el.setAttribute('tabindex',i?'-1':'0');el.addEventListener('keydown',e=>{
        const k=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(k))return;e.preventDefault();
        const next=k==='Home'?0:k==='End'?items.length-1:(i+(k==='ArrowLeft'||k==='ArrowUp'?-1:1)+items.length)%items.length;
        e.stopPropagation();items.forEach((x,j)=>x.setAttribute('tabindex',j===next?'0':'-1'));items[next].focus();onMove&&onMove(next);});
        el.addEventListener('focus',()=>items.forEach(x=>x.setAttribute('tabindex',x===el?'0':'-1')));});
    }
    function niceStep(span,count=3){const raw=span/Math.max(1,count),p=10**Math.floor(Math.log10(raw)),m=raw/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;}
    function niceDomain(lo,hi,count=3){const s=niceStep(hi-lo,count);return {min:Math.floor(lo/s)*s,max:Math.ceil(hi/s)*s,step:s};}
    return {MINUS,nf,fmt,text,cardScale,change,fromRaw,deltaHTML,setDelta,pace,STATUS,band,chipHTML,setChip,statusChip,count,lerp,spark,canvas,roving,niceDomain};
  })();
  const {nf,fmt,text,change,deltaHTML,setDelta,pace,band,chipHTML,setChip,statusChip,count,lerp}=K;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const head=(en,name,right='',info=false)=>`<div class="kpi-head"><span class="kpi-eyebrow">${en}<b>${name}</b></span>${info?`<button type="button" class="kpi-info" data-k="info" aria-label="口径：${name}">i</button>`:''}${right}</div>`;
  const period=t=>`<span class="kpi-period" data-k="period">${t}</span>`;
  const seg=(label,choices,active)=>`<div class="segmented" role="group" aria-label="${label}">${choices.map(([id,name])=>`<button type="button" data-choice="${id}" aria-pressed="${id===active}">${name}</button>`).join('')}</div>`;
  function segWire(root,fn){const bs=[...root.querySelectorAll('[data-choice]')];const set=id=>bs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===id)));bs.forEach(b=>b.addEventListener('click',()=>{set(b.dataset.choice);fn(b.dataset.choice);}));return set;}
  const q=(el,k)=>el.querySelector(`[data-k="${k}"]`);
  const valueHTML=(k='num',unit='')=>`<div class="kpi-value" data-k="${k}-box"><span class="kpi-num" data-k="${k}">0</span><span class="unit" data-k="${k}-unit">${unit}</span></div>`;
  const cmpRow=(label,d,base,k)=>`<span data-k="${k}"><span>${label}</span>${deltaHTML(d)}</span>`;
  const signed=(v,kind,o)=>{const f=text(v,kind,o);return v>0?'+'+f:f;};
  const DAYS=DY.rev.map((_,i)=>'9/'+(i+1));
  // Month / quarter / year as of a September day (page-level 截至日, decision D3). scAt(22) equals SC.
  function scAt(day){const d=Math.max(1,Math.min(A.day,day|0)),rev=sum(DY.rev.slice(0,d)),ord=sum(DY.ord.slice(0,d)),ref=sum(DY.ref.slice(0,d));
    const mk=(id,label,from,prevRev,prevOrd,before,total,target)=>{const s={id,label,span:`${from}–9/${d}`,cur:{rev:prevRev+rev,ord:prevOrd+ord},elapsed:before+d,total,target};
      s.time=s.elapsed/s.total;s.left=s.total-s.elapsed;s.rate=s.cur.rev/s.target;s.gap=s.target-s.cur.rev;s.need=s.gap/s.left;return s;};
    const out={month:mk('month','本月','9/1',0,0,0,A.monthDays,DATA.target.month.rev),quarter:mk('quarter','本季','7/1',MO.rev[6]+MO.rev[7],MO.ord[6]+MO.ord[7],62,A.qDays,DATA.target.quarter.rev),
      year:mk('year','本年','1/1',sum(MO.rev.slice(0,8)),sum(MO.ord.slice(0,8)),243,A.yDays,DATA.target.year.rev)};
    out.last7=sum(DY.rev.slice(Math.max(0,d-7),d))/Math.min(7,d);out.day=d;return out;}
  check(['month','quarter','year'].every(k=>near(scAt(22)[k].cur.rev,SC[k].cur.rev)&&scAt(22)[k].elapsed===SC[k].elapsed),'KPI data: scAt(22) must equal SC');
  window.KpiData={DATA,SC,MET,scAt};
