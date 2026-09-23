  /* ---------- P04 · grid board: one time switch moves every cell ---------- */
  ChartDemos.kpi_grid=(root,C)=>{
    const key='kpi-grid';let sc=SC.month,shownV=SIX.map(()=>0),shownD=SIX.map(()=>0);
    root.classList.add('kpi-host','kpi-wide');
    root.innerHTML=`<div class="kpi-bar"><span class="eyebrow">SCORE GRID · 经营看板</span><div class="kpi-bar-end"><span class="kpi-period" data-k="period"></span>${seg('统计周期',[['month','本月'],['quarter','本季'],['year','本年']],'month')}</div></div>
      <div class="kpi-grid">${SIX.map(id=>{const m=MET[id];return `<div class="kpi-cell" data-id="${id}"><span class="kpi-eyebrow">${m.en}<b>${m.name}</b></span>${valueHTML('num','')}<div class="kpi-meta"><span><span data-k="cl"></span><span class="kpi-delta flat" data-k="d"></span></span></div></div>`;}).join('')}</div>`;
    const cells=[...root.querySelectorAll('.kpi-cell')];
    function show(s,dur){
      const fromV=[...shownV],fromD=[...shownD],toV=SIX.map(id=>s.cur[id]),toD=SIX.map(id=>change(s.cur[id],s.cmp[id],MET[id]).raw);sc=s;
      q(root,'period').textContent=s.label+' '+s.span;
      const scales=SIX.map((id,i)=>{const m=MET[id],f=fmt(toV[i],m.kind,{unit:m.unit});q(cells[i],'num-unit').textContent=f.unit;q(cells[i],'cl').textContent=s.cmp.short;
        const d=change(s.cur[id],s.cmp[id],m);cells[i].setAttribute('aria-label',`${m.name} ${f.num}${f.unit?' '+f.unit:''}，${s.cmp.label}${d.dir} ${d.text.replace(K.MINUS,'')}，${d.verdict}`);
        return m.kind==='amount'?(Math.abs(toV[i])>=1e4?'亿':'万'):undefined;});
      const items=cells.map((el,i)=>({el:q(el,'num'),from:fromV[i],to:toV[i],format:v=>fmt(v,MET[SIX[i]].kind,{unit:MET[SIX[i]].unit,scale:scales[i]??(MET[SIX[i]].kind==='count'&&Math.abs(toV[i])>=1e4?'万':undefined)}).num}));
      count(C,key,items,dur);shownV=toV;
      C.animate(key+'-d',dur,t=>{shownD=fromD.map((f,i)=>lerp(f,toD[i],t));cells.forEach((el,i)=>setDelta(q(el,'d'),K.fromRaw(shownD[i],MET[SIX[i]].change,MET[SIX[i]].polarity)));});
    }
    const setSeg=segWire(root,id=>show(SC[id],600));
    root.inspector={targets:cells.map((el,i)=>({el,read:()=>{const id=SIX[i],m=MET[id],b=sc.cmp,d=change(sc.cur[id],b[id],m),o={unit:m.unit,d:2};
      return {title:`${m.name} · ${sc.label}`,rows:[['本期 '+sc.span,text(sc.cur[id],m.kind,o)],['基期 '+b.span,text(b[id],m.kind,o)],[b.label,d.text+' · '+d.verdict]],foot:(id==='aov'?'客单价 = 营收 ÷ 订单数，逐期重算。':id==='margin'||id==='ontime'?'多月合并按权重重算（毛利率按营收、及时率按订单），不做简单平均。':id==='refund'?'退款率 = 退款单 ÷ 订单数，逐期重算。':'')+'三个周期共用一套月度数据。'};}})),placeholder:'轻点任一格查看本期与基期'};
    function reset(){setSeg('month');shownV=SIX.map(()=>0);shownD=SIX.map(()=>0);show(SC.month,700);}
    reset();return {reset};
  };

  /* ---------- P05 · scorecard table: every metric against its target ---------- */
  /* P05 · scorecard: rebuilt on TableKit (three-state sort), see the FTT module. */

  /* ---------- P07 · conversion chip chain (intensity = stage order) ---------- */
  ChartDemos.kpi_chain=(root,C)=>{
    const key='kpi-chain',F=DATA.funnel,first=F[0][1];let mode='step',shown=F.map(()=>0);
    const rate=(i,m)=>i===0?1:m==='step'?F[i][1]/F[i-1][1]:F[i][1]/first;
    root.classList.add('kpi-host','kpi-wide');
    root.innerHTML=`<div class="kpi-bar"><span class="eyebrow">FUNNEL · 本月销售转化</span><div class="kpi-bar-end"><span class="kpi-period">${SC.month.span}</span>${seg('转化口径',[['step','逐步'],['total','累计']],'step')}</div></div>
      <div class="kpi-chain">${F.map(([name,v],i)=>{const f=fmt(v,'count');return `${i?'<span class="kpi-arrow" aria-hidden="true">→</span>':''}<div class="kpi-stage" data-level="${i}"><div class="kpi-stage-chip">${name}</div><div class="v"><span data-k="num">0</span><small>${f.unit}</small></div><div class="r" data-k="r"></div></div>`;}).join('')}</div>
      <div class="kpi-foot"><span>整体转化 ${K.fmt(F[F.length-1][1]/first,'rate').num}（${nf(F[F.length-1][1])} ÷ ${nf(first)}） · 成交 ${nf(F[F.length-1][1])} = 订单数</span><span>色越浓，阶段越靠前</span></div>`;
    const stages=[...root.querySelectorAll('.kpi-stage')];
    function paint(vals){stages.forEach((el,i)=>{q(el,'r').innerHTML=i===0?'起点':`${mode==='step'?'转化':'累计'} <b>${nf(vals[i]*100,1)}%</b>`;});}
    function show(m,dur){const from=[...shown],to=F.map((_,i)=>rate(i,m));mode=m;
      stages.forEach((el,i)=>el.setAttribute('aria-label',`${F[i][0]} ${nf(F[i][1])}${i?`，逐步转化 ${K.fmt(rate(i,'step'),'rate').num}，累计转化 ${K.fmt(rate(i,'total'),'rate').num}`:'，起点'}`));
      C.animate(key+'-r',dur,t=>{shown=from.map((f,i)=>lerp(f,to[i],t));paint(shown);});}
    const setSeg=segWire(root,m=>show(m,500));
    root.inspector={targets:stages.map((el,i)=>({el,read:()=>({title:F[i][0],rows:[['人数',nf(F[i][1])]].concat(i?[['上一步 '+F[i-1][0],nf(F[i-1][1])],['逐步转化',K.fmt(rate(i,'step'),'rate').num,'var(--s-blue)'],['累计转化',K.fmt(rate(i,'total'),'rate').num],['本步流失',nf(F[i-1][1]-F[i][1])]]:[['说明','漏斗起点']]),foot:'卡面 ≥ 1 万写万（保留 1 位），读数浮层给全值'})})),placeholder:'轻点阶段查看转化与流失'};
    function reset(){setSeg('step');shown=F.map(()=>0);count(C,key,stages.map((el,i)=>({el:q(el,'num'),to:F[i][1],format:v=>fmt(v,'count',{scale:Math.abs(F[i][1])>=1e4?'万':''}).num})));show('step',700);}
    reset();return {reset};
  };
  } catch (err) { try { const c=typeof console==='undefined'?null:console,f=c&&(c.error||c.log); if(typeof f==='function')f.call(c,'[指标组件] 模块初始化失败',err); } catch (e) {} }
})();
