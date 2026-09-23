
  /* ---------- tab demos: content comes from the same cube, so every panel follows the page as-of date ---------- */
  const tabHash=(KEY,ids)=>({hashKey:KEY,ids:i=>ids()[i]===ids()[0]?null:ids()[i],fromHash:v=>ids().indexOf(v)});
  // Stretchable sparkline for tiles: decorative (aria-hidden); the numbers live in the tile and in the inspector.
  const tspark=(v,o={})=>{if(!v||v.length<2)return '';const lo=o.lo??Math.min(...v),hi=o.hi??Math.max(...v),n=v.length,Y=x=>(21-(x-lo)/((hi-lo)||1)*17).toFixed(2),pts=v.map((x,i)=>`${(i/(n-1)*100).toFixed(2)},${Y(x)}`).join('L');
    return `<svg class="ftt-tspark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="M${pts}L100,24L0,24Z"/>${o.target!==undefined?`<line class="t" x1="0" x2="100" y1="${Y(o.target)}" y2="${Y(o.target)}"/>`:''}<path class="l" d="M${pts}"/></svg>`;};
  const tiles=items=>`<div class="ftt-tiles">${items.map(t=>`<div class="ftt-tile" data-k="${t.k}"><span class="lab">${t.label}</span><span class="val"><b>${t.v}</b><small>${t.u||''}</small></span><span class="dl">${t.d||''}</span>${t.sp?tspark(t.sp):''}</div>`).join('')}</div>`;
  // Daily series 9/1 → as-of for one filter (tile sparklines); 日均 is the running average.
  function daySeries(f={}){const m=q(f,'day'),E=AsOf.get(),rev=[],ord=[],av=[],avg=[];let cum=0;
    for(let d=1;d<=E;d++){const v=m.get(d)||{rev:0,ord:0};rev.push(v.rev);ord.push(v.ord);av.push(v.ord?v.rev/v.ord:0);cum+=v.rev;avg.push(cum/d);}
    return {rev,ord,aov:av,avg};}
  function monthTiles(f={},spark=false){const c=q(f),b=qBase(f),days=AsOf.get(),s=spark?daySeries(f):{};
    return [{k:'rev',label:'营收',v:W(c.rev),u:'万元',d:deltaHTML(dlt(c.rev,b.rev)),sp:s.rev},{k:'ord',label:'订单',v:N(c.ord),u:'单',d:deltaHTML(dlt(c.ord,b.ord)),sp:s.ord},
      {k:'aov',label:'客单价',v:nf(Math.round(aov(c.rev,c.ord))),u:'元',d:deltaHTML(dlt(aov(c.rev,c.ord),aov(b.rev,b.ord))),sp:s.aov},{k:'avg',label:'日均营收',v:W(c.rev/days),u:'万元',d:deltaHTML(dlt(c.rev/days,b.rev/days)),sp:s.avg}];}
  // Stacked share bars, one per metric (items: {id,name,rev,ord}); where 营收 and 订单 shares differ, the gap is the ticket size.
  const MIXC=['var(--s-blue)','var(--s-sage)','var(--s-gold)','var(--s-purple)','var(--s-orange)','var(--s-graphite)'];
  function mixBars(items,tot,ms=['rev','ord'],kind='c'){
    const bars=ms.map(m=>`<div class="tk-mixrow"><span class="m">${m==='rev'?'营收':'订单'}</span><div class="tk-stack">${items.map((x,i)=>`<span class="seg" data-metric-target="true" tabindex="-1" data-kind="${kind}" data-m="${m}" data-id="${x.id}" style="flex:${x[m].toFixed(2)};background:${MIXC[i]}"></span>`).join('')}</div></div>`).join('');
    return bars+`<div class="fk-legend">${items.map((x,i)=>`<span><i class="fk-dot" style="background:${MIXC[i]};border-radius:2px"></i>${x.name} ${P(x.rev/tot.rev)}${ms.length>1?` <em>/ ${P(x.ord/tot.ord)}</em>`:''}</span>`).join('')}</div>`;}
  const aovNote=items=>{const a=items.map(x=>({...x,a:aov(x.rev,x.ord)})).sort((x,y)=>y.a-x.a),hi=a[0],lo=a[a.length-1];
    return `<p class="tk-mixnote">${hi.name}客单价 <b>${nf(Math.round(hi.a))}</b> 元最高、${lo.name} <b>${nf(Math.round(lo.a))}</b> 元最低——两条的错位就是客单价的差</p>`;};
  const segRead=el=>{const k=el.dataset.kind,id=el.dataset.id,t=q({}),v=k==='r'?q({regions:[id]}):k==='c'?q({channels:[id]}):q({segs:[id]}),name=k==='r'?regName(id):k==='c'?chName(id):SEG.find(s=>s.id===id).name;
    return {title:`${name} · 本月`,rows:[['营收',text(v.rev,'amount')],['订单',N(v.ord)+' 单'],['营收占比',P(v.rev/t.rev)],['订单占比',P(v.ord/t.ord)],['客单价',nf(Math.round(aov(v.rev,v.ord)))+' 元']],foot:'营收占比高于订单占比 = 客单价高于整体'};};
  const tileRead=(f,label='本月')=>k=>{const c=q(f),b=qBase(f),days=AsOf.get(),v={rev:[c.rev,b.rev],ord:[c.ord,b.ord],aov:[aov(c.rev,c.ord),aov(b.rev,b.ord)],avg:[c.rev/days,b.rev/days]}[k];
    const F=k==='ord'?x=>N(x)+' 单':k==='aov'?x=>nf(Math.round(x))+' 元':x=>text(x,'amount');
    return {title:`${{rev:'营收',ord:'订单',aov:'客单价',avg:'日均营收'}[k]} · ${label}`,rows:[[`9/1–${md(AsOf.key())}`,F(v[0])],[`8/1–8/${AsOf.get()}`,F(v[1])],['环比同期',dlt(v[0],v[1]).text]],foot:k==='aov'?'客单价 = 营收 ÷ 订单，逐期重算，不平均':k==='avg'?`日均 = 营收 ÷ ${days} 天`:'同期 = 8 月相同天数'};};

  /* ---------- T01 · page-level line tabs ---------- */
  ChartDemos.tab_line=(root,C)=>{
    const IDS=['overview','trend','mix','detail'],NAMES=['总览','趋势','结构','明细'],KEY='t01';
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('LINE TABS','页面级页签','自动激活 · 选中页签写进地址')}
      <div class="tk-list" data-k="list">${NAMES.map((n,i)=>`<button type="button" class="tk-tab" data-id="${IDS[i]}">${n}</button>`).join('')}</div>
      <div class="tk-panels" data-k="panels">
        <div data-p="overview"><div data-k="tiles"></div><div class="tk-prog" data-k="prog"></div><ul class="tk-points" data-k="points"></ul></div>
        <div data-p="trend"><svg class="tk-trend" data-k="trend" aria-label="9 月逐日营收柱与 7 日均线"><g data-k="plot"></g></svg><div class="fk-legend" style="margin-top:4px"><span><i class="fk-dot" style="background:var(--s-blue);border-radius:2px"></i>逐日营收</span><span><i class="fk-dot" style="background:var(--s-gold)"></i>7 日均线</span><span data-k="tcap"></span></div></div>
        <div data-p="mix"><div class="tk-mix" data-k="mix"></div></div>
        <div data-p="detail"><div data-k="table"></div></div></div>
      <p class="ftt-note">页面级切换用下划线：最轻、融入页面；选中用<b>加粗 + 2px 指示条</b>，不只靠颜色。← → 切换并立即显示（内容已在页面里，D2 自动激活）；Home / End 到首尾；Tab 进入面板。刷新或复制链接回到同一页签（D6）。四个面板共用一个最小高度，切换时页面不跳。</p>`;
    const list=qk(root,'list'),tabs=[...list.children],panels=[...qk(root,'panels').children];
    const TK1=TK.create(list,{tabs,panels,activation:'auto',...tabHash(KEY,()=>IDS),onSelect:i=>{say(root,`${NAMES[i]}页签`);if(IDS[i]==='trend')drawTrend();}});
    // Trend: drawn at its real pixel width (viewBox = rendered size), so labels stay 9–10px at any width.
    const svg=qk(root,'trend'),plot=qk(root,'plot'),G={L:34,R:630,T:16,B:222,H:248};let trendBars=[];
    const bw=()=>(G.R-G.L)/22;
    function drawTrend(){const w=Math.round(svg.getBoundingClientRect().width);if(!w)return;G.R=w-10;svg.setAttribute('viewBox',`0 0 ${w} ${G.H}`);plot.replaceChildren();
      const E=AsOf.get(),vals=DY.rev.slice(0,E),max=80,{L,R,T,B}=G,b=bw(),y=v=>B-(v/max)*(B-T);
      [0,40,80].forEach(v=>{C.s('line',{x1:L,x2:R,y1:y(v),y2:y(v),stroke:'var(--c-grid)','stroke-dasharray':v?'3 4':'none'},plot);C.s('text',{x:L-8,y:y(v)+3,'text-anchor':'end','font-size':9,fill:'var(--c-text-4)',text:String(v)},plot);});
      trendBars=vals.map((v,i)=>C.s('rect',{x:L+i*b+b*.2,width:b*.6,y:y(v),height:B-y(v),rx:2,fill:'var(--s-blue)'},plot));
      for(let i=E;i<22;i++)C.s('rect',{x:L+i*b+b*.2,width:b*.6,y:B-2,height:2,rx:1,fill:'var(--c-rule)'},plot);   // days after the as-of date: no data yet
      const avg=vals.map((_,i)=>i<6?null:sum(vals.slice(i-6,i+1))/7);
      C.s('path',{d:avg.map((v,i)=>v===null?'':`${i===6?'M':'L'}${(L+i*b+b/2).toFixed(1)},${y(v).toFixed(1)}`).join(''),fill:'none',stroke:'var(--s-gold)','stroke-width':2,'stroke-linejoin':'round'},plot);
      [1,8,15,22].forEach(d=>C.s('text',{x:L+(d-1)*b+b/2,y:B+16,'text-anchor':'middle','font-size':9,fill:'var(--c-text-4)',text:'9/'+d},plot));
      C.s('text',{x:L-8,y:T-6,'text-anchor':'start','font-size':9,fill:'var(--c-text-4)',text:'万元'},plot);}
    new ResizeObserver(()=>{if(TK1.index()===1)drawTrend();}).observe(svg);
    const tbl=TBK.create(qk(root,'table'),{root,caption:'本月各区域明细',key:r=>r.id,rows:[],
      columns:[{id:'name',label:'区域',rowHeader:true,value:r=>r.name},{id:'rev',label:'营收（万元）',num:true,sum:true,sortable:true,type:'amount',value:r=>r.rev},{id:'ord',label:'订单',num:true,sum:true,sortable:true,type:'count',value:r=>r.ord},
        {id:'aov',label:'客单价（元）',num:true,sortable:true,type:'yuan',value:r=>aov(r.rev,r.ord)},
        {id:'mom',label:'环比同期',num:true,sortable:true,type:'delta',value:r=>dlt(r.rev,r.base),sortValue:r=>r.rev/r.base-1},{id:'share',label:'占比',type:'bar',value:r=>r.share}],
      total:(rows,val)=>({name:'合计',rev:W(sum(rows.map(r=>val({id:'rev'},r)))),ord:N(sum(rows.map(r=>val({id:'ord'},r)))),aov:nf(Math.round(aov(sum(rows.map(r=>r.rev)),sum(rows.map(r=>r.ord))))),mom:deltaHTML(dlt(sum(rows.map(r=>r.rev)),sum(rows.map(r=>r.base)))),share:'100.0%'}),
      read:r=>({title:`${r.name} · 本月`,rows:[['营收',text(r.rev,'amount')],['订单',N(r.ord)+' 单'],['客单价',nf(Math.round(aov(r.rev,r.ord)))+' 元'],['环比同期',dlt(r.rev,r.base).text],['占比',P(r.share)]],foot:'同期 = 8 月相同天数'})});
    // 结构: 区域只有营收一条；渠道、客群各两条（营收 / 订单）。
    function mixHTML(){const c=q({},'region'),cc=q({},'channel'),tot=q({}),sg=SEG.map(s=>({id:s.id,name:s.name,...q({segs:[s.id]})}));
      const dims=[{t:'区域',k:'r',ms:['rev'],items:REG.map(r=>({id:r.id,name:r.name,...c.get(r.id)}))},{t:'渠道',k:'c',ms:['rev','ord'],items:CH.map(x=>({id:x.id,name:x.name,...cc.get(x.id)}))},{t:'客群',k:'s',ms:['rev','ord'],items:sg}];
      return dims.map(D=>`<div class="tk-mixblk"><span class="tk-mixdim">${D.t}</span><div class="tk-mixbars">${mixBars(D.items,tot,D.ms,D.k)}${D.ms.length>1?aovNote(D.items):''}</div></div>`).join('')+`<p class="ftt-span" style="margin:2px 0 0">图例数字 = 营收占比 <em>/ 订单占比</em></p>`;}
    // 总览要点: generated from the same cube, so they follow the as-of date.
    function pointsHTML(){const c=q({},'region'),b=qBase({},'region'),t=q({}),tb=qBase({});
      const rs=REG.map(r=>({r,cur:c.get(r.id).rev,base:b.get(r.id).rev})).map(x=>({...x,d:x.cur/x.base-1})).sort((x,y)=>y.d-x.d),best=rs[0],worst=rs[rs.length-1],neg=rs.filter(x=>x.d<0);
      const dr=t.rev/tb.rev-1,dor=t.ord/tb.ord-1;
      return [`<b>${best.r.name}</b> 环比同期 ${deltaHTML(dlt(best.cur,best.base))}，六个大区里涨得最快`,
        neg.length?`<b>${worst.r.name}</b> 环比同期 ${deltaHTML(dlt(worst.cur,worst.base))}，${neg.length===1?'唯一下滑的大区':`${neg.length} 个大区下滑，它跌得最多`}`:`六个大区全部增长，最慢的 <b>${worst.r.name}</b> ${deltaHTML(dlt(worst.cur,worst.base))}`,
        `客单价 ${deltaHTML(dlt(aov(t.rev,t.ord),aov(tb.rev,tb.ord)))}：订单${dor>dr?'涨得比营收快':'涨得比营收慢'}（${dlt(t.ord,tb.ord).text} 对 ${dlt(t.rev,tb.rev).text}）`].map(x=>`<li>${x}</li>`).join('');}
    function render(){const c=q({},'region'),b=qBase({},'region'),tot=q({}).rev;
      qk(root,'tiles').innerHTML=tiles(monthTiles({},true));
      qk(root,'tiles').querySelectorAll('.ftt-tile').forEach(t=>t.dataset.metricTarget='true');
      const m=KD.scAt(AsOf.get()).month,pc=K.pace(m.rate,m.time);
      qk(root,'prog').innerHTML=`<div class="lab">营收目标达成 <b>${P(m.rate)}</b> · 时间进度 <b>${P(m.time)}</b> ${K.chipHTML(pc.tone,pc.icon,pc.label)}<span class="mut">目标 ${WU(m.target)} · 剩余 ${m.left} 天</span></div><div class="bar" aria-hidden="true"><i style="width:${(Math.min(1,m.rate)*100).toFixed(1)}%"></i><span class="mk" style="left:${(m.time*100).toFixed(1)}%"></span></div>`;
      qk(root,'points').innerHTML=pointsHTML();
      tbl.update(REG.map(r=>({id:r.id,name:r.name,rev:c.get(r.id).rev,ord:c.get(r.id).ord,base:b.get(r.id).rev,share:c.get(r.id).rev/tot})));
      qk(root,'mix').innerHTML=mixHTML();
      qk(root,'tcap').textContent=`9/1–${md(AsOf.key())} · 截至日之后为空`;
      if(TK1.index()===1)drawTrend();}
    AsOf.on(render);
    root.inspector={targets:[],probe:{svg,get min(){return G.L+bw()/2;},get max(){return G.L+(AsOf.get()-.5)*bw();},top:G.T,bottom:G.B,count:()=>AsOf.get(),
        hover:i=>trendBars.forEach((r,j)=>r.setAttribute('opacity',i<0||i===j?1:.35)),
        read:i=>({title:`9 月 ${i+1} 日 · 周${WDN[wday(key(2026,9,i+1))]}`,rows:[['营收',text(DY.rev[i],'amount'),'var(--s-blue)'],['7 日均',i<6?'—':text(sum(DY.rev.slice(i-6,i+1))/7,'amount'),'var(--s-gold)']],foot:'7 日均 = 当天及前 6 天平均'})},
      lookup:lookups(tbl.lookup,el=>{if(el.classList.contains('ftt-tile'))return {el,read:()=>tileRead({})(el.dataset.k)};if(el.classList.contains('seg'))return {el,read:()=>segRead(el)};return null;}),placeholder:'轻点任一数字、色段或行查看读数'};
    function reset(){TK1.select(0,{source:'api',silent:true});Hash.set(KEY,null,{push:false});render();}
    if(Hash.get(KEY))touched(root);render();
    return {reset};
  };

  /* ---------- T02 · pill tabs inside a card + a segmented parameter (two levels max, D5) ---------- */
  ChartDemos.tab_pill=(root,C)=>{
    const IDS=['channel','region','segment'],NAMES=['渠道','区域','客群'],KEY='t02';let metric='rev';
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('PILL TABS','卡内页签',seg('指标',[['rev','营收'],['ord','订单']],'rev'))}
      <div><div class="tk-pills" data-k="list">${NAMES.map((n,i)=>`<button type="button" class="tk-tab" data-id="${IDS[i]}">${n}</button>`).join('')}</div></div>
      <div data-k="panels" class="tk-pillpanels">${IDS.map(id=>`<div data-p="${id}"><div class="ftt-big tk-sum" data-k="s-${id}"></div><div class="fk-hbars" data-k="b-${id}"></div><div class="tk-mixbars tk-share" data-k="m-${id}"></div></div>`).join('')}</div>
      <p class="ftt-note">卡内切<b>内容</b>用药丸页签，切<b>参数</b>用右上角的分段控件——两层语义不同，才不会打架；不再往下嵌第三层（D5）。</p>`;
    const list=qk(root,'list'),TK2=TK.create(list,{tabs:[...list.children],panels:[...qk(root,'panels').children],activation:'auto',ink:false,...tabHash(KEY,()=>IDS),onSelect:i=>say(root,`${NAMES[i]}页签`)});
    const setSeg=segWire(root.querySelector('.ftt-bar'),m=>{metric=m;render();say(root,m==='rev'?'按营收':'按订单');});
    function render(){const f=metric==='rev'?W:N,u=metric==='rev'?'万元':'单';
      const c=q({},'channel'),r=q({},'region'),cb=qBase({},'channel'),rb=qBase({},'region'),sg=SEG.map(s=>({id:s.id,name:s.name,cur:q({segs:[s.id]}),base:qBase({segs:[s.id]})})),t=q({}),tb=qBase({});
      const data={channel:CH.map(x=>({id:x.id,name:x.name,v:c.get(x.id)[metric],b:cb.get(x.id)[metric]})),region:REG.map(x=>({id:x.id,name:x.name,v:r.get(x.id)[metric],b:rb.get(x.id)[metric]})).sort((a,b)=>b.v-a.v),segment:sg.map(x=>({id:x.id,name:x.name,v:x.cur[metric],b:x.base[metric]}))};
      IDS.forEach((id,i)=>{hbars(qk(root,'b-'+id),data[id],{fmt:v=>f(v),target:true,extra:it=>deltaHTML(dlt(it.v,it.b)),label:it=>`${it.name} ${f(it.v)} ${u}，环比同期 ${dlt(it.v,it.b).text}`});
        qk(root,'s-'+id).innerHTML=`<span class="v">${f(t[metric])}</span><span class="u">${u}</span><span class="u">· ${data[id].length} 个${NAMES[i]} · 9/1–${md(AsOf.key())} · 环比同期</span>${deltaHTML(dlt(t[metric],tb[metric]))}`;
        // 结构条：同一指标的占比（条形看大小，结构条看份额）
        const raw={channel:CH.map(x=>({id:x.id,name:x.name,...c.get(x.id)})),region:REG.map(x=>({id:x.id,name:x.name,...r.get(x.id)})).sort((a,b)=>b[metric]-a[metric]),segment:sg.map(x=>({id:x.id,name:x.name,...x.cur}))}[id];
        qk(root,'m-'+id).innerHTML=mixBars(raw,t,[metric],{channel:'c',region:'r',segment:'s'}[id]);});}
    AsOf.on(render);
    root.inspector={targets:[],lookup:el=>{if(el.classList.contains('seg'))return {el,read:()=>segRead(el)};if(!el.classList.contains('fk-hbar'))return null;const pid=el.closest('[data-p]').dataset.p,id=el.dataset.id;
      const v=pid==='channel'?q({channels:[id]}):pid==='region'?q({regions:[id]}):q({segs:[id]}),t=q({});return {el,read:()=>({title:`${el.querySelector('.n').textContent} · 本月`,rows:[['营收',text(v.rev,'amount')],['订单',N(v.ord)+' 单'],['客单价',nf(Math.round(aov(v.rev,v.ord)))+' 元'],['营收占比',P(v.rev/t.rev)]],foot:'分段控件只换指标，不换内容区'})};},placeholder:'轻点任一条形查看读数'};
    function reset(){TK2.select(0,{silent:true});metric='rev';setSeg('rev');Hash.set(KEY,null,{push:false});render();}
    if(Hash.get(KEY))touched(root);render();
    return {reset};
  };

  /* ---------- T05 · badge tabs (count only; hidden at zero) ---------- */
  ChartDemos.tab_badge=(root,C)=>{
    const IDS=['todo','watch','done','all'],NAMES=['待办','关注','已处理','全部'],KEY='t05';
    let items=[];
    function seed(){const E=AsOf.get(),bad=Array.from({length:E},(_,i)=>key(2026,9,i+1)).filter(k=>dayStatus(k)==='bad');
      items=[...bad.map(k=>{const v=dayAt(k),t=dayTarget(k);return {id:'d'+k,st:'todo',orig:'todo',title:`${md(k)} 周${WDN[wday(k)]} 营收 <b>${W(v.rev)} 万</b>，未达日目标`,desc:`日目标 ${W(t)} 万 · 达成 ${P(v.rev/t)}`};}),
        {id:'w1',st:'watch',orig:'watch',title:'华中营收环比 <b>'+dlt(q({regions:['central']}).rev,qBase({regions:['central']}).rev).text+'</b>',desc:'6 个区域里唯一下降的'},
        {id:'w2',st:'watch',orig:'watch',title:'交付及时率 <b>96.4%</b>，低于 98% 目标',desc:'落在 95–98% 关注区间'},
        {id:'w3',st:'watch',orig:'watch',title:'客单价达成 <b>97.5%</b>',desc:'营收 ÷ 订单目标 5,455 元'},
        {id:'x1',st:'done',orig:'watch',title:'8/31 退款率 <b>2.2%</b> 超上限',desc:'已复核：大促退货，已关闭'},{id:'x2',st:'done',orig:'todo',title:'8/28 华南物流延迟',desc:'承运商已切换，已关闭'}];}
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('BADGE TABS','徽标页签','徽标只放数量 · 为 0 时隐藏')}
      <div class="tk-list" data-k="list">${NAMES.map((n,i)=>`<button type="button" class="tk-tab" data-id="${IDS[i]}">${n}<span class="tk-badge${IDS[i]==='watch'?' warn':''}" data-k="n-${IDS[i]}" aria-hidden="true"></span></button>`).join('')}</div>
      <div data-k="panels">${IDS.map(id=>`<div data-p="${id}" class="tk-scrollpanel"><div class="tk-item-list" data-k="l-${id}"></div></div>`).join('')}</div>
      <p class="ftt-note">徽标数值变化写进页签的 <code>aria-label</code>（「待办，4 项」），不单独播报；<b>图标与徽标不替代文字</b>。</p>`;
    const list=qk(root,'list'),tabsEl=[...list.children];
    const TK5=TK.create(list,{tabs:tabsEl,panels:[...qk(root,'panels').children],activation:'auto',...tabHash(KEY,()=>IDS),onSelect:i=>{fade();say(root,`${NAMES[i]}，${count(IDS[i])} 项`);}});
    const count=id=>id==='all'?items.length:items.filter(x=>x.st===id).length;
    const ACT={todo:[['done','标记已处理']],watch:[['done','移出关注']],done:[['back','撤回']]};
    function render(){
      IDS.forEach((id,i)=>{const n=count(id),b=qk(root,'n-'+id);b.textContent=n;b.hidden=!n||id==='all';tabsEl[i].setAttribute('aria-label',`${NAMES[i]}，${n} 项`);
        const L=qk(root,'l-'+id),rows=id==='all'?items:items.filter(x=>x.st===id);
        L.innerHTML=rows.length?rows.map(x=>`<div class="tk-alert"><span class="kpi-chip ${x.st==='todo'?'bad':x.st==='watch'?'warn':'good'}"><i aria-hidden="true">${x.st==='todo'?'✕':x.st==='watch'?'!':'✓'}</i>${{todo:'待办',watch:'关注',done:'已处理'}[x.st]}</span><div><div>${x.title}</div><div class="d">${x.desc}</div></div>${id==='all'?'':(ACT[x.st]||[]).map(([a,l])=>`<button type="button" class="fk-btn" data-a="${a}" data-id="${x.id}">${l}</button>`).join('')}</div>`).join('')
          :`<div class="ftt-empty"><div class="big">${id==='todo'?'待办都处理完了':'这里是空的'}</div><div class="sub">${id==='todo'?'新出现的未达标日会重新出现在这里':'—'}</div></div>`;});
      fade();
    }
    qk(root,'panels').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const x=items.find(i=>i.id===b.dataset.id);if(!x)return;
      // Read everything off the button before render() replaces it.
      const from=x.st,pid=b.closest('[data-p]').dataset.p,label=b.textContent,at=[...qk(root,'l-'+pid).querySelectorAll('.tk-alert')].indexOf(b.closest('.tk-alert'));
      x.st=b.dataset.a==='back'?x.orig:'done';render();touched(root);
      // Focus stays in place: the row that moved up into this position (or the new last row); an emptied list sends focus to its tab.
      const left=[...qk(root,'l-'+pid).querySelectorAll('.tk-alert')].filter(r=>r.querySelector('[data-a]'));
      const next=left.length?left[Math.min(Math.max(at,0),left.length-1)].querySelector('[data-a]'):tabsEl[IDS.indexOf(pid)];next.focus();
      say(root,`已${label}，${NAMES[IDS.indexOf(from)]}剩 ${count(from)} 项`);});
    // Fixed-height panels scroll; a bottom fade says "more below" and goes away at the end.
    function fade(){qk(root,'panels').querySelectorAll('.tk-scrollpanel').forEach(p=>p.classList.toggle('fade-b',p.scrollHeight-p.scrollTop-p.clientHeight>2));}
    qk(root,'panels').querySelectorAll('.tk-scrollpanel').forEach(p=>p.addEventListener('scroll',fade,{passive:true}));
    new ResizeObserver(fade).observe(qk(root,'panels'));
    AsOf.on(()=>{seed();render();});
    root.inspector={targets:[],placeholder:'徽标只表示数量'};
    function reset(){TK5.select(0,{silent:true});Hash.set(KEY,null,{push:false});seed();render();}
    if(Hash.get(KEY))touched(root);seed();render();
    return {reset};
  };

  /* ---------- T06 · overflow: scroll + fading edges + arrows + "more" menu ---------- */
  ChartDemos.tab_over=(root,C)=>{
    const KEY='t06',PV=REG.flatMap(r=>GEO[r.id].map(p=>({id:r.id+'.'+p[0],name:p[1],region:r.id,m:p[2]}))).sort((a,b)=>b.m-a.m);   // data-generated order: by revenue
    const menuId=nid('menu');
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('OVERFLOW','页签溢出',`${PV.length} 个省份`)}
      <div class="tk-over" data-k="over"><button type="button" class="tk-arrow" data-dir="-1" tabindex="-1" aria-hidden="true">‹</button>
        <div class="tk-scroll" data-k="scroll"><div class="tk-list" data-k="list">${PV.map(p=>`<button type="button" class="tk-tab" data-id="${p.id}">${p.name}</button>`).join('')}</div></div>
        <button type="button" class="tk-arrow" data-dir="1" tabindex="-1" aria-hidden="true">›</button>
        <span class="tk-more"><button type="button" class="fk-btn ghost" data-k="more" aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}">更多 ▾</button>
          <div class="tk-menu" role="menu" id="${menuId}" aria-label="全部省份" data-k="menu" hidden></div></span></div>
      <div data-k="panels">${PV.map(p=>`<div data-p="${p.id}"></div>`).join('')}</div>
      <p class="ftt-note">优先横向滚动 + 边缘渐隐；方向键移动时<b>自动把页签滚进可视区</b>。页签由数据生成、数量不可控时再上「更多」——它是菜单按钮，不是页签。</p>`;
    const list=qk(root,'list'),scroller=qk(root,'scroll'),over=qk(root,'over'),panels=[...qk(root,'panels').children];
    const TK6=TK.create(list,{tabs:[...list.children],panels,activation:'auto',...tabHash(KEY,()=>PV.map(p=>p.id)),onSelect:i=>{fill(i);say(root,PV[i].name);}});
    function edges(){const s=scroller.scrollLeft,max=scroller.scrollWidth-scroller.clientWidth;over.classList.toggle('fade-l',s>2);over.classList.toggle('fade-r',s<max-2);
      over.querySelector('[data-dir="-1"]').disabled=s<=2;over.querySelector('[data-dir="1"]').disabled=s>=max-2;}
    scroller.addEventListener('scroll',edges,{passive:true});new ResizeObserver(edges).observe(scroller);
    over.querySelectorAll('.tk-arrow').forEach(b=>b.addEventListener('click',()=>scroller.scrollBy({left:+b.dataset.dir*scroller.clientWidth*.7})));
    // "More" is a menu button (W3C APG): Enter / Space / ↓ opens, ↑ ↓ move, Enter picks, Esc closes and returns focus.
    const more=qk(root,'more'),menu=qk(root,'menu');
    menu.innerHTML=REG.map(r=>`<div class="grp" role="presentation">${r.name}</div>${PV.filter(p=>p.region===r.id).map(p=>`<button type="button" role="menuitemradio" tabindex="-1" data-id="${p.id}" aria-checked="false">${p.name}</button>`).join('')}`).join('');
    const mItems=[...menu.querySelectorAll('[role="menuitemradio"]')];
    function openMenu(at=null){menu.hidden=false;more.setAttribute('aria-expanded','true');const cur=PV[TK6.index()].id;mItems.forEach(m=>m.setAttribute('aria-checked',String(m.dataset.id===cur)));
      // Flip above the button when there is no room below (same rule as FilterKit popovers); focus without scrolling the page.
      menu.classList.remove('up');const mr=menu.getBoundingClientRect(),br=more.getBoundingClientRect(),tb=document.querySelector('.topbar')?.getBoundingClientRect().bottom||0;
      if(mr.bottom>innerHeight-8&&br.top-mr.height-12>tb)menu.classList.add('up');
      const it=at==='last'?mItems[mItems.length-1]:mItems.find(m=>m.dataset.id===cur)||mItems[0];it.focus({preventScroll:true});it.scrollIntoView({block:'nearest'});root.closest('.specimen').classList.add('fk-raised');}
    function closeMenu(back=true){menu.hidden=true;more.setAttribute('aria-expanded','false');root.closest('.specimen').classList.remove('fk-raised');if(back)more.focus();}
    more.addEventListener('click',()=>menu.hidden?openMenu():closeMenu());
    more.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();openMenu(e.key==='ArrowUp'?'last':null);}});
    menu.addEventListener('keydown',e=>{const i=mItems.indexOf(document.activeElement);let j=null;
      if(e.key==='ArrowDown')j=(i+1)%mItems.length;else if(e.key==='ArrowUp')j=(i-1+mItems.length)%mItems.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=mItems.length-1;
      else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMenu();return;}else if(e.key==='Tab'){closeMenu(false);return;}
      else if(e.key.length===1){const k=mItems.findIndex((m,x)=>x>i&&m.textContent.startsWith(e.key))??-1;if(k>=0)j=k;else return;}else return;
      e.preventDefault();e.stopPropagation();mItems[j].focus();});
    menu.addEventListener('click',e=>{const m=e.target.closest('[role="menuitemradio"]');if(!m)return;closeMenu(false);TK6.select(PV.findIndex(p=>p.id===m.dataset.id),{focus:true,source:'menu'});});
    document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==more)closeMenu(false);},true);
    function fill(i){const p=PV[i],g=FD.geo(p.id),reg=q({regions:[p.region]}),node=GEO[p.region].find(x=>p.id.endsWith('.'+x[0]));
      const kids=node&&node[4]?node[4].map(c=>({id:p.id+'.'+c[0],name:c[1],v:FD.geo(p.id+'.'+c[0]).rev})).sort((a,b)=>b.v-a.v):null;
      panels[i].innerHTML=`${tiles([{k:'rev',label:'营收',v:W(g.rev),u:'万元',d:deltaHTML(dlt(g.rev,g.base))},{k:'share',label:`占${regName(p.region)}`,v:P(g.rev/reg.rev),u:''},{k:'rank',label:'大区内排名',v:String(1+GEO[p.region].filter(x=>x[2]>node[2]).length),u:` / ${GEO[p.region].length}`}])}
        ${kids?`<div class="fk-hbars" style="margin-top:10px" data-k="kids"></div>`:`<p class="ftt-note" style="margin-top:10px">${p.name}没有下级城市数据。</p>`}`;
      if(kids)hbars(panels[i].querySelector('[data-k="kids"]'),kids,{target:false});}
    AsOf.on(()=>fill(TK6.index()));
    root.inspector={targets:[],placeholder:'方向键浏览省份；「更多」可一次看到全部'};
    function reset(){closeMenu(false);TK6.select(0,{silent:true});scroller.scrollLeft=0;Hash.set(KEY,null,{push:false});fill(0);edges();}
    if(Hash.get(KEY))touched(root);fill(TK6.index());requestAnimationFrame(edges);
    return {reset};
  };

  /* ---------- T07 · vertical tabs (collapse to horizontal scrolling at ≤700px) ---------- */
  ChartDemos.tab_vert=(root,C)=>{
    const IDS=['overview','channel','region','segment','service'],NAMES=['经营总览','渠道','区域','客群','履约'],KEY='t07';
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('VERTICAL','纵向页签','窄屏退化为横向滚动')}
      <div class="tk-vert"><div class="tk-list" data-k="list">${NAMES.map((n,i)=>`<button type="button" class="tk-tab" data-id="${IDS[i]}">${n}</button>`).join('')}</div>
        <div data-k="panels">${IDS.map(id=>`<div data-p="${id}"></div>`).join('')}</div></div>
      <p class="ftt-note">条目多、文案长的设置型页面用纵向页签；<b>不作主导航</b>（Carbon）。纵向时 ↑ ↓ 移动，窄屏变成横向后改用 ← →，<code>aria-orientation</code> 同步切换。</p>`;
    const list=qk(root,'list'),panels=[...qk(root,'panels').children];
    const mq=matchMedia('(max-width:700px)');
    const TK7=TK.create(list,{tabs:[...list.children],panels,activation:'auto',orientation:mq.matches?'horizontal':'vertical',...tabHash(KEY,()=>IDS),onSelect:i=>say(root,NAMES[i])});
    mq.addEventListener('change',()=>TK7.setOrientation(mq.matches?'horizontal':'vertical'));
    function render(){const S=DATA.service,MO_=DATA.monthly,E=AsOf.get(),t=q({}),ds=daySeries({});
      // 经营总览：三块数 + 逐日营收（截至日之后留空位）
      panels[0].innerHTML=tiles(monthTiles().slice(0,3))+`<div class="tk-daily"><div class="fk-cols" data-k="d0" aria-hidden="true"></div><div class="tk-axis"><span>9/1</span><span>逐日营收 · 9/1–${md(AsOf.key())} 累计，同期 = 8 月相同天数</span><span>9/22</span></div></div>`;
      cols(panels[0].querySelector('[data-k="d0"]'),Array.from({length:22},(_,i)=>i<E?{v:ds.rev[i]}:{v:0,cls:'miss'}));
      // 渠道：营收与环比 + 营收 / 订单结构
      const c=q({},'channel'),cb=qBase({},'channel'),ci=CH.map(x=>({id:x.id,name:x.name,...c.get(x.id)}));
      panels[1].innerHTML=`<div class="fk-hbars" data-k="c"></div><div class="tk-mixbars" style="margin-top:12px">${mixBars(ci,t,['rev','ord'],'c')}${aovNote(ci)}</div>`;
      hbars(panels[1].querySelector('[data-k="c"]'),CH.map(x=>({id:x.id,name:x.name,v:c.get(x.id).rev,b:cb.get(x.id).rev})),{extra:it=>deltaHTML(dlt(it.v,it.b)),label:it=>`${it.name} ${WU(it.v)}，环比同期 ${dlt(it.v,it.b).text}`});
      // 区域：营收与环比
      const r=q({},'region'),rb=qBase({},'region');
      panels[2].innerHTML=`<div class="fk-hbars" data-k="r"></div>`;
      hbars(panels[2].firstChild,REG.map(x=>({id:x.id,name:x.name,v:r.get(x.id).rev,b:rb.get(x.id).rev})).sort((a,b)=>b.v-a.v),{extra:it=>deltaHTML(dlt(it.v,it.b)),label:it=>`${it.name} ${WU(it.v)}，环比同期 ${dlt(it.v,it.b).text}`});
      // 客群：两块数 + 各渠道复购占营收
      const sg=SEG.map(s=>({s,...q({segs:[s.id]})}));
      panels[3].innerHTML=tiles(sg.map(x=>({k:x.s.id,label:x.s.name,v:W(x.rev),u:'万元',d:`${N(x.ord)} 单 · 客单价 ${nf(Math.round(aov(x.rev,x.ord)))} 元`})))+`<p class="ftt-lab" style="margin:12px 0 4px">各渠道复购占营收</p><div class="fk-hbars" data-k="s"></div>`;
      hbars(panels[3].querySelector('[data-k="s"]'),CH.map(x=>({id:x.id,name:x.name,v:q({channels:[x.id],segs:['repeat']}).rev/c.get(x.id).rev})),{max:1,fmt:v=>P(v),label:it=>`${it.name} 复购占营收 ${P(it.v)}`});
      // 履约：按周更新，不跟截至日
      panels[4].innerHTML=tiles([{k:'on',label:`及时率 · ${S.week.label}`,v:P(S.week.ontime),u:'',d:S.week.span},{k:'resp',label:'响应时长 · 本周',v:nf(S.week.response,1),u:'小时',d:`本月 ${nf(S.month.response,1)} · 上月 ${nf(S.last.response,1)}`},{k:'mon',label:'及时率 · 9 月',v:P(MO_.ontime[8]),u:'',d:'目标 ≥ 98.0%'}])
        +`<div class="tk-daily"><p class="ftt-lab" style="margin:0 0 4px">交付及时率 · 1–9 月（虚线 = 98% 目标）</p>${tspark(MO_.ontime.slice(0,9),{target:.98,lo:.94,hi:1})}<div class="tk-axis"><span>1 月 ${P(MO_.ontime[0])}</span><span>履约按周更新，不随截至日变化</span><span>9 月 ${P(MO_.ontime[8])}</span></div></div>`;}
    AsOf.on(render);
    root.inspector={targets:[],lookup:el=>el.classList.contains('seg')?{el,read:()=>segRead(el)}:null,placeholder:'纵向页签切换内容区；轻点色段看读数'};
    function reset(){TK7.select(0,{silent:true});Hash.set(KEY,null,{push:false});render();}
    if(Hash.get(KEY))touched(root);render();
    return {reset};
  };

  /* ---------- T08 · dynamic tabs: add / close, manual activation (new views need fetching, D2) ---------- */
  ChartDemos.tab_dyn=(root,C)=>{
    const KEY='t08',MAX=6;
    const SEED=()=>[{id:'mine',name:'我的视图',f:{},fixed:true},{id:'east',name:'华东复盘',f:{regions:['east']}},{id:'online',name:'电商专题',f:{channels:['online']}}];
    let views=SEED(),seq=1,timer=0;
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('DYNAMIC','动态页签','手动激活 · Enter 切换')}
      <div class="tk-dyn"><div class="tk-list" data-k="list"></div><button type="button" class="fk-btn tk-add" data-k="add">＋ 新建视图</button></div>
      <div data-k="panels"></div>
      <p class="ftt-note">切换视图要重新取数，所以方向键只移动焦点，<b>Enter / 空格才切换</b>（APG 手动激活）。关闭当前视图后焦点落到相邻页签；Delete 也能关闭。页签上的 ✕ 只给鼠标用，键盘与读屏用面板里的「关闭此视图」。</p>`;
    let list=qk(root,'list');const panelsEl=qk(root,'panels');let TK8=null;
    const vf=v=>[v.f.regions?'区域 '+v.f.regions.map(regName).join('、'):null,v.f.channels?'渠道 '+v.f.channels.map(chName).join('、'):null].filter(Boolean).join(' · ')||'全部区域 · 全部渠道';
    function build(sel=0,focus=false){
      const fresh=list.cloneNode(false);list.replaceWith(fresh);list=fresh;   // drop the previous TabKit's listeners
      list.innerHTML=views.map(v=>`<span class="tk-item" role="none" data-v="${v.id}"><button type="button" class="tk-tab" data-id="${v.id}">${v.name}</button>${v.fixed?'':`<button type="button" class="tk-x" tabindex="-1" aria-hidden="true" data-close="${v.id}" title="关闭 ${v.name}">✕</button>`}</span>`).join('');
      panelsEl.innerHTML=views.map(v=>`<div data-p="${v.id}" class="tk-dynpanel"><div class="ftt-row" style="justify-content:space-between"><span class="ftt-span">${vf(v)}</span>${v.fixed?'':`<button type="button" class="fk-btn ghost" data-close="${v.id}">关闭此视图</button>`}</div><div class="tk-body" data-k="body-${v.id}"></div></div>`).join('');
      const tabs=[...list.querySelectorAll('.tk-tab')],panels=[...panelsEl.children];
      TK8=TK.create(list,{tabs,panels,activation:'manual',ink:false,selected:sel,onSelect:(i,prev,src)=>{load(i);paintItems();if(src!=='hash')Hash.set(KEY,i?views[i].id:null);say(root,`${views[i].name}，已切换`);},
        onKey:(e,i)=>{if(e.key==='Delete'&&!views[i].fixed){e.preventDefault();e.stopPropagation();close(views[i].id);}}});
      paintItems();load(TK8.index(),false);if(focus)tabs[TK8.index()].focus();
      qk(root,'add').disabled=views.length>=MAX;qk(root,'add').title=views.length>=MAX?`最多 ${MAX} 个视图`:'';}
    function paintItems(){list.querySelectorAll('.tk-item').forEach((it,i)=>it.classList.toggle('on',i===TK8.index()));}
    function load(i,skel=true){const v=views[i],body=qk(root,'body-'+v.id);clearTimeout(timer);
      const draw=()=>{const f=v.f,r=q(f,'region'),c=q(f,'channel'),by=f.regions?CH.map(x=>({id:x.id,name:x.name,v:c.get(x.id)?.rev||0})):REG.map(x=>({id:x.id,name:x.name,v:r.get(x.id)?.rev||0})).sort((a,b)=>b.v-a.v);
        body.innerHTML=`<div>${tiles(monthTiles(f,true).slice(0,3))}</div><div class="fk-hbars"></div>`;hbars(body.querySelector('.fk-hbars'),by.filter(x=>x.v>0));};
      if(!skel||reduced()){draw();return;}body.innerHTML=`<div class="tk-skel" aria-hidden="true"><i style="width:72%"></i><i style="width:88%"></i><i style="width:64%"></i></div>`;body.setAttribute('aria-busy','true');
      timer=setTimeout(()=>{body.removeAttribute('aria-busy');draw();},380);}
    function close(id){const i=views.findIndex(v=>v.id===id);if(i<0||views[i].fixed)return;const wasSel=i===TK8.index();views.splice(i,1);
      const next=wasSel?Math.min(i,views.length-1):TK8.index()>i?TK8.index()-1:TK8.index();build(next,true);if(wasSel)TK8.select(next,{source:'key'});
      Hash.set(KEY,next===0?null:views[next].id);touched(root);say(root,`已关闭视图，当前 ${views[TK8.index()].name}`);}
    root.addEventListener('click',e=>{const b=e.target.closest('[data-close]');if(b){close(b.dataset.close);}});
    qk(root,'add').addEventListener('click',()=>{if(views.length>=MAX)return;const v={id:'v'+(++seq),name:`视图 ${seq+1}`,f:{}};views.push(v);build(views.length-1,true);load(views.length-1);Hash.set(KEY,v.id);touched(root);say(root,`已新建 ${v.name}`);});
    AsOf.on(()=>load(TK8.index(),false));
    root.inspector={targets:[],placeholder:'Enter 切换视图，Delete 关闭'};
    function reset(){clearTimeout(timer);views=SEED();seq=1;Hash.set(KEY,null,{push:false});build(0);}
    const h=Hash.get(KEY);build(Math.max(0,views.findIndex(v=>v.id===h)));if(h)touched(root);
    Hash.on(KEY,v=>{const i=views.findIndex(x=>x.id===v);TK8.select(i<0?0:i,{source:'hash'});});
    return {reset};
  };
