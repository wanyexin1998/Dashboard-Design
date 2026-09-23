  /* ---------- K06 · threshold status (judged on the raw value) ---------- */
  ChartDemos.kpi_status=(root,C)=>{
    const key='kpi-status',S=DATA.service;
    const WIN={week:{...S.week,ontime:S.week.ontime},month:{...S.month,ontime:MO.ontime[8]},last:{...S.last,ontime:MO.ontime[7]}};
    const cards=[
      {m:'ontime',en:'ON-TIME',title:'交付及时率',kind:'rate',bands:[.95,.98],polarity:'up',lo:.9,hi:1,ticks:[.9,.95,.98,1],tick:v=>nf(v*100)+'%',legend:'<95% 异常 · 95–98% 关注 · ≥98% 正常',goal:'目标 ≥ 98%'},
      {m:'response',en:'RESPONSE',title:'平均响应时长',kind:'hours',bands:[4,8],polarity:'down',lo:0,hi:12,ticks:[0,4,8,12],tick:v=>v+'h',legend:'≤4h 正常 · 4–8h 关注 · >8h 异常',goal:'目标 ≤ 4 小时'}
    ];
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-bar"><span class="eyebrow">THRESHOLDS · 阈值与状态</span><div class="kpi-bar-end">${seg('统计窗口',[['week','本周'],['month','本月'],['last','上月']],'month')}</div></div>
      <div class="kpi-tiles">${cards.map(c=>{const pos=v=>((v-c.lo)/(c.hi-c.lo)*100).toFixed(2)+'%',[a,b]=c.bands,seq=c.polarity==='up'?[['bad',c.lo,a],['warn',a,b],['good',b,c.hi]]:[['good',c.lo,a],['warn',a,b],['bad',b,c.hi]];return `<div class="kpi-card" role="group">
        ${head(c.en,c.title,period(''))}
        <div class="kpi-value" data-k="num-box"><span class="kpi-num" data-k="num">0</span><span class="unit" data-k="num-unit">${c.kind==='hours'?'小时':''}</span><span class="kpi-push" data-k="chip"></span></div>
        <div class="kpi-scale" data-k="scale"><div class="kpi-bands">${seq.map(([t,x0,x1])=>`<i class="${t}" style="flex:${((x1-x0)/(c.hi-c.lo)*100).toFixed(2)}"></i>`).join('')}</div><span class="kpi-scale-mark" data-k="mark"></span>
        <div class="kpi-ticks">${c.ticks.map(v=>`<span style="left:${pos(v)}">${c.tick(v)}</span>`).join('')}</div></div>
        <div class="kpi-foot"><span>${c.legend}</span></div></div>`;}).join('')}</div>`;
    const tiles=[...root.querySelectorAll('.kpi-card')];let win='month',shown=cards.map(c=>c.polarity==='up'?c.lo:c.lo);
    function paint(vals){tiles.forEach((tile,i)=>{const c=cards[i],v=vals[i];q(tile,'num').textContent=K.fmt(v,c.kind).num;q(tile,'mark').style.left=(C.clamp((v-c.lo)/(c.hi-c.lo),0,1)*100).toFixed(2)+'%';});}
    function show(id,dur){
      const w=WIN[id],from=[...shown],to=cards.map(c=>w[c.m]);win=id;
      tiles.forEach((tile,i)=>{const c=cards[i],tone=band(to[i],c.bands,c.polarity);const box=q(tile,'chip'),chip=box.querySelector('.kpi-chip');if(chip)setChip(chip,tone,K.STATUS[tone].icon,K.STATUS[tone].label);else box.innerHTML=statusChip(tone);q(tile,'period').textContent=w.label+' '+w.span;
        tile.setAttribute('aria-label',`${c.title} ${K.text(to[i],c.kind)}，${K.STATUS[tone].label}（${c.legend}）`);});
      C.animate(key,dur,t=>{shown=from.map((f,i)=>lerp(f,to[i],t));paint(shown);});
    }
    const setSeg=segWire(root,id=>show(id,600));
    const targets=[];
    tiles.forEach((tile,i)=>{const c=cards[i];
      targets.push({el:q(tile,'num-box'),read:()=>{const v=WIN[win][c.m],tone=band(v,c.bands,c.polarity);return {title:`${c.title} · ${WIN[win].label}`,rows:[['原始值',c.kind==='rate'?nf(v*100,2)+'%':nf(v,2)+' 小时'],['显示值',K.text(v,c.kind)],['判档',K.STATUS[tone].label,`var(--st-${tone})`]],foot:'按原始值判档，不按四舍五入后的显示值；'+c.legend};}});
      targets.push({el:q(tile,'scale'),read:()=>({title:`${c.title} · 阈值`,rows:c.polarity==='up'?[['正常','≥ 98%','var(--st-good)'],['关注','95%–98%','var(--st-warn)'],['异常','< 95%','var(--st-bad)']]:[['正常','≤ 4 小时','var(--st-good)'],['关注','4–8 小时','var(--st-warn)'],['异常','> 8 小时','var(--st-bad)']],foot:(c.polarity==='up'?'越高越好':'越低越好')+'：色段顺序随指标方向翻转，好坏色不变'})});
    });
    root.inspector={targets,placeholder:'轻点数值或刻度查看判档'};
    function reset(){setSeg('month');shown=cards.map(c=>c.polarity==='up'?c.lo:c.lo);show('month',800);}
    reset();return {reset};
  };

  /* ---------- K08 · ranking card: sort switch, 其他 never ranked ---------- */
  ChartDemos.kpi_rank=(root,C)=>{
    const key='kpi-rank',PITCH=25,total=sum(DATA.regions.map(r=>r[1]));
    const rows=DATA.regions.map(([name,cur,base])=>({name,cur,base,g:cur/base-1,share:cur/total,other:name==='其他'}));
    const named=rows.filter(r=>!r.other);
    const order=mode=>[...named].sort((a,b)=>mode==='rev'?b.cur-a.cur:b.g-a.g).concat(rows.filter(r=>r.other));
    const gMin=Math.min(0,...rows.map(r=>r.g)),gMax=Math.max(...rows.map(r=>r.g)),zero=-gMin/(gMax-gMin),revMax=Math.max(...named.map(r=>r.cur));
    const geo=(r,mode)=>mode==='rev'?{l:0,w:r.cur/revMax}:{l:r.g>=0?zero:zero+r.g/(gMax-gMin),w:Math.abs(r.g)/(gMax-gMin)};
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-tiles one"><div class="kpi-card" role="group" aria-label="区域营收排行">
      ${head('REGIONS','区域营收排行',seg('排序依据',[['rev','营收'],['growth','增速']],'rev'))}
      <div class="kpi-rank" data-k="list" style="height:${rows.length*PITCH}px">${rows.map((r,i)=>`<div class="kpi-rank-row${r.other?' other':''}" data-i="${i}"><span class="rk"></span><span class="nm">${r.name}</span><span class="kpi-rank-bar"><i></i><b></b></span><span class="val"></span></div>`).join('')}</div>
      <div class="kpi-foot"><span data-k="note"></span><span>合计 ${text(total,'amount')} · 其他不参与排名</span></div></div></div>`;
    const list=q(root,'list'),els=[...list.children],tile=root.querySelector('.kpi-card');
    let mode='rev',pos=rows.map((_,i)=>i),g0=rows.map(r=>geo(r,'rev')),entrance=1;
    function place(t,fromPos,toPos,fromGeo,toGeo){els.forEach((el,i)=>{const y=lerp(fromPos[i],toPos[i],t)*PITCH;el.style.transform=`translateY(${y.toFixed(1)}px)`;const g={l:lerp(fromGeo[i].l,toGeo[i].l,t),w:lerp(fromGeo[i].w,toGeo[i].w,t)*entrance};const bar=el.querySelector('i');bar.style.left=(g.l*100).toFixed(2)+'%';bar.style.width=(g.w*100).toFixed(2)+'%';});}
    function label(){const ord=order(mode);ord.forEach((r,rank)=>{const i=rows.indexOf(r),el=els[i];el.querySelector('.rk').textContent=r.other?'—':String(rank+1).padStart(2,'0');
      const v=el.querySelector('.val'),d=K.fromRaw(r.g*100,'ratio','up');if(mode==='rev'){v.className='val';v.textContent=text(r.cur,'amount',{short:true,scale:'万'});}else{v.className='val '+(r.other?'':d.tone);v.textContent=d.text;}
      el.classList.toggle('neg',mode==='growth'&&r.g<0);el.querySelector('b').style.left=(zero*100).toFixed(2)+'%';el.querySelector('b').style.opacity=mode==='growth'?1:0;
      el.setAttribute('aria-label',`${r.name}，营收 ${text(r.cur,'amount')}，${B.mom.label} ${d.text}${r.other?'，不参与排名':`，${mode==='rev'?'营收':'增速'}第 ${rank+1}`}`);});
      q(root,'note').textContent=mode==='rev'?'按本月营收排序 · 条长 = 营收':'按环比（同期）排序 · 竖线 = 0%';
      ord.forEach(r=>list.appendChild(els[rows.indexOf(r)]));}
    function sortBy(m,dur){const fromPos=[...pos],fromGeo=g0.map(g=>({...g}));mode=m;const ord=order(m);pos=rows.map(r=>ord.indexOf(r));const toGeo=rows.map(r=>geo(r,m));g0=toGeo;label();
      C.animate(key+'-sort',dur,t=>place(t,fromPos,pos,fromGeo,toGeo));}
    const setSeg=segWire(tile,m=>sortBy(m,600));
    root.inspector={targets:els.map((el,i)=>({el,read:()=>{const r=rows[i],d=K.fromRaw(r.g*100,'ratio','up'),rk=m=>order(m).indexOf(r)+1;
      return {title:r.name,rows:[['营收',text(r.cur,'amount'),r.other?'var(--c-dim)':'var(--s-blue)'],['占比',K.fmt(r.share,'rate').num],[B.mom.label,d.text],['排名',r.other?'不参与':`营收第 ${rk('rev')} · 增速第 ${rk('growth')}`]],foot:`基期 ${text(r.base,'amount')}（${B.mom.span}）`};}})),placeholder:'轻点区域查看占比与增速'};
    function reset(){setSeg('rev');mode='rev';pos=rows.map((r)=>order('rev').indexOf(r));g0=rows.map(r=>geo(r,'rev'));label();C.animate(key,900,t=>{entrance=t;place(1,pos,pos,g0,g0);});}
    reset();return {reset};
  };

  /* ---------- K09 · day / month / year trio, each with its own grain ---------- */
  ChartDemos.kpi_trio=(root,C)=>{
    const key='kpi-trio',Y=SC.year,M=SC.month,today=DY.rev[DY.rev.length-1],weekAgo=DY.rev[DY.rev.length-8];
    const MONTHS=['1 月','2 月','3 月','4 月','5 月','6 月','7 月','8 月','9 月'];
    const cols=[
      {id:'day',label:'日 · 9/22',v:today,cmp:{label:'较上周同日',base:weekAgo,span:'9/15'},values:DATA.hourly,color:'var(--s-sage)',at:i=>String(i).padStart(2,'0')+':00',axis:['0 时','23 时'],grain:'按小时'},
      {id:'month',label:'月 · 9/1–9/22',v:M.cur.rev,cmp:{label:B.mom.label,base:B.mom.rev,span:B.mom.span},values:DY.rev,color:'var(--s-blue)',at:i=>DAYS[i],axis:['9/1','9/22'],grain:'按日'},
      {id:'year',label:'年 · 1/1–9/22',v:Y.cur.rev,cmp:{label:B.yoyY.label,base:B.yoyY.rev,span:B.yoyY.span},values:MO.rev,color:'var(--s-orange)',at:i=>MONTHS[i]+(i===8?'（1–22 日）':''),axis:['1 月','9 月'],grain:'按月',partial:true}
    ];
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-tiles one"><div class="kpi-card" role="group" aria-label="营收日月年三联">
      ${head('REVENUE','营收 · 日 / 月 / 年',period('截至 9/22'))}
      <div class="kpi-trio">${cols.map(c=>{const f=fmt(c.v,'amount'),d=change(c.v,c.cmp.base,MET.rev);return `<div data-col="${c.id}"><span class="kpi-trio-label">${c.label}</span>
        <div class="kpi-value" data-k="num-box"><span class="kpi-num" data-k="num">0</span><span class="unit">${f.unit}</span></div>
        <div class="kpi-meta"><span data-k="cmp"><span>${c.cmp.label}</span>${deltaHTML(d)}</span></div>
        <div class="kpi-spark-block"><div class="kpi-readout end"><span data-k="rv"></span></div><svg data-k="spark"></svg><div class="kpi-axis"><span>${c.axis[0]}</span><span>${c.grain}</span><span>${c.axis[1]}</span></div></div></div>`;}).join('')}</div></div></div>`;
    const colEls=[...root.querySelectorAll('[data-col]')];
    const sparks=colEls.map((el,i)=>{const c=cols[i],rv=q(el,'rv');return K.spark(C,q(el,'spark'),{values:c.values,kind:'bars',color:c.color,height:34,pad:1,partialLast:!!c.partial,name:c.label.replace(' · ','')+'营收'+c.grain,valueText:j=>c.at(j)+' '+text(c.values[j],'amount'),
      onScrub:j=>{const at=j??c.values.length-1;rv.className=j===null?'':'live';rv.innerHTML=`<b>${c.at(at)}</b>${text(c.values[at],'amount',{short:true,scale:'万'})}`;}});});
    root.inspector={targets:colEls.map((el,i)=>({el:q(el,'cmp'),read:()=>{const c=cols[i],d=change(c.v,c.cmp.base,MET.rev);
      return {title:`${c.label} · ${c.cmp.label}`,rows:[['本期',text(c.v,'amount')],['基期 '+c.cmp.span,text(c.cmp.base,'amount')],['变化',d.text+' · '+d.verdict]],foot:c.id==='day'?'日数据对比上周同一天，避开周末效应':c.id==='year'?'9 月未满月：柱子浅色虚线，读数注明 1–22 日':'月内累计对比上月同期（同样 22 天）'};}})),placeholder:'拖过小柱看各尺度读数'};
    function reset(){sparks.forEach(s=>s.clear());count(C,key,cols.map((c,i)=>({el:q(colEls[i],'num'),to:c.v,format:v=>fmt(v,'amount',{scale:fmt(c.v,'amount').unit==='亿元'?'亿':'万'}).num})));C.animate(key+'-bars',900,t=>sparks.forEach(s=>s.progress(t)));}
    reset();return {reset};
  };
