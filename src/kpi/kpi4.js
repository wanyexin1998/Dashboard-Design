  /* ---------- P01 · KPI strip: one card, dividers, one comparison at a time ---------- */
  const SIX=['rev','ord','aov','margin','refund','ontime'];
  ChartDemos.kpi_strip=(root,C)=>{
    const key='kpi-strip',M=SC.month.cur,CMP={mom:B.mom,yoy:B.yoyM};let mode='mom',shown=SIX.map(()=>0);
    root.classList.add('kpi-host','kpi-wide');
    root.innerHTML=`<div class="kpi-bar"><span class="eyebrow">OVERVIEW · 核心指标</span><div class="kpi-bar-end"><span class="kpi-period">${SC.month.span}</span>${seg('对比口径',[['mom','环比'],['yoy','同比']],'mom')}</div></div>
      <div class="kpi-strip" role="group" aria-label="核心指标，左右方向键切换">${SIX.map(id=>{const m=MET[id],f=fmt(M[id],m.kind,{unit:m.unit});return `<div class="kpi-strip-item" data-id="${id}">
        <span class="kpi-eyebrow">${m.en}<b>${m.name}</b></span>${valueHTML('num',f.unit)}
        <div class="kpi-meta"><span><span data-k="cl">环比</span><span class="kpi-delta flat" data-k="d"></span></span></div></div>`;}).join('')}</div>`;
    const items=[...root.querySelectorAll('.kpi-strip-item')];
    const deltas=m=>SIX.map(id=>change(M[id],CMP[m][id],MET[id]).raw);
    function paint(vals){items.forEach((el,i)=>{const id=SIX[i],d=K.fromRaw(vals[i],MET[id].change,MET[id].polarity);setDelta(q(el,'d'),d);});}
    function show(m,dur){const from=[...shown],to=deltas(m);mode=m;items.forEach((el,i)=>{q(el,'cl').textContent=CMP[m].short;const id=SIX[i],d=change(M[id],CMP[m][id],MET[id]);el.setAttribute('aria-label',`${MET[id].name} ${text(M[id],MET[id].kind,{unit:MET[id].unit})}，${CMP[m].label}${d.dir} ${d.text.replace(K.MINUS,'')}，${d.verdict}`);});
      C.animate(key+'-cmp',dur,t=>{shown=from.map((f,i)=>lerp(f,to[i],t));paint(shown);});}
    const setSeg=segWire(root,m=>show(m,500));
    K.roving(items);
    root.inspector={targets:items.map((el,i)=>({el,read:()=>{const id=SIX[i],m=MET[id],cur=M[id],b=CMP[mode],d=change(cur,b[id],m),o={unit:m.unit,d:2};
      return {title:m.name,rows:[['本期 '+SC.month.span,text(cur,m.kind,o)],['基期 '+b.span,text(b[id],m.kind,o)],[b.label,d.text+' · '+d.verdict],[mode==='mom'?'同比':'环比（同期）',change(cur,(mode==='mom'?CMP.yoy:CMP.mom)[id],m).text]],foot:'口径：'+m.note};}})),placeholder:'轻点任一指标查看本期与基期'};
    function reset(){setSeg('mom');shown=SIX.map(()=>0);count(C,key,items.map((el,i)=>({el:q(el,'num'),to:M[SIX[i]],format:v=>fmt(v,MET[SIX[i]].kind,{unit:MET[SIX[i]].unit}).num})));show('mom',700);}
    reset();return {reset};
  };

  /* ---------- P02 · hero + secondary list; rows explain the chart ---------- */
  ChartDemos.kpi_hero=(root,C)=>{
    const key='kpi-hero',S=SC.month,M=S.cur,f=fmt(M.rev,'amount'),T=S.target,N=S.total,today=S.elapsed;
    const paceAt=d=>T*d/N,behind=paceAt(today)-M.rev,d1=change(M.rev,B.mom.rev,MET.rev),d2=change(M.rev,B.yoyM.rev,MET.rev);
    const LIST=[['rate','达成率',K.fmt(S.rate,'rate').num],['time','时间进度',K.fmt(S.time,'rate').num],['behind','落后目标节奏',text(behind,'amount',{short:true,scale:'万'})],['need',`剩余 ${S.left} 天 · 日均需`,text(S.need,'amount',{short:true,scale:'万'})],['last7','近 7 日日均',text(LAST7,'amount',{short:true,scale:'万'})]];
    const ok=FORECAST>=T;
    root.classList.add('kpi-host','kpi-wide');
    root.innerHTML=`<div class="kpi-hero"><div class="kpi-hero-main">${head('REVENUE','本月营收',period(S.span),true)}
        <div class="kpi-value" data-k="num-box"><span class="kpi-num hero" data-k="num">0</span><span class="unit">${f.unit}</span></div>
        <div class="kpi-meta">${cmpRow(B.mom.label,d1,null,'c1')}${cmpRow('同比',d2,null,'c2')}</div>
        <svg class="kpi-hero-chart" data-k="chart" tabindex="0" role="group" aria-label="累计营收与目标节奏；左右方向键选择采样点"></svg></div>
      <div class="kpi-list">${LIST.map(([id,l,v])=>`<div class="kpi-row" data-part="${id}"><span>${l}</span><b${id==='behind'?' class="bad"':''}>${v}</b></div>`).join('')}
        <p class="kpi-insight">按近 7 日节奏，月底预计 <b>${text(FORECAST,'amount',{short:true,scale:'万'})}</b>，${ok?'<b>可以完成</b>':'<b>完不成</b>'}月目标 ${text(T,'amount',{short:true,scale:'万'})}${ok?`，但只多 ${text(FORECAST-T,'amount',{short:true,scale:'万'})}`:''}。</p></div></div>`;
    const svg=q(root,'chart');let entrance=1,focus=null,hover=-1,W=0;const H=176,L=6,R=70,TOP=16,BOT=22;
    const g={grid:C.s('line',{stroke:'var(--c-grid)','stroke-dasharray':'3 4'},svg),gridT:C.s('text',{'text-anchor':'start',fill:'var(--c-text-4)','font-size':10},svg),
      pace:C.s('line',{stroke:'var(--st-bad)','stroke-width':1.4,'stroke-dasharray':'5 4'},svg),paceT:C.s('text',{fill:'var(--st-bad-text)','font-size':10,'text-anchor':'end'},svg),
      area:C.s('path',{fill:'var(--s-blue)','fill-opacity':.13,stroke:'none'},svg),line:C.s('path',{fill:'none',stroke:'var(--s-blue)','stroke-width':2.2,'stroke-linejoin':'round','stroke-linecap':'round'},svg),
      proj:C.s('line',{stroke:'var(--s-blue)','stroke-width':1.6,'stroke-dasharray':'2 4','stroke-linecap':'round'},svg),projT:C.s('text',{fill:'var(--s-blue-text)','font-size':10},svg),
      need:C.s('line',{stroke:'var(--c-text-3)','stroke-width':1.4,'stroke-dasharray':'1 3','stroke-linecap':'round'},svg),needT:C.s('text',{fill:'var(--c-text-3)','font-size':10},svg),
      today:C.s('line',{stroke:'var(--c-rule)','stroke-dasharray':'2 3'},svg),gap:C.s('line',{stroke:'var(--st-bad)','stroke-width':3,'stroke-linecap':'round'},svg),gapT:C.s('text',{fill:'var(--st-bad-text)','font-size':10,'font-weight':600},svg),
      end:C.s('circle',{r:4,fill:'var(--s-blue)',stroke:'var(--c-surface)','stroke-width':2},svg),hl:C.s('line',{stroke:'var(--c-text)','stroke-opacity':.35,'stroke-dasharray':'3 4',visibility:'hidden'},svg),hd:C.s('circle',{r:3.5,fill:'var(--c-surface)',stroke:'var(--c-text)','stroke-width':1.6,visibility:'hidden'},svg),
      xs:[0,today,N].map(()=>C.s('text',{fill:'var(--c-text-4)','font-size':10,'text-anchor':'middle'},svg))};
    const ymax=Math.max(T,FORECAST)*1.07,x=d=>L+d/N*(W-L-R),y=v=>TOP+(1-v/ymax)*(H-TOP-BOT);
    const set=(el,a)=>Object.entries(a).forEach(([k,v])=>el.setAttribute(k,v));
    function draw(){
      W=svg.getBoundingClientRect().width;if(!W)return;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
      const shownDays=Math.max(1,Math.round(today*entrance)),pts=[[x(0),y(0)]].concat(CUM.slice(0,shownDays).map((v,i)=>[x(i+1),y(v)]));
      const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join('');
      set(g.line,{d});set(g.area,{d:d+`L${pts[pts.length-1][0].toFixed(1)},${y(0)}L${x(0)},${y(0)}Z`});
      set(g.grid,{x1:L,x2:x(N),y1:y(T),y2:y(T)});set(g.gridT,{x:L+2,y:y(T)-6});g.gridT.textContent='月目标 '+nf(T);
      set(g.pace,{x1:x(0),y1:y(0),x2:x(N),y2:y(T),opacity:focus&&!['time','behind'].includes(focus)?.35:1});set(g.paceT,{x:x(N-4.5),y:y(paceAt(N-4.5))-9,opacity:focus&&!['time','behind'].includes(focus)?.35:1});g.paceT.textContent='目标节奏';
      const done=entrance>=1,ex=x(today),ey=y(M.rev);
      set(g.end,{cx:pts[pts.length-1][0],cy:pts[pts.length-1][1]});
      set(g.proj,{x1:ex,y1:ey,x2:x(N),y2:y(FORECAST),opacity:done?(focus==='last7'?1:focus?.2:.55):0,'stroke-width':focus==='last7'?2.2:1.6});
      set(g.projT,{x:x(N)+6,y:y(FORECAST)+4,opacity:done?(focus&&focus!=='last7'?.3:1):0});g.projT.textContent='预计 '+nf(FORECAST,1);
      set(g.need,{x1:ex,y1:ey,x2:x(N),y2:y(T),opacity:focus==='need'?1:0});set(g.needT,{x:(ex+x(N))/2+6,y:(ey+y(T))/2+14,opacity:focus==='need'?1:0});g.needT.textContent='需 '+nf(S.need,1)+' / 日';
      set(g.today,{x1:ex,x2:ex,y1:TOP-4,y2:H-BOT,opacity:focus==='time'?1:.55,'stroke-width':focus==='time'?1.6:1});
      set(g.gap,{x1:ex,x2:ex,y1:y(paceAt(today)),y2:ey,opacity:focus==='behind'?1:0});set(g.gapT,{x:ex+8,y:(y(paceAt(today))+ey)/2+4,opacity:focus==='behind'?1:0});g.gapT.textContent=K.MINUS+nf(behind,1);
      g.line.setAttribute('stroke-width',focus==='rate'?3:2.2);
      [[0,'9/1'],[today,'9/22'],[N,'9/30']].forEach(([dd,t],i)=>{set(g.xs[i],{x:C.clamp(x(dd),12,W-12),y:H-6,'text-anchor':i===0?'start':i===2?'end':'middle'});g.xs[i].textContent=t;});
      mark();
    }
    // Hover only moves the guide and the hollow dot; the chart is redrawn on resize, focus and entrance.
    function mark(){if(!W){draw();return;}if(hover>=0){const hx=x(hover+1),hy=y(CUM[hover]);set(g.hl,{x1:hx,x2:hx,y1:TOP-4,y2:H-BOT,visibility:'visible'});set(g.hd,{cx:hx,cy:hy,visibility:'visible'});}else{g.hl.setAttribute('visibility','hidden');g.hd.setAttribute('visibility','hidden');}}
    new ResizeObserver(draw).observe(svg);
    const rowsEl=[...root.querySelectorAll('.kpi-list .kpi-row')];
    function setFocus(p){focus=p;rowsEl.forEach(r=>r.classList.toggle('on',r.dataset.part===p));draw();}
    rowsEl.forEach(r=>{['pointerenter','focus'].forEach(ev=>r.addEventListener(ev,()=>setFocus(r.dataset.part)));['pointerleave','blur'].forEach(ev=>r.addEventListener(ev,()=>setFocus(null)));});
    const U=v=>text(v,'amount');
    const reads={rate:()=>({title:'达成率',rows:[['达成',U(M.rev),'var(--s-blue)'],['月目标',U(T)],['达成率',K.fmt(S.rate,'rate').num]],foot:'达成率 = 达成 ÷ 目标'}),
      time:()=>({title:'时间进度',rows:[['已过',today+' / '+N+' 天'],['时间进度',K.fmt(S.time,'rate').num,'var(--st-bad)']],foot:'图中竖虚线 = 今天；红色虚线 = 目标节奏（匀速完成目标的累计线）'}),
      behind:()=>({title:'落后目标节奏',rows:[['节奏应达',U(paceAt(today)),'var(--st-bad)'],['实际累计',U(M.rev),'var(--s-blue)'],['差',K.MINUS+U(behind)]],foot:`节奏应达 = 月目标 × ${today} ÷ ${N}`}),
      need:()=>({title:'日均需',rows:[['差额',U(S.gap)],['剩余天数',S.left+' 天'],['日均需',U(S.need)]],foot:'图中点线：从今天走到目标需要的斜率'}),
      last7:()=>({title:'近 7 日日均',rows:[['9/16–9/22 合计',U(sum(DY.rev.slice(-7)))],['日均',U(LAST7)],['月底预计',U(FORECAST),'var(--s-blue)']],foot:'预计 = 当前累计 + 近 7 日日均 × 剩余天数（图中蓝色点线）'})};
    const targets=rowsEl.map(r=>({el:r,read:reads[r.dataset.part]}));
    targets.push({el:q(root,'info'),read:()=>({title:'本月营收 · 口径',rows:[['统计区间',S.span],['更新于',A.updated]],foot:'口径：'+MET.rev.note})});
    targets.push({el:q(root,'c1'),read:()=>({title:'本月营收 · '+B.mom.label,rows:[['本期',U(M.rev)],['基期 '+B.mom.span,U(B.mom.rev)],['变化',d1.text+' · '+d1.verdict]]})});
    targets.push({el:q(root,'c2'),read:()=>({title:'本月营收 · 同比',rows:[['本期',U(M.rev)],['基期 '+B.yoyM.span,U(B.yoyM.rev)],['变化',d2.text+' · '+d2.verdict]]})});
    root.inspector={targets,probe:{svg,get min(){return x(1);},get max(){return x(today);},top:0,get bottom(){return H;},guide:false,count:()=>today,
      read:i=>({title:DAYS[i]+' · 累计',rows:[['累计营收',U(CUM[i]),'var(--s-blue)'],['目标节奏',U(paceAt(i+1)),'var(--st-bad)'],['较节奏',(CUM[i]-paceAt(i+1)>=0?'+':K.MINUS)+U(Math.abs(CUM[i]-paceAt(i+1)))]],foot:`当日 ${U(DY.rev[i])}；主数值始终是本月累计`}),
      hover:i=>{hover=i;mark();}},placeholder:'轻点曲线或右侧指标查看读数'};
    function reset(){setFocus(null);hover=-1;count(C,key,[{el:q(root,'num'),to:M.rev,format:v=>fmt(v,'amount').num}],800);C.animate(key+'-line',1100,t=>{entrance=t;draw();});}
    reset();return {reset};
  };

  /* ---------- P03 · metric tabs drive one chart (morph in place) ---------- */
  ChartDemos.kpi_tabs=(root,C)=>{
    const key='kpi-tabs',M=SC.month.cur,TM=DATA.target.month;
    const series={
      rev:{values:DY.rev,target:TM.rev/A.monthDays,fmt:v=>text(v,'amount',{scale:'万'}),axis:v=>nf(v),note:'日营收 · 万元',tLabel:'日目标'},
      ord:{values:DY.ord,target:TM.ord/A.monthDays,fmt:v=>nf(v)+' 单',axis:v=>nf(v),note:'日订单 · 单',tLabel:'日目标'},
      aov:{values:DY.rev.map((r,i)=>r*1e4/DY.ord[i]),target:TM.aov,fmt:v=>nf(v)+' 元',axis:v=>nf(v),note:'日客单价 · 元',tLabel:'目标'},
      refund:{values:DY.ref.map((r,i)=>r/DY.ord[i]),target:TM.refund,fmt:v=>nf(v*100,2)+'%',axis:v=>nf(v*100,1)+'%',note:'日退款率',tLabel:'上限'}
    };
    const TABS=['rev','ord','aov','refund'];
    Object.values(series).forEach(s=>{s.dom=K.niceDomain(Math.min(...s.values,s.target),Math.max(...s.values,s.target),3);s.norm=v=>(v-s.dom.min)/(s.dom.max-s.dom.min);});
    root.classList.add('kpi-host','kpi-wide');
    root.innerHTML=`<div class="kpi-tabs" role="tablist" aria-label="选择指标">${TABS.map((id,i)=>{const m=MET[id],f=fmt(M[id],m.kind,{unit:m.unit,short:true}),d=change(M[id],B.mom[id],m);
        return `<button type="button" class="kpi-tab" role="tab" id="kpi-tab-${id}" aria-controls="kpi-tabpanel" aria-selected="${i===0}" tabindex="${i?-1:0}" data-id="${id}"><span class="t">${m.name}</span><span class="v">${f.num}<small>${f.unit}</small></span>${deltaHTML(d)}<span class="sr-only">，${B.mom.label}${d.dir}${d.text.replace(K.MINUS,'')}，${d.verdict}</span></button>`;}).join('')}</div>
      <div role="tabpanel" id="kpi-tabpanel" aria-labelledby="kpi-tab-rev"><svg class="kpi-tab-chart" data-k="chart" tabindex="0" role="group" aria-label="营收逐日走势；左右方向键选择采样点"></svg><div class="kpi-chart-note"><span data-k="note"></span><span>${SC.month.span} · 切换页签，图表原位变形</span></div></div>`;
    const tabs=[...root.querySelectorAll('.kpi-tab')],svg=q(root,'chart'),panel=root.querySelector('[role=tabpanel]'),n=DY.rev.length;
    let cur='rev',labelFrom='rev',fromN=series.rev.values.map(series.rev.norm),toN=[...fromN],fromT=series.rev.norm(series.rev.target),toT=fromT,mix=1,entrance=1,hover=-1,W=0,H=208;const Lm=46,Rm=14,Tm=12,Bm=22;
    const grid=[0,1,2,3,4].map(()=>C.s('line',{stroke:'var(--c-grid)'},svg)),labels=grid.map(()=>C.s('text',{'text-anchor':'end',fill:'var(--c-text-4)','font-size':10},svg));
    const tline=C.s('line',{stroke:'var(--c-rule)','stroke-width':1.2,'stroke-dasharray':'5 4'},svg),tlab=C.s('text',{'text-anchor':'end',fill:'var(--c-text-3)','font-size':10},svg);
    const area=C.s('path',{fill:'var(--s-blue)','fill-opacity':.1,stroke:'none'},svg),path=C.s('path',{fill:'none',stroke:'var(--s-blue)','stroke-width':2,'stroke-linejoin':'round'},svg);
    const dots=DY.rev.map(()=>C.s('circle',{r:2.4,fill:'var(--s-blue)'},svg)),xl=[0,7,14,21].map(()=>C.s('text',{'text-anchor':'middle',fill:'var(--c-text-4)','font-size':10},svg));
    const hl=C.s('line',{stroke:'var(--c-text)','stroke-opacity':.35,'stroke-dasharray':'3 4',visibility:'hidden'},svg),hd=C.s('circle',{r:4.5,fill:'var(--c-surface)',stroke:'var(--s-blue)','stroke-width':2,visibility:'hidden'},svg);
    const xAt=i=>Lm+i*(W-Lm-Rm)/(n-1),yN=v=>Tm+(1-v)*(H-Tm-Bm),shownN=()=>fromN.map((f,i)=>lerp(f,toN[i],mix));let drawn=null,marked=-1;
    function draw(){
      const r=svg.getBoundingClientRect();W=r.width;H=r.height||H;if(!W)return;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
      const base=H-Bm,pts=shownN().map((v,i)=>[xAt(i),base-(base-yN(v))*entrance]);
      const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join('');path.setAttribute('d',d);area.setAttribute('d',d+`L${xAt(n-1).toFixed(1)},${base}L${xAt(0).toFixed(1)},${base}Z`);
      dots.forEach((c,i)=>{c.setAttribute('cx',pts[i][0]);c.setAttribute('cy',pts[i][1]);c.setAttribute('opacity',i===hover?0:entrance);});
      const s=series[mix<.5?labelFrom:cur],fade=Math.abs(mix-.5)*2,ticks=[];for(let v=s.dom.min;v<=s.dom.max+s.dom.step/2;v+=s.dom.step)ticks.push(v);
      grid.forEach((l,i)=>{const t=ticks[i];if(t===undefined){l.setAttribute('opacity',0);labels[i].setAttribute('opacity',0);return;}const yy=yN(s.norm(t));
        l.setAttribute('x1',Lm);l.setAttribute('x2',W-Rm);l.setAttribute('y1',yy);l.setAttribute('y2',yy);l.setAttribute('opacity',i?1:0);labels[i].setAttribute('x',Lm-8);labels[i].setAttribute('y',yy+3.5);labels[i].setAttribute('opacity',fade);labels[i].textContent=s.axis(t);});
      const ty=yN(lerp(fromT,toT,mix));tline.setAttribute('x1',Lm);tline.setAttribute('x2',W-Rm);tline.setAttribute('y1',ty);tline.setAttribute('y2',ty);tline.setAttribute('opacity',entrance);
      tlab.setAttribute('x',W-Rm);tlab.setAttribute('y',ty-6);tlab.setAttribute('opacity',fade*entrance);tlab.textContent=s.tLabel+' '+s.fmt(s.target);
      [0,7,14,21].forEach((i,j)=>{xl[j].setAttribute('x',xAt(i));xl[j].setAttribute('y',H-6);xl[j].textContent=DAYS[i];});
      drawn=pts;marked=hover;mark();
    }
    // Hover swaps the hollow marker for its dot and moves the guide; the chart is redrawn on resize, tab switch and entrance.
    function mark(){
      if(!W||!drawn){draw();return;}
      if(marked!==hover){if(marked>=0)dots[marked].setAttribute('opacity',entrance);if(hover>=0)dots[hover].setAttribute('opacity',0);marked=hover;}
      const base=H-Bm;
      if(hover>=0){const hx=xAt(hover),hy=drawn[hover][1];hl.setAttribute('x1',hx);hl.setAttribute('x2',hx);hl.setAttribute('y1',Tm-4);hl.setAttribute('y2',base);hl.setAttribute('visibility','visible');hd.setAttribute('cx',hx);hd.setAttribute('cy',hy);hd.setAttribute('visibility','visible');}else{hl.setAttribute('visibility','hidden');hd.setAttribute('visibility','hidden');}
    }
    new ResizeObserver(draw).observe(svg);
    function select(id,dur=650){
      const s=series[id];labelFrom=mix<.5?labelFrom:cur;fromN=shownN();fromT=lerp(fromT,toT,mix);toN=s.values.map(s.norm);toT=s.norm(s.target);cur=id;mix=0;
      tabs.forEach(t=>{const on=t.dataset.id===id;t.setAttribute('aria-selected',String(on));t.setAttribute('tabindex',on?'0':'-1');});panel.setAttribute('aria-labelledby','kpi-tab-'+id);
      q(root,'note').textContent=`${s.note} · 虚线为${s.tLabel} ${s.fmt(s.target)}`;svg.setAttribute('aria-label',`${MET[id].name}逐日走势；左右方向键选择采样点`);
      C.animate(key+'-mix',dur,t=>{mix=t;draw();});}
    tabs.forEach((t,i)=>{t.addEventListener('click',()=>{if(t.dataset.id!==cur)select(t.dataset.id);});t.addEventListener('keydown',e=>{const k=e.key;if(!['ArrowLeft','ArrowRight','Home','End'].includes(k))return;e.preventDefault();const j=k==='Home'?0:k==='End'?tabs.length-1:(i+(k==='ArrowLeft'?-1:1)+tabs.length)%tabs.length;tabs[j].focus();if(tabs[j].dataset.id!==cur)select(tabs[j].dataset.id);});});
    root.inspector={probe:{svg,get min(){return xAt(0);},get max(){return xAt(n-1);},top:0,get bottom(){return H;},guide:false,count:()=>n,
      read:i=>{const s=series[cur],m=MET[cur],v=s.values[i],d=cur==='refund'?K.fromRaw((v-s.target)*100,'pp',m.polarity):K.fromRaw((v/s.target-1)*100,'ratio',m.polarity);
        return {title:`${DAYS[i]} · ${m.name}`,rows:[[m.name,s.fmt(v),'var(--s-blue)'],[s.tLabel,s.fmt(s.target)],['较'+s.tLabel,d.text+' · '+d.verdict]],foot:'页签上的数值是本月，不随悬浮改变'};},
      hover:i=>{hover=i;mark();}},targets:[],placeholder:'轻点图表查看逐日读数'};
    function reset(){hover=-1;labelFrom='rev';mix=1;select('rev',0);C.animate(key,1000,t=>{entrance=t;draw();});}
    reset();return {reset};
  };
