/* Filters, tabs & tables · 筛选与查询 / 切换与导航 / 表格与明细.
   Filters never produce data: they produce the current condition, and every readout is a query over one fact cube. */
(() => {
  'use strict';
  try {   // a failing module reports and stops itself; the charts and metric components keep working
  const K=window.KpiKit,KD=window.KpiData,DATA=KD.DATA,DY=DATA.daily,MO=DATA.monthly;
  const {nf,fmt,text,change,deltaHTML,statusChip}=K;
  const sum=a=>a.reduce((s,v)=>s+v,0);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let UID=0;const nid=p=>`${p}-${++UID}`;
  /* ---------- 1 · facts (generated once with exact marginals; see md 4.x 数据) ---------- */
  const FACT={
    regionDayRev:[[183,132,92,80,44,26],[191,112,99,74,40,31],[181,136,127,76,48,33],[161,148,94,76,49,25],[145,100,75,61,34,20],[146,85,84,59,31,23],[179,140,108,67,48,29],[196,155,105,86,51,29],[204,122,98,82,43,32],[198,134,132,81,47,36],[170,159,108,78,53,29],[140,106,74,60,36,20],[163,93,86,68,32,24],[226,161,136,82,55,37],[191,160,111,83,54,30],[222,145,104,92,50,33],[229,143,142,94,50,39],[213,187,141,95,65,38],[155,130,89,67,45,22],[174,104,87,74,35,24],[260,166,148,93,56,41],[199,165,125,84,58,33]], // 9/1–9/22 × 6 区域，单位 0.1 万元；行和 = 逐日营收，列和 = 区域本月
    regionDayOrd:[[32,22,16,17,8,5],[34,18,21,16,9,7],[28,27,28,15,11,7],[27,31,16,18,11,5],[28,16,15,13,7,4],[25,14,16,12,7,4],[30,29,21,14,11,5],[34,28,18,19,11,5],[36,18,19,18,9,7],[31,25,29,15,10,8],[27,32,18,17,12,5],[27,19,14,13,8,4],[31,15,18,15,7,5],[38,32,28,16,12,8],[31,30,19,18,12,5],[40,23,19,22,10,7],[38,25,31,18,11,9],[32,37,26,20,15,7],[28,24,16,14,10,4],[33,17,16,17,7,5],[43,30,30,17,11,8],[32,32,22,17,13,6]], // 同上，订单数
    augRev:[463,458,599,606,569,531,561,442,441,615,628,579,549,564,419,423,616,629,592,583,575,403,403,589,595,589,603,575,395,404,566], // 2026/8/1–8/31，0.1 万元；前 22 天 = 1,184.5，全月 = 1,656.4
    augOrd:[84,83,109,110,103,96,102,80,80,112,114,105,100,102,76,77,112,114,107,106,104,73,75,109,110,109,112,106,73,75,105],
    lyRev:[545,539,529,535,502,352,371,520,519,542,554,511,363,373,493,497,543,555,522,386,380,474], // 2025/9/1–9/22，0.1 万元；合计 1,060.5
    lyOrd:[105,104,102,103,97,68,72,100,100,104,107,98,70,72,95,96,105,107,101,74,73,91],
    regionChOrd:[[289,208,208],[216,177,151],[178,156,122],[138,110,113],[78,73,71],[45,37,48]], // 9/1–9/22 区域 × 渠道订单；行和 = 区域订单，列和 = 渠道订单
    chSegOrd:[[361,583],[338,423],[313,400]] // 渠道 × 客群订单；列和 = 新客 1,012 / 复购 1,406
  };
  const REG=[['east','华东'],['south','华南'],['north','华北'],['sw','西南'],['central','华中'],['other','其他']].map(([id,name],i)=>({id,name,i}));
  const CH=[['direct','直营'],['dist','分销'],['online','电商']].map(([id,name],i)=>({id,name,i}));
  const SEG=[['new','新客'],['repeat','复购']].map(([id,name],i)=>({id,name,i}));
  // 本月 9/1–9/22 region × channel revenue (万元); channel × customer segment revenue and orders (orders from FACT: ticket sizes differ by region and channel)
  const REG_CH=[[186.4,121.0,105.2],[130.2,96.7,71.4],[101.8,80.2,54.5],[72.5,52.3,46.4],[40.1,33.6,28.7],[25.1,18.9,21.4]];
  const CH_SEG={rev:[[198.0,358.1],[164.2,238.5],[146.8,180.8]],ord:FACT.chSegOrd};
  const TARGET_M={8:1700,9:DATA.target.month.rev};   // 月营收目标（万元）；8 月目标只用于日期面板的 8 月日格
  // Province / city / district tree: [code, name, rev 9/1–9/22, base 8/1–8/22, children]
  const GEO={
    east:[['sh','上海',168.2,158.1,[['shs','上海市',168.2,158.1,[['pd','浦东',96.4],['xh','徐汇',71.8]]]]],
          ['js','江苏',142.9,132.7,[['nj','南京',52.4,48.3,[['gl','鼓楼',21.8],['jy','建邺',18.1],['jn','江宁',12.5]]],['sz','苏州',61.3,57.2,[['gs','姑苏',24.6],['yq','工业园区',36.7]]],['xz','徐州',29.2,27.2,[['gl','鼓楼',16.9],['yl','云龙',12.3]]]]],
          ['zj','浙江',101.5,93.2,[['hz','杭州',58.7,54.0,[['xs','西湖',31.2],['bj','滨江',27.5]]],['nb','宁波',42.8,39.2,[['yz','鄞州',25.1],['hs','海曙',17.7]]]]]],
    south:[['gd','广东',201.6,176.9,[['gz','广州',88.9,78.4,[['th','天河',51.3],['yx','越秀',37.6]]],['szn','深圳',112.7,98.5,[['ns','南山',64.8],['ft','福田',47.9]]]]],
           ['fj','福建',96.7,86.3,[['fz','福州',41.5,37.2,[['gl','鼓楼',23.9],['tj','台江',17.6]]],['xm','厦门',55.2,49.1,[['sm','思明',31.4],['hl','湖里',23.8]]]]]],
    north:[['bj','北京',131.2,124.6],['tj','天津',58.9,58.3],['hb','河北',46.4,45.5]],
    sw:[['sc','四川',98.6,81.9],['cq','重庆',72.6,61.6]],
    central:[['hub','湖北',61.2,64.8],['hun','湖南',41.2,40.6]],
    other:[['ln','辽宁',28.3,25.9],['sx','陕西',22.5,20.8],['xj','新疆',14.6,13.3]]
  };
  const near=(a,b,e=.05)=>Math.abs(a-b)<e;
  // Data self-check. Never call console.assert directly: some hosts (e.g. the artifact viewer) ship a console without it,
  // and a TypeError here would stop the whole page script. A failed check is reported, never thrown.
  const check=(ok,msg)=>{if(ok)return;try{const c=typeof console==='undefined'?null:console,f=c&&(c.error||c.log);if(typeof f==='function')f.call(c,'数据自检未通过：'+msg);}catch(e){}};
  check(FACT.regionDayRev.every((row,d)=>sum(row)===Math.round(DY.rev[d]*10))&&REG.every(r=>sum(FACT.regionDayRev.map(row=>row[r.i]))===Math.round(DATA.regions[r.i][1]*10)),'FTT data: region × day revenue must add up both ways');
  check(FACT.regionDayOrd.every((row,d)=>sum(row)===DY.ord[d]),'FTT data: region × day orders must add up to daily orders');
  check(REG_CH.every((row,i)=>near(sum(row),DATA.regions[i][1]))&&CH.every(c=>near(sum(REG_CH.map(r=>r[c.i])),sum(CH_SEG.rev[c.i]))),'FTT data: region × channel must add up');
  check(REG.every(r=>sum(FACT.regionChOrd[r.i])===sum(FACT.regionDayOrd.map(row=>row[r.i])))&&CH.every(c=>sum(FACT.regionChOrd.map(row=>row[c.i]))===sum(CH_SEG.ord[c.i])),'FTT data: region × channel orders must add up both ways');
  check(sum(CH_SEG.ord.map(r=>r[0]))===DATA.orderMix.fresh&&sum(CH_SEG.ord.map(r=>r[1]))===DATA.orderMix.repeat,'FTT data: 新客 / 复购 orders must match KPI order mix');
  check(sum(FACT.augRev.slice(0,22))===Math.round(DATA.base.mom.rev*10)&&sum(FACT.augRev)===Math.round(MO.rev[7]*10)&&sum(FACT.augOrd.slice(0,22))===DATA.base.mom.ord&&sum(FACT.lyRev)===Math.round(DATA.base.yoyM.rev*10),'FTT data: August / last-year daily must match the KPI bases');
  check(REG.every(r=>near(sum(GEO[r.id].map(p=>p[2])),DATA.regions[r.i][1])&&near(sum(GEO[r.id].map(p=>p[3])),DATA.regions[r.i][2])),'FTT data: provinces must add up to regions');
  check(Object.values(GEO).flat().every(p=>!p[4]||near(sum(p[4].map(c=>c[2])),p[2])&&p[4].every(c=>near(sum(c[4].map(x=>x[2])),c[2]))),'FTT data: cities / districts must add up');

  /* ---------- 2 · dates (ISO keys, UTC arithmetic) ---------- */
  const pad=n=>String(n).padStart(2,'0');
  const key=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
  const parts=k=>{const [y,m,d]=k.split('-').map(Number);return {y,m,d};};
  const dnum=k=>{const {y,m,d}=parts(k);return Date.UTC(y,m-1,d)/864e5;};
  const dkey=n=>{const t=new Date(n*864e5);return key(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate());};
  const addD=(k,n)=>dkey(dnum(k)+n);
  const wday=k=>(new Date(dnum(k)*864e5).getUTCDay()+6)%7;           // 周一 = 0
  const WDN=['一','二','三','四','五','六','日'];
  const mdays=(y,m)=>new Date(Date.UTC(y,m,0)).getUTCDate();
  const md=k=>{const {m,d}=parts(k);return m+'/'+d;};
  const spanText=(a,b)=>a===b?md(a):`${md(a)} – ${md(b)}`;
  const DMIN=key(2026,8,1),DLAST=key(2026,9,22);                    // 逐日数据范围

  /* ---------- 3 · page-level state: URL hash + as-of date (decision D3 / D7) ---------- */
  const Hash=(()=>{
    let map=new Map(),lastPush=0,writing=false;const subs=new Map(),MARK={chartHash:1};
    function parse(){map=new Map();const h=location.hash;if(h.startsWith('#!'))new URLSearchParams(h.slice(2)).forEach((v,k)=>map.set(k,v));}
    function write(push){
      const p=new URLSearchParams();map.forEach((v,k)=>p.set(k,v));const s=p.toString();
      try{const url=new URL(location.href);url.hash=s?'!'+s:'';const now=Date.now();writing=true;
        if(push&&now-lastPush>800){history.pushState(MARK,'',url.href);lastPush=now;}else history.replaceState(MARK,'',url.href);}catch(e){}finally{writing=false;}
    }
    function notify(){parse();subs.forEach((fns,k)=>fns.forEach(fn=>fn(map.get(k))));}
    parse();
    // State lives in '#!…' hashes and in the history entries written here, which carry MARK. The entry the page opened on is
    // marked too, so stepping back to an all-default entry (no hash at all) restores the defaults. Plain anchors (#tokens,
    // href="#") create unmarked entries and leave the in-memory state alone.
    try{if(!(history.state&&history.state.chartHash))history.replaceState(Object.assign({},history.state,MARK),'',location.href);}catch(e){}
    const onNav=()=>{if(!writing&&(location.hash.startsWith('#!')||history.state&&history.state.chartHash))notify();};
    addEventListener('popstate',onNav);addEventListener('hashchange',onNav);
    return {
      get:k=>map.get(k),
      set(k,v,{push=true}={}){const s=v===null||v===undefined||v===''?null:String(v);if(s===null){if(!map.has(k))return;map.delete(k);}else{if(map.get(k)===s)return;map.set(k,s);}write(push);},
      on(k,fn){if(!subs.has(k))subs.set(k,[]);subs.get(k).push(fn);}
    };
  })();
  const AsOf=(()=>{
    let day=22;const subs=[];
    const h=Hash.get('asof');if(h&&/^09\d\d$/.test(h)){const d=+h.slice(2);if(d>=1&&d<=22)day=d;}
    function set(d,{silent=false}={}){d=Math.max(1,Math.min(22,d|0));if(d===day)return;day=d;if(!silent)Hash.set('asof',d===22?null:'09'+pad(d));
      subs.forEach(fn=>fn(day));document.dispatchEvent(new CustomEvent('chart-asof',{detail:{day,key:key(2026,9,day)}}));}
    Hash.on('asof',v=>set(v&&/^09\d\d$/.test(v)?+v.slice(2):22,{silent:true}));
    // A shared link can open on an earlier as-of date. Modules outside this one only hear the event (K04 / K05),
    // so announce the starting date once the page has been built.
    if(day!==22)setTimeout(()=>document.dispatchEvent(new CustomEvent('chart-asof',{detail:{day,key:key(2026,9,day)}})),0);
    return {get:()=>day,key:()=>key(2026,9,day),today:()=>addD(key(2026,9,day),1),set,on:fn=>subs.push(fn),latest:()=>day===22};
  })();

  /* ---------- 4 · queries over the cube ---------- */
  // Daily totals for any date with data (Aug 2026, Sep 1–22 2026, Sep 1–22 2025).
  function dayVal(k){const {y,m,d}=parts(k);
    if(y===2026&&m===9&&d<=22)return {rev:DY.rev[d-1],ord:DY.ord[d-1]};
    if(y===2026&&m===8)return {rev:FACT.augRev[d-1]/10,ord:FACT.augOrd[d-1]};
    if(y===2025&&m===9&&d<=22)return {rev:FACT.lyRev[d-1]/10,ord:FACT.lyOrd[d-1]};
    return null;}
  function span(from,to){let rev=0,ord=0,days=0,missing=0;for(let n=dnum(from);n<=dnum(to);n++){const v=dayVal(dkey(n));if(v){rev+=v.rev;ord+=v.ord;days++;}else missing++;}return {rev,ord,days,missing,total:days+missing};}
  // Month totals from the KPI facts (complete months only), for 本季 / 本年 style ranges.
  const monthRev=m=>MO.rev[m-1],monthOrd=m=>MO.ord[m-1];
  const chShare=REG_CH.map(row=>{const s=sum(row);return row.map(v=>v/s);});
  const chShareOrd=FACT.regionChOrd.map(row=>{const s=sum(row);return row.map(v=>v/s);});   // orders split by channel differ from revenue (ticket size)
  const chS=metric=>metric==='ord'?chShareOrd:chShare;
  // 基期（8 月）结构与 9 月不同：电商、新客涨得快，直营、复购慢。每个区域的基期合计不变，只改结构。
  const GROW_CH=[1.05,1.08,1.16],GROW_SEG=[1.15,1.04];
  const reshape=(rows,g)=>rows.map(row=>{const w=row.map((v,i)=>v/g[i]),s=sum(w);return w.map(v=>v/s);});
  const chShareBase=reshape(chShare,GROW_CH),chShareOrdBase=reshape(chShareOrd,GROW_CH),chSB=metric=>metric==='ord'?chShareOrdBase:chShareBase;
  const segShare={rev:CH_SEG.rev.map(r=>{const s=sum(r);return r.map(v=>v/s);}),ord:CH_SEG.ord.map(r=>{const s=sum(r);return r.map(v=>v/s);})};
  const segShareBase={rev:reshape(segShare.rev,GROW_SEG),ord:reshape(segShare.ord,GROW_SEG)};
  const baseShare=DATA.regions.map(r=>r[2]/DATA.base.mom.rev);
  // August orders by region: base revenue ÷ the region's September ticket size, normalised (so each region keeps its own 客单价).
  const regOrd=REG.map(r=>sum(FACT.regionDayOrd.map(row=>row[r.i]))),baseOrdRaw=DATA.regions.map((r,i)=>r[2]/(r[1]/regOrd[i])),baseOrdShare=baseOrdRaw.map(v=>v/sum(baseOrdRaw));
  const setOf=a=>a&&a.length?new Set(a):null;
  // Channel / segment factor for one region (share of that region's value that passes the filter).
  function factor(r,metric,ch,sg,base=false){if(!ch&&!sg)return 1;const cs=base?chSB(metric):chS(metric),ss=base?segShareBase:segShare;let f=0;CH.forEach(c=>{if(ch&&!ch.has(c.id))return;const sf=sg?SEG.reduce((s,x)=>s+(sg.has(x.id)?ss[metric][c.i][x.i]:0),0):1;f+=cs[r][c.i]*sf;});return f;}
  // f = {from:1, to:asOf, regions:[ids], channels:[ids], segs:[ids]}; September days only.
  function q(f={},by=null){
    const from=f.from||1,to=Math.min(f.to||AsOf.get(),AsOf.get()),rg=setOf(f.regions),ch=setOf(f.channels),sg=setOf(f.segs);
    const out=by?new Map():null;let rev=0,ord=0;
    for(let d=from;d<=to;d++)REG.forEach(r=>{if(rg&&!rg.has(r.id))return;
      const R=FACT.regionDayRev[d-1][r.i]/10*factor(r.i,'rev',ch,sg),O=FACT.regionDayOrd[d-1][r.i]*factor(r.i,'ord',ch,sg);rev+=R;ord+=O;
      if(by==='region'||by==='day'){const k=by==='region'?r.id:d;const a=out.get(k)||{rev:0,ord:0};a.rev+=R;a.ord+=O;out.set(k,a);}
      if(by==='channel')CH.forEach(c=>{if(ch&&!ch.has(c.id))return;const s1=chShare[r.i][c.i],sr=sg?SEG.reduce((s,x)=>s+(sg.has(x.id)?segShare.rev[c.i][x.i]:0),0):1,so=sg?SEG.reduce((s,x)=>s+(sg.has(x.id)?segShare.ord[c.i][x.i]:0),0):1;
        const a=out.get(c.id)||{rev:0,ord:0};a.rev+=FACT.regionDayRev[d-1][r.i]/10*s1*sr;a.ord+=FACT.regionDayOrd[d-1][r.i]*chShareOrd[r.i][c.i]*so;out.set(c.id,a);});});
    return by?out:{rev,ord};
  }
  // Same days of August (环比同期): August daily totals × each region's base share; channel / segment mix as in September.
  function qBase(f={},by=null){
    const from=f.from||1,to=Math.min(f.to||AsOf.get(),31),rg=setOf(f.regions),ch=setOf(f.channels),sg=setOf(f.segs);const out=by?new Map():null;let rev=0,ord=0;
    for(let d=from;d<=to;d++){const tr=FACT.augRev[d-1]/10,to_=FACT.augOrd[d-1];REG.forEach(r=>{if(rg&&!rg.has(r.id))return;const R=tr*baseShare[r.i]*factor(r.i,'rev',ch,sg,true),O=to_*baseOrdShare[r.i]*factor(r.i,'ord',ch,sg,true);rev+=R;ord+=O;
      if(by==='region'){const a=out.get(r.id)||{rev:0,ord:0};a.rev+=R;a.ord+=O;out.set(r.id,a);}
      if(by==='channel')CH.forEach(c=>{if(ch&&!ch.has(c.id))return;const sr=sg?SEG.reduce((s,x)=>s+(sg.has(x.id)?segShareBase.rev[c.i][x.i]:0),0):1,so=sg?SEG.reduce((s,x)=>s+(sg.has(x.id)?segShareBase.ord[c.i][x.i]:0),0):1;
        const a=out.get(c.id)||{rev:0,ord:0};a.rev+=tr*baseShare[r.i]*chShareBase[r.i][c.i]*sr;a.ord+=to_*baseOrdShare[r.i]*chShareOrdBase[r.i][c.i]*so;out.set(c.id,a);});});}
    return by?out:{rev,ord};
  }
  // Province / city / district values: region value × its fixed share (month facts); base likewise.
  const geoIndex=new Map();
  REG.forEach(r=>GEO[r.id].forEach(p=>{const [code,name,rev,base,kids]=p;geoIndex.set(r.id+'.'+code,{path:[r.id,code],names:[r.name,name],rev,base,region:r});
    (kids||[]).forEach(c=>{geoIndex.set(r.id+'.'+code+'.'+c[0],{path:[r.id,code,c[0]],names:[r.name,name,c[1]],rev:c[2],base:c[3],region:r});
      (c[4]||[]).forEach(x=>geoIndex.set(r.id+'.'+code+'.'+c[0]+'.'+x[0],{path:[r.id,code,c[0],x[0]],names:[r.name,name,c[1],x[1]],rev:x[2],base:c[3]*x[2]/c[2],region:r}));});}));
  function geo(path,f={}){const g=geoIndex.get(path);if(!g)return null;const r=g.region,reg=DATA.regions[r.i];
    const cur=q({...f,regions:[r.id]}),base=qBase({...f,regions:[r.id]});
    return {rev:cur.rev*g.rev/reg[1],ord:cur.ord*g.rev/reg[1],base:base.rev*g.base/reg[2],names:g.names,path};}
  // Round a list so the rounded parts add up to the rounded total (largest remainder). step = 0.1 for 万元, 1 for counts.
  function apportion(vals,step=.1){const k=1/step,total=Math.round(sum(vals)*k+1e-9),fl=vals.map(v=>Math.floor(v*k+1e-9));let rem=total-sum(fl);
    vals.map((v,i)=>[v*k-fl[i],i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(rem>0){fl[i]++;rem--;}});return fl.map(v=>Math.round(v)/k);}
  const FD={REG,CH,SEG,GEO,geoIndex,REG_CH,CH_SEG,TARGET_M,q,qBase,geo,span,dayVal,monthRev,monthOrd,apportion,
    regById:id=>REG.find(r=>r.id===id),chById:id=>CH.find(c=>c.id===id)};
  window.FilterData=FD;
