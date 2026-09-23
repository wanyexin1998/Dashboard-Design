  /* ---------- K01 · value card + five states ---------- */
  ChartDemos.kpi_value=(root,C)=>{
    const M=SC.month.cur,key='kpi-value',STATES=[['ok','正常'],['loading','加载中'],['empty','无数据'],['error','失败'],['stale','延迟']];
    const cards=[
      {m:'rev',title:'本月营收',v:M.rev,full:v=>nf(Math.round(v*1e4))+' 元',empty:'本月尚无确认收入',foot:'确认收入口径'},
      {m:'ord',title:'订单数',v:M.ord,full:v=>nf(v)+' 单',empty:'本月尚无支付订单',foot:`新客 ${nf(DATA.orderMix.fresh)} · 复购 ${nf(DATA.orderMix.repeat)}`}
    ];
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-bar"><span class="eyebrow">STATES · 五种状态，同一高度</span><div class="kpi-bar-end">${seg('卡片状态',STATES,'ok')}</div></div>
      <div class="kpi-tiles">${cards.map(c=>{const f=fmt(c.v,MET[c.m].kind,{unit:MET[c.m].unit});return `<div class="kpi-card" data-state="ok" role="group" aria-label="${c.title}">
        ${head(MET[c.m].en,c.title,period(SC.month.span),true)}
        <div class="kpi-stack">
          <div class="kpi-layer" data-layer="data">${valueHTML('num',f.unit)}<div class="kpi-meta">${chipHTML('warn','!','数据延迟 8 小时','stale')}</div></div>
          <div class="kpi-layer" data-layer="loading" aria-hidden="true"><i class="kpi-skel" style="width:64%;height:26px;margin-top:10px"></i><i class="kpi-skel" style="width:40%;margin-top:12px"></i></div>
          <div class="kpi-layer" data-layer="empty"><div class="kpi-value" data-k="empty"><span class="kpi-num is-empty">—</span></div><div class="kpi-meta">${c.empty}</div></div>
          <div class="kpi-layer" data-layer="error"><p class="kpi-msg">数据源超时，未取到本月数据</p><button type="button" class="kpi-retry">重试</button></div>
        </div>
        <div class="kpi-foot"><span data-k="foot">更新于 ${A.updated}</span><span>${c.foot}</span></div></div>`;}).join('')}</div>`;
    const tiles=[...root.querySelectorAll('.kpi-card')];let state='ok',timer=0;
    const setSeg=segWire(root,s=>setState(s));
    function setState(s){
      clearTimeout(timer);state=s;setSeg(s);
      tiles.forEach((tile,i)=>{tile.dataset.state=s;const c=cards[i];
        tile.querySelectorAll('.kpi-layer').forEach(l=>{const on=l.dataset.layer===(s==='ok'||s==='stale'?'data':s);l.setAttribute('aria-hidden',String(!on));l.querySelectorAll('[data-metric-target]').forEach(t=>t.setAttribute('aria-hidden',String(!on)));});
        q(tile,'stale').hidden=s!=='stale';
        q(tile,'foot').textContent=s==='loading'?'加载中…':s==='error'?'上次成功 '+A.updated:s==='stale'?'更新于 '+A.stale:'更新于 '+A.updated;
        const f=fmt(c.v,MET[c.m].kind,{unit:MET[c.m].unit});
        tile.setAttribute('aria-label',s==='loading'?c.title+'，加载中':s==='empty'?c.title+'，暂无数据':s==='error'?c.title+'，加载失败':`${c.title} ${f.num}${f.unit}${s==='stale'?'，数据延迟':''}`);
      });
    }
    tiles.forEach(tile=>tile.querySelector('.kpi-retry').addEventListener('click',()=>{setState('loading');timer=setTimeout(()=>{setState('ok');run(450);},900);}));
    function run(dur=700){count(C,key,cards.map((c,i)=>({el:q(tiles[i],'num'),to:c.v,format:v=>fmt(v,MET[c.m].kind,{unit:MET[c.m].unit}).num})),dur);}
    const targets=[];
    tiles.forEach((tile,i)=>{const c=cards[i],m=MET[c.m],unitText=fmt(c.v,m.kind,{unit:m.unit}).unit||m.unit;
      targets.push({el:q(tile,'info'),read:()=>({title:c.title+' · 口径',rows:[['统计区间',SC.month.span],['更新于',state==='stale'?A.stale:A.updated],['单位',unitText]],foot:'口径：'+m.note})});
      targets.push({el:q(tile,'num-box'),read:()=>({title:c.title,rows:[['卡面',text(c.v,m.kind,{unit:m.unit})],['完整值',c.full(c.v)],['统计区间',SC.month.span]],foot:state==='stale'?`超过 6 小时未更新（最近 ${A.stale}），显示上次结果`:'≥ 1 万用万、≥ 1 亿用亿；卡面简写，读数浮层给全值'})});
      targets.push({el:q(tile,'empty'),read:()=>({title:c.title,rows:[['状态','暂无数据'],['原因',c.empty]],foot:'空值显示 —，并写明原因；零值照常显示 0'})});
    });
    root.inspector={targets,placeholder:'轻点数值或 ⓘ 查看读数'};
    function reset(){setState('ok');run();}
    reset();return {reset};
  };

  /* ---------- K02 · delta card: arrow = direction, colour = good / bad ---------- */
  ChartDemos.kpi_delta=(root,C)=>{
    const M=SC.month.cur,key='kpi-delta';
    const cards=[{m:'aov',title:'客单价',pol:'↑ 增加为好'},{m:'refund',title:'退款率',pol:'↓ 减少为好'}];
    const bases=[B.mom,B.yoyM];
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-tiles">${cards.map(c=>{const m=MET[c.m],f=fmt(M[c.m],m.kind);return `<div class="kpi-card" role="group">
      ${head(m.en,c.title,period(SC.month.span))}${valueHTML('num',f.unit)}
      <div class="kpi-cmps">${bases.map((b,j)=>{const d=change(M[c.m],b[c.m],m);return `<div class="kpi-cmp" data-k="cmp${j}"><span>${b.label}</span>${deltaHTML(d)}<span class="kpi-cmp-base">${b.was} ${text(b[c.m],m.kind)}</span></div>`;}).join('')}</div>
      <div class="kpi-foot"><span class="kpi-tag">${c.pol}</span><span>${m.change==='pp'?'比率之差写 pp':'相对变化写 %'}</span></div></div>`;}).join('')}</div>`;
    const tiles=[...root.querySelectorAll('.kpi-card')];
    tiles.forEach((tile,i)=>{const c=cards[i],m=MET[c.m],d=bases.map(b=>change(M[c.m],b[c.m],m));
      tile.setAttribute('aria-label',`${c.title} ${text(M[c.m],m.kind)}，${bases.map((b,j)=>`${b.label}${d[j].dir} ${d[j].text.replace(K.MINUS,'')}，${d[j].verdict}`).join('；')}`);});
    const targets=[];
    tiles.forEach((tile,i)=>{const c=cards[i],m=MET[c.m];bases.forEach((b,j)=>targets.push({el:q(tile,'cmp'+j),read:()=>{
      const cur=M[c.m],base=b[c.m],d=change(cur,base,m),pp=m.change==='pp',diff=cur-base;
      const rows=[['本期 '+SC.month.span,pp?text(cur,'rate',{d:2}):text(cur,m.kind)],['基期 '+b.span,pp?text(base,'rate',{d:2}):text(base,m.kind)],['变化',(diff<0?K.MINUS:'+')+(pp?nf(Math.abs(diff*100),2)+'pp':text(Math.abs(diff),m.kind))],['判定',(m.polarity==='up'?'增加为好':'减少为好')+' → '+d.verdict]];
      const foot=c.m==='refund'?`${M.ref} ÷ ${nf(M.ord)} = ${nf(cur*100,2)}%；${b.ref} ÷ ${nf(b.ord)} = ${nf(base*100,2)}%。比率之差写百分点。`:`${nf(cur)} ÷ ${nf(base)} − 1 = ${d.text}。箭头表方向，颜色表好坏。`;
      return {title:`${c.title} · ${b.label}`,rows,foot};}}));});
    root.inspector={targets,placeholder:'轻点对比项查看基期与算法'};
    function reset(){count(C,key,cards.map((c,i)=>({el:q(tiles[i],'num'),to:M[c.m],format:v=>fmt(v,MET[c.m].kind).num})));}
    reset();return {reset};
  };

  /* ---------- K03 · sparkline card ---------- */
  ChartDemos.kpi_trend=(root,C)=>{
    const M=SC.month.cur,key='kpi-trend';
    const cards=[
      {m:'rev',title:'本月营收',kind:'area',values:DY.rev,color:'var(--s-blue)',read:v=>text(v,'amount',{short:true,scale:'万'})},
      {m:'ord',title:'订单数',kind:'bars',values:DY.ord,color:'var(--s-sage)',read:v=>nf(v)+' 单'}
    ];
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-tiles">${cards.map(c=>{const m=MET[c.m],f=fmt(M[c.m],m.kind,{unit:m.unit}),d=change(M[c.m],B.mom[c.m],m);return `<div class="kpi-card" role="group">
      ${head(m.en,c.title,period(SC.month.span))}${valueHTML('num',f.unit)}
      <div class="kpi-meta">${cmpRow(B.mom.label,d,null,'cmp')}</div>
      <div class="kpi-spark-block"><div class="kpi-readout"><span>逐日</span><span data-k="rv"></span></div><svg data-k="spark"></svg><div class="kpi-axis"><span>9/1</span><span>9/22</span></div></div></div>`;}).join('')}</div>`;
    const tiles=[...root.querySelectorAll('.kpi-card')];
    const sparks=tiles.map((tile,i)=>{const c=cards[i],rv=q(tile,'rv');
      return K.spark(C,q(tile,'spark'),{values:c.values,kind:c.kind,color:c.color,height:46,name:c.title+'逐日走势',valueText:j=>DAYS[j]+' '+c.read(c.values[j]),
        onScrub:j=>{const at=j??c.values.length-1;rv.className=j===null?'':'live';rv.innerHTML=`<b>${DAYS[at]}</b>${c.read(c.values[at])}`;}});});
    tiles.forEach((tile,i)=>{const c=cards[i],m=MET[c.m],d=change(M[c.m],B.mom[c.m],m);tile.setAttribute('aria-label',`${c.title} ${text(M[c.m],m.kind,{unit:m.unit})}，${B.mom.label}${d.dir} ${d.text.replace(K.MINUS,'')}，${d.verdict}`);});
    root.inspector={targets:tiles.map((tile,i)=>({el:q(tile,'cmp'),read:()=>{const c=cards[i],m=MET[c.m],cur=M[c.m],base=B.mom[c.m],d=change(cur,base,m);
      return {title:`${c.title} · ${B.mom.label}`,rows:[['本期 '+SC.month.span,text(cur,m.kind,{unit:m.unit})],['基期 '+B.mom.span,text(base,m.kind,{unit:m.unit})],['变化',d.text+' · '+d.verdict]],foot:'迷你图读数写在图旁，主数值始终是当期'};}})),placeholder:'拖过迷你图看逐日读数'};
    function reset(){sparks.forEach(s=>s.clear());count(C,key,cards.map((c,i)=>({el:q(tiles[i],'num'),to:M[c.m],format:v=>fmt(v,MET[c.m].kind,{unit:MET[c.m].unit}).num})));C.animate(key+'-line',900,t=>sparks.forEach(s=>s.progress(t)));}
    reset();return {reset};
  };

  /* ---------- K04 · target + time progress ---------- */
  ChartDemos.kpi_target=(root,C)=>{
    const key='kpi-target';let set=SC,segId='month',last7=LAST7,sc=SC.month,shown={rate:0,time:SC.month.time,target:0,done:0,gap:0,need:0};
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-tiles one"><div class="kpi-card" role="group">
      ${head('TARGET','营收目标达成',seg('统计周期',[['month','本月'],['quarter','本季'],['year','本年']],'month'))}
      <div class="kpi-value" data-k="rate-box"><span class="kpi-num" data-k="rate">0%</span><span class="unit" data-k="span"></span><span class="kpi-push" data-k="pace"></span></div>
      <div class="kpi-progress"><div class="kpi-track"><i class="kpi-fill" data-k="fill"></i><span class="kpi-hit" data-k="hit"></span></div><span class="kpi-marker" data-k="marker"><span class="kpi-marker-label" data-k="mlabel"></span></span></div>
      <div class="kpi-facts"><div data-k="f-target">目标<b></b></div><div data-k="f-done">达成<b></b></div><div data-k="f-gap">差额<b></b></div><div data-k="f-need"><span data-k="left"></span><b></b></div></div></div></div>`;
    const tile=root.querySelector('.kpi-card'),el=k=>q(tile,k);
    const scaleOf=s=>K.cardScale('amount',s.target,s.cur.rev);
    function paint(p,to){
      const u=scaleOf(to);
      el('rate').textContent=K.fmt(p.rate,'rate').num;el('fill').style.width=(Math.min(p.rate,1)*100).toFixed(2)+'%';
      el('marker').style.left=(p.time*100).toFixed(2)+'%';
      const lab=el('mlabel');lab.textContent='时间进度 '+K.fmt(p.time,'rate').num;lab.style.transform=p.time>.86?'translateX(-100%) translateX(8px)':'translateX(-50%)';
      [['f-target',p.target],['f-done',p.done],['f-gap',p.gap],['f-need',p.need]].forEach(([k,v])=>{el(k).querySelector('b').textContent=text(v,'amount',{scale:k==='f-need'?'万':u,short:true});});
    }
    function show(to,dur){
      const from={...shown},goal={rate:to.rate,time:to.time,target:to.target,done:to.cur.rev,gap:to.gap,need:to.need};sc=to;
      // Re-use the chip element so its colour transition (.kpi-chip, .3s) plays when the verdict changes.
      const pc=pace(to.rate,to.time),box=el('pace'),chip=box.querySelector('.kpi-chip');if(chip)setChip(chip,pc.tone,pc.icon,pc.label);else box.innerHTML=chipHTML(pc.tone,pc.icon,pc.label,'chip');
      el('span').textContent=to.label+' '+to.span;el('left').textContent=`剩余 ${to.left} 天 · 日均需`;
      tile.setAttribute('aria-label',`营收目标达成，${to.label} ${K.fmt(to.rate,'rate').num}，时间进度 ${K.fmt(to.time,'rate').num}，${pc.label}`);
      C.animate(key,dur,t=>{const p={};Object.keys(goal).forEach(k=>p[k]=lerp(from[k],goal[k],t));Object.assign(shown,p);paint(p,to);});
    }
    const setSeg=segWire(tile,id=>{segId=id;show(set[id],650);});
    document.addEventListener('chart-asof',e=>{set=e.detail.day===A.day?SC:scAt(e.detail.day);last7=set.last7??LAST7;show(set[segId],650);});
    const u=()=>scaleOf(sc);
    root.inspector={targets:[
      {el:el('hit'),read:()=>({title:`达成率 · ${sc.label}`,rows:[['达成',text(sc.cur.rev,'amount',{scale:u()})],['目标',text(sc.target,'amount',{scale:u()})],['达成率',K.fmt(sc.rate,'rate').num,'var(--s-blue)']],foot:'达成率 = 达成 ÷ 目标'})},
      {el:el('marker'),read:()=>({title:`时间进度 · ${sc.label}`,rows:[['已过天数',sc.elapsed+' 天'],['当期天数',sc.total+' 天'],['时间进度',K.fmt(sc.time,'rate').num,'var(--st-bad)']],foot:'时间进度 = 已过天数 ÷ 当期天数；条头落在虚线左侧即为滞后'})},
      {el:el('rate-box'),read:()=>{const pc=pace(sc.rate,sc.time);return {title:`超前 / 滞后 · ${sc.label}`,rows:[['达成率',K.fmt(sc.rate,'rate').num],['时间进度',K.fmt(sc.time,'rate').num],['差',(pc.pp>0?'+':pc.pp<0?K.MINUS:'')+nf(pc.pp,1)+'pp']],foot:'用卡面两个显示值相减，读者可以自己核对；|差| < 0.5pp 记为持平'};}},
      {el:el('f-gap'),read:()=>({title:'差额',rows:[['目标',text(sc.target,'amount',{scale:u()})],['达成',text(sc.cur.rev,'amount',{scale:u()})],['差额',text(sc.gap,'amount',{scale:u()})]],foot:'差额 = 目标 − 达成；同一张卡用同一个单位'})},
      {el:el('f-need'),read:()=>({title:'日均需',rows:[['差额',text(sc.gap,'amount')],['剩余天数',sc.left+' 天'],['日均需',text(sc.need,'amount')]],foot:`日均需 = 差额 ÷ 剩余天数。本月近 7 日日均 ${text(last7,'amount')}`})}
    ],placeholder:'轻点进度条、虚线或数字查看算法'};
    function reset(){setSeg('month');segId='month';shown={rate:0,time:set.month.time,target:0,done:0,gap:0,need:0};show(set.month,800);}
    reset();return {reset};
  };

  /* ---------- K05 · progress ring + target quartet (month blue, year orange) ---------- */
  ChartDemos.kpi_ring=(root,C)=>{
    const key='kpi-ring';
    const cards=[{s:SC.month,k:'month',en:'MONTH',title:'月业绩',color:'var(--s-blue)',dim:'月度',period:'9 月'},{s:SC.year,k:'year',en:'YEAR',title:'年业绩',color:'var(--s-orange)',dim:'年度',period:'2026'}];
    const PARTS=[['target','目标','k-target'],['done','达成',''],['gap','差距','k-gap'],['time','时间进度','k-time']];
    root.classList.add('kpi-host');
    root.innerHTML=`<div class="kpi-tiles">${cards.map(c=>`<div class="kpi-card" role="group">
      ${head(c.en,c.title,`<span class="kpi-period" style="margin-left:auto" data-k="period">${c.period}</span>`)}
      <div class="kpi-ring-body"><svg class="kpi-ring" viewBox="0 0 108 108" data-k="ring"></svg><div class="kpi-rows">${PARTS.map(([id,label,cls])=>`<div class="kpi-row" data-k="${id}" data-part="${id}"><span class="kpi-key"><i class="${cls}"${id==='done'?` style="background:${c.color}"`:''}></i>${label}</span><b></b></div>`).join('')}</div></div>
      <div class="kpi-foot"><span data-k="chip"></span><span data-k="need"></span></div></div>`).join('')}</div>`;
    const tiles=[...root.querySelectorAll('.kpi-card')];let entrance=1;
    const rings=tiles.map((tile,i)=>{const c=cards[i],svg=q(tile,'ring'),R=46,cx=54,cy=54;
      const track=C.s('circle',{cx,cy,r:R,fill:'none',stroke:'var(--c-track)','stroke-width':10},svg);
      const gap=C.s('path',{fill:'none',stroke:'var(--c-text-4)','stroke-width':10,'stroke-dasharray':'2 3',opacity:0},svg);
      const arc=C.s('path',{fill:'none',stroke:c.color,'stroke-width':10,'stroke-linecap':'round'},svg);
      const tick=C.s('line',{stroke:'var(--st-bad)','stroke-width':2,'stroke-dasharray':'3 2','stroke-linecap':'butt'},svg);
      const num=C.s('text',{x:cx,y:cy+1,'text-anchor':'middle',fill:'var(--c-text)','font-size':17,'font-weight':650,style:'font-variant-numeric:tabular-nums'},svg);
      const lab=C.s('text',{x:cx,y:cy+16,'text-anchor':'middle',fill:'var(--c-text-4)','font-size':9.5,text:c.dim},svg);
      svg.setAttribute('role','img');
      return {c,svg,track,gap,arc,tick,num,lab,focus:null};});
    function paintRing(r){
      const {c,track,gap,arc,tick,num,focus}=r,R=46,cx=54,cy=54,rate=c.s.rate*entrance,deg=Math.min(rate,.9999)*360,tdeg=c.s.time*360;
      arc.setAttribute('d',deg>0.5?C.arc(cx,cy,R,0,deg):'');gap.setAttribute('d',C.arc(cx,cy,R,Math.min(deg,359.9),359.99));
      const a=tdeg*Math.PI/180,p1=[cx+(R-9)*Math.sin(a),cy-(R-9)*Math.cos(a)],p2=[cx+(R+9)*Math.sin(a),cy-(R+9)*Math.cos(a)];
      tick.setAttribute('x1',p1[0]);tick.setAttribute('y1',p1[1]);tick.setAttribute('x2',p2[0]);tick.setAttribute('y2',p2[1]);
      tick.setAttribute('opacity',C.clamp((entrance-.7)/.3,0,1)*(focus&&focus!=='time'?.35:1));tick.setAttribute('stroke-width',focus==='time'?3:2);
      arc.setAttribute('opacity',focus&&focus!=='done'?.35:1);arc.setAttribute('stroke-width',focus==='done'?12:10);
      gap.setAttribute('opacity',focus==='gap'?.9:0);C.paint(track,'stroke',focus==='target'?'var(--c-rule)':'var(--c-track)');
      num.textContent=K.fmt(rate,'rate').num;
    }
    function setFocus(i,part){rings[i].focus=part;tiles[i].querySelectorAll('.kpi-row').forEach(row=>row.classList.toggle('on',row.dataset.part===part));paintRing(rings[i]);}
    const vals=s=>{const u=K.cardScale('amount',s.target,s.cur.rev);return {target:text(s.target,'amount',{scale:u,short:true}),done:text(s.cur.rev,'amount',{scale:u,short:true}),gap:text(s.gap,'amount',{scale:u,short:true}),time:K.fmt(s.time,'rate').num};};
    // Values are written by fill() so a new page as-of date (截至日) can refresh the whole card.
    function fill(i){const c=cards[i],s=c.s,tile=tiles[i],v=vals(s),pc=pace(s.rate,s.time),latest=s===SC[c.k];
      PARTS.forEach(([id])=>{q(tile,id).querySelector('b').textContent=v[id];});
      q(tile,'chip').innerHTML=chipHTML(pc.tone,pc.icon,pc.label);q(tile,'need').textContent=`剩余 ${s.left} 天 · 日均需 ${text(s.need,'amount',{short:true,scale:'万'})}`;
      q(tile,'period').textContent=latest?c.period:`${c.period} · 截至 9/${s.elapsed-(c.k==='year'?243:0)}`;
      rings[i].svg.setAttribute('aria-label',`${c.title}达成 ${K.fmt(s.rate,'rate').num}，时间进度 ${v.time}`);
      tile.setAttribute('aria-label',`${c.title}：目标 ${v.target}，达成 ${v.done}，差距 ${v.gap}，时间进度 ${v.time}，${pc.label}`);}
    tiles.forEach((tile,i)=>{PARTS.forEach(([id])=>{const row=q(tile,id);['pointerenter','focus'].forEach(ev=>row.addEventListener(ev,()=>setFocus(i,id)));['pointerleave','blur'].forEach(ev=>row.addEventListener(ev,()=>setFocus(i,null)));});fill(i);});
    const targets=[];
    tiles.forEach((tile,i)=>{const c=cards[i],T=v=>text(v,'amount',{scale:K.cardScale('amount',c.s.target,c.s.cur.rev)});
      const reads={target:()=>({title:`${c.title} · 目标`,rows:[['目标',T(c.s.target)],['统计区间',c.s.span]],foot:'目标取当期（月 / 年）目标，不随时间拆分'}),
        done:()=>({title:`${c.title} · 达成`,rows:[['达成',text(c.s.cur.rev,'amount'),c.color],['达成率',K.fmt(c.s.rate,'rate').num]],foot:'达成率 = 达成 ÷ 目标；环心数字即达成率'}),
        gap:()=>({title:`${c.title} · 差距`,rows:[['差距',text(c.s.gap,'amount')],['剩余天数',c.s.left+' 天'],['日均需',text(c.s.need,'amount')]],foot:'差距 = 目标 − 达成；卡面按卡内最大值统一单位，浮层给原单位'}),
        time:()=>{const pc=pace(c.s.rate,c.s.time);return {title:`${c.title} · 时间进度`,rows:[['已过',c.s.elapsed+' / '+c.s.total+' 天'],['时间进度',K.fmt(c.s.time,'rate').num,'var(--st-bad)'],['达成率',K.fmt(c.s.rate,'rate').num,c.color],['结论',pc.label]],foot:'环上的红色虚线刻度 = 时间进度；弧头落后于刻度即滞后'};}};
      PARTS.forEach(([id])=>targets.push({el:q(tile,id),read:reads[id]}));
      targets.push({el:rings[i].svg,read:reads.time});
      rings[i].svg.addEventListener('pointerenter',()=>setFocus(i,'done'));rings[i].svg.addEventListener('pointerleave',()=>setFocus(i,null));});
    document.addEventListener('chart-asof',e=>{const set=e.detail.day===A.day?SC:scAt(e.detail.day);cards[0].s=set.month;cards[1].s=set.year;tiles.forEach((_,i)=>fill(i));rings.forEach(paintRing);});
    root.inspector={targets,placeholder:'轻点环或指标行查看算法'};
    function reset(){rings.forEach((r,i)=>setFocus(i,null));C.animate(key,1000,t=>{entrance=t;rings.forEach(paintRing);});}
    reset();return {reset};
  };
