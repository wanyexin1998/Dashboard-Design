
  /* ---------- table demos ---------- */
  const regionRows=()=>{const c=q({},'region'),b=qBase({},'region'),tot=q({}).rev;return REG.map(r=>({id:r.id,name:r.name,rev:c.get(r.id).rev,ord:c.get(r.id).ord,base:b.get(r.id).rev,baseOrd:b.get(r.id).ord,share:c.get(r.id).rev/tot}));};
  const provRows=rid=>{const reg=q({regions:[rid]}).rev;return GEO[rid].map(p=>{const g=FD.geo(rid+'.'+p[0]);return {id:rid+'.'+p[0],name:p[1],region:rid,rev:g.rev,ord:g.ord,base:g.base,share:g.rev/reg,kids:!!p[4]};});};
  const colAmount=(id,label,extra={})=>({id,label,num:true,sum:true,sortable:true,type:'amount',value:r=>r[id],...extra});
  const colCount=(id,label,extra={})=>({id,label,num:true,sum:true,sortable:true,type:'count',value:r=>r[id],...extra});
  const colDelta=(id,label,cur,base,extra={})=>({id,label,num:true,sortable:true,type:'delta',value:r=>dlt(r[cur],r[base]),sortValue:r=>r[base]?r[cur]/r[base]-1:null,...extra});

  /* ---------- B01 · detail table with configurable row action (decision D5) and paging (D7) ---------- */
  ChartDemos.tbl_detail=(root,C)=>{
    const ACTIONS=[['inspect','只读'],['drill','下钻'],['select','勾选'],['filter','联动']];
    let gran='region',action='inspect',drillTo=null,T=null,linked=[],picked=[];
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('DETAIL','明细表',`<span class="ftt-lab">粒度</span>${seg('粒度',[['region','区域'],['day','区域 × 日']],'region','g-gran')}<span class="ftt-lab">行点击</span>${seg('行点击',ACTIONS,'inspect','g-act')}`)}
      <div class="tb-ctx" data-k="ctx"></div>
      <div data-k="tb"></div>
      <div class="ftt-panel" data-k="side" hidden><h4>LINKED<b>联动结果 · 渠道构成</b></h4><div class="fk-hbars" data-k="side-bars"></div></div>
      <p class="ftt-note" data-k="note"></p>`;
    const setGran=segWire(root.querySelector('.g-gran'),g=>{gran=g;drillTo=null;linked=[];picked=[];if(gran==='day'&&action==='drill'){action='inspect';setAct('inspect');}build();say(root,g==='day'?'粒度：区域 × 日，超过 50 行自动分页':'粒度：区域');});
    const setAct=segWire(root.querySelector('.g-act'),a=>{if(gran==='day'&&a==='drill'){setAct(action);say(root,'逐日明细没有下级，不能下钻');return;}action=a;drillTo=null;linked=[];picked=[];build();say(root,`行点击：${ACTIONS.find(x=>x[0]===a)[1]}`);});
    root.querySelector('.g-act [data-choice="drill"]').title='按区域粒度时可下钻到省份';
    const NOTES={inspect:'默认 <b>inspect</b>：只读，悬浮或 ↑ ↓ 聚焦任一行看读数浮层；整表只占一个 Tab 位。',drill:'<b>drill</b>：有下级的行尾带 ›，整行可点，Enter 也可；上方面包屑返回。',
      select:'<b>select</b>：首列复选框 + 表头全选（半选态），Space 勾选当前行；勾选只汇总，不改其他图。',filter:'<b>filter</b>：点行即把该区域写进联动条件（与 F09 同一机制），下方渠道构成随之重算。'};
    function rows(){if(gran==='day'){const E=AsOf.get(),out=[];for(let d=1;d<=E;d++)REG.forEach(r=>{const rev=FACT.regionDayRev[d-1][r.i]/10,ord=FACT.regionDayOrd[d-1][r.i];out.push({id:d+'-'+r.id,day:d,date:`9/${d} 周${WDN[wday(key(2026,9,d))]}`,name:r.name,region:r.id,rev,ord});});return out;}
      return drillTo?provRows(drillTo):regionRows();}
    function build(){
      const isDay=gran==='day',tot=q({}).rev;
      const cols=isDay?[{id:'date',label:'日期',rowHeader:true,value:r=>r.date,sortable:true,sortValue:r=>r.day*10+REG.findIndex(x=>x.id===r.region)},{id:'name',label:'区域',value:r=>r.name,cls:'mut'},colAmount('rev','营收（万元）'),colCount('ord','订单'),{id:'aov',label:'客单价（元）',num:true,sortable:true,type:'yuan',value:r=>aov(r.rev,r.ord)}]
        :[{id:'name',label:drillTo?'省份':'区域',rowHeader:true,value:r=>r.name},colAmount('rev','营收（万元）'),colCount('ord','订单'),{id:'aov',label:'客单价（元）',num:true,sortable:true,type:'yuan',value:r=>aov(r.rev,r.ord)},colDelta('mom','环比同期','rev','base'),{id:'share',label:drillTo?'占大区':'占比',type:'bar',value:r=>r.share}];
      T=TBK.create(qk(root,'tb'),{root,caption:isDay?'逐日 × 区域明细，可排序、分页':drillTo?`${regName(drillTo)}各省份明细`:'本月各区域明细',key:r=>r.id,rows:rows(),columns:cols,rowAction:action,sort:isDay?{by:'date',dir:null}:undefined,
        canDrill:r=>!drillTo&&!isDay,onDrill:r=>{drillTo=r.id;linked=[];build();T.el.tBodies[0].firstElementChild?.focus();say(root,`已下钻到 ${r.name}，共 ${T.rows().length} 个省份`);},
        onSelect:k=>{picked=k;ctx();},onFilter:k=>{linked=k;ctx();side();say(root,k.length?`已联动 ${k.map(regName).join('、')}`:'已清除联动');},
        total:(rs,val)=>({[cols[0].id]:isDay?`合计 ${rs.length} 行`:'合计',rev:W(sum(rs.map(r=>val({id:'rev'},r)))),ord:N(sum(rs.map(r=>val({id:'ord'},r)))),aov:nf(Math.round(aov(sum(rs.map(r=>r.rev)),sum(rs.map(r=>r.ord))))),...(isDay?{}:{mom:deltaHTML(dlt(sum(rs.map(r=>r.rev)),sum(rs.map(r=>r.base)))),share:'100.0%'})}),
        read:r=>isDay?{title:`${r.date} · ${r.name}`,rows:[['营收',text(r.rev,'amount')],['订单',N(r.ord)+' 单'],['客单价',nf(Math.round(aov(r.rev,r.ord)))+' 元']],foot:'逐日明细来自区域 × 日事实表'}
          :{title:`${r.name} · 本月`,rows:[['营收',text(r.rev,'amount')],['订单',N(r.ord)+' 单'],['环比同期',dlt(r.rev,r.base).text],[drillTo?'占大区':'占全部',P(r.share)]],foot:action==='drill'&&!drillTo?'Enter 或点击整行下钻到省份':drillTo?'省份值 = 大区营收 × 该省占比':'同期 = 8 月相同天数'},
        onRender:()=>{}});
      qk(root,'note').innerHTML=NOTES[action]+(isDay?` 行数 &gt; 50 自动分页（每页 20 行，D7）；行数 &gt; 20 且列数 ≥ 6 才开斑马纹。`:'');
      ctx();side();}
    function ctx(){const el=qk(root,'ctx');
      if(action==='drill')el.innerHTML=`<span class="crumb">${drillTo?`<button type="button" data-k="up">全部区域</button><span aria-hidden="true">›</span><b>${regName(drillTo)}</b>`:'<b>全部区域</b><span class="mut">· 点击有 › 的行下钻</span>'}</span>`;
      else if(action==='select'){const rs=T.rows().filter(r=>picked.includes(r.id));el.innerHTML=rs.length?`已选 <b>${rs.length}</b> 行 · 合计 <b>${W(sum(rs.map(r=>r.rev)))}</b> 万元 · <b>${N(sum(rs.map(r=>r.ord)))}</b> 单 <button type="button" class="fk-btn ghost" data-k="clr">清除</button>`:'<span class="mut">未勾选 · Space 勾选当前行，表头复选框全选</span>';}
      else if(action==='filter'){el.innerHTML='';FK.applied(el,{items:linked.map(id=>({id,dash:true,label:`区域 = <b>${regName(id)}</b> · 来自 明细表`,aria:`联动：区域 ${regName(id)}，来自明细表`})),onRemove:id=>{linked=linked.filter(x=>x!==id);T.setFilterOn(linked);ctx();side();},onClear:()=>{linked=[];T.setFilterOn([]);ctx();side();},empty:'点任一行联动下方渠道构成'});}
      else el.innerHTML=`<span class="mut">${gran==='day'?`9/1–${md(AsOf.key())} · ${AsOf.get()*6} 行`:`本月 9/1–${md(AsOf.key())} · 悬浮任一行看读数`}</span>`;
      el.querySelector('[data-k="up"]')?.addEventListener('click',()=>{const from=drillTo;drillTo=null;build();[...T.el.tBodies[0].rows].find(tr=>tr.dataset.key===from)?.focus();say(root,'已返回全部区域');});
      el.querySelector('[data-k="clr"]')?.addEventListener('click',()=>{picked=[];build();});}
    function side(){const box=qk(root,'side');box.hidden=action!=='filter';if(box.hidden)return;const c=q({regions:linked.length?linked:null},'channel');
      hbars(qk(root,'side-bars'),CH.map(x=>({id:x.id,name:x.name,v:c.get(x.id).rev})));}
    AsOf.on(()=>{build();});
    root.inspector={targets:[],lookup:el=>T.lookup(el),placeholder:'轻点任一行查看读数'};
    function reset(){gran='region';action='inspect';drillTo=null;linked=[];picked=[];setGran('region');setAct('inspect');build();}
    build();
    return {reset};
  };

  /* ---------- B03 · cross tab with a size threshold (FineBI's warning) ---------- */
  ChartDemos.tbl_cross=(root,C)=>{
    const LIMIT=60;let dim='channel',forced=false,T=null;
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('CROSS TAB','交叉表',`<span class="ftt-lab">列维度</span>${seg('列维度',[['channel','渠道'],['week','周'],['day','日']],'channel')}`)}
      <div class="tb-banner" data-k="banner" hidden></div>
      <div data-k="tb"></div>
      <p class="ftt-note">行合计写在「小计」列、列合计写在末行；<b>合计由显示值逐格相加</b>，读者自己加得出来。行 × 列超过 ${LIMIT} 格时先提示，再由读者决定是否展开。</p>`;
    const setDim=segWire(root.querySelector('.ftt-bar'),d=>{if(d==='day'&&!forced){showBanner(d);setDim(dim);return;}dim=d;build();say(root,`列维度：${{channel:'渠道',week:'周',day:'日'}[d]}`);});
    function colsFor(d){const E=AsOf.get();if(d==='channel')return CH.map(c=>({id:c.id,label:c.name,f:{channels:[c.id]}}));
      if(d==='week'){const w=[];for(let a=1;a<=E;a+=7){const b=Math.min(a+6,E);w.push({id:'w'+a,label:`${md(key(2026,9,a))}–${md(key(2026,9,b))}`+(b-a<6?'（未满）':''),f:{from:a,to:b}});}return w;}
      return Array.from({length:E},(_,i)=>({id:'d'+(i+1),label:`9/${i+1}`,f:{from:i+1,to:i+1}}));}
    function showBanner(d){const n=REG.length*colsFor(d).length,b=qk(root,'banner');b.hidden=false;
      b.innerHTML=`<span>行 × 列 = ${REG.length} × ${colsFor(d).length} = <b>${n}</b> 格，超过 ${LIMIT} 格的提示阈值：这个规模的交叉表已经不适合直读。</span><span class="fk-row"><button type="button" class="fk-btn" data-k="wk">改看周</button><button type="button" class="fk-btn" data-k="go">仍然展开</button></span>`;
      b.querySelector('[data-k="wk"]').addEventListener('click',()=>{b.hidden=true;dim='week';setDim('week');build();root.querySelector('.segmented [data-choice="week"]').focus();});
      b.querySelector('[data-k="go"]').addEventListener('click',()=>{b.hidden=true;forced=true;dim='day';setDim('day');build();say(root,'已展开 22 列，可横向滚动');});
      b.querySelector('button').focus();}
    function build(){qk(root,'banner').hidden=true;const C_=colsFor(dim);
      // display-first aggregation: cells rounded, subtotals and totals are sums of displayed cells
      const rows=REG.map(r=>{const o={id:r.id,name:r.name};C_.forEach(c=>{o[c.id]=Math.round(q({...c.f,regions:[r.id]}).rev*10)/10;});o.sub=Math.round(sum(C_.map(c=>o[c.id]))*10)/10;return o;});
      const cols=[{id:'name',label:'区域 / '+{channel:'渠道',week:'周',day:'日'}[dim],rowHeader:true,value:r=>r.name},...C_.map(c=>({id:c.id,label:c.label,num:true,type:'amount',value:r=>r[c.id]})),{id:'sub',label:'小计',num:true,type:'amount',sortable:true,value:r=>r.sub,cls:'subtot'}];
      T=TBK.create(qk(root,'tb'),{root,caption:`区域 × ${{channel:'渠道',week:'周',day:'日'}[dim]}营收交叉表（万元）`,key:r=>r.id,rows,columns:cols,
        total:rs=>{const o={name:'合计'};[...C_.map(c=>c.id),'sub'].forEach(id=>{o[id]=W(Math.round(sum(rs.map(r=>r[id]))*10)/10);});return o;},
        read:r=>({title:`${r.name} · 小计`,rows:[['小计',text(r.sub,'amount')],['占全部',P(r.sub/sum(rows.map(x=>x.sub)))]],foot:'悬浮单元格看交叉值'}),onRender:mark});
      mark();}
    function mark(){qk(root,'tb').querySelectorAll('tbody td.num').forEach(td=>td.dataset.metricTarget='true');}
    const tbHost=qk(root,'tb');
    tbHost.addEventListener('pointerover',e=>{const td=e.target.closest('td.num');tbHost.querySelectorAll('.xh,.xhit').forEach(x=>x.classList.remove('xh','xhit'));if(!td)return;
      const i=td.cellIndex;[...T.el.rows].forEach(tr=>{const c=tr.cells[i];if(c&&c!==td)c.classList.add('xh');});td.classList.add('xhit');});
    tbHost.addEventListener('pointerleave',()=>tbHost.querySelectorAll('.xh,.xhit').forEach(x=>x.classList.remove('xh','xhit')));
    AsOf.on(build);
    root.inspector={targets:[],lookup:el=>{if(el.tagName==='TD'&&el.closest('tbody')&&T.el.contains(el)){const tr=el.parentElement,r=T.rows().find(x=>x.id===tr.dataset.key),colId=T.el.tHead.rows[0].cells[el.cellIndex]?.id?.split('-').pop();
        const C_=colsFor(dim),c=C_.find(x=>x.id===colId)||{id:'sub',label:'小计'},v=r[c.id],colTot=sum(T.rows().map(x=>x[c.id]));
        return {el,read:()=>({title:`${r.name} × ${c.label}`,rows:[['营收',text(v,'amount')],['占本行',P(r.sub?v/r.sub:0)],['占本列',P(colTot?v/colTot:0)]],foot:'十字高亮所在行列；小计与合计由显示值相加'})};}
      return T.lookup(el);},placeholder:'悬浮任一格查看交叉值'};
    function reset(){dim='channel';forced=false;setDim('channel');build();}
    build();
    return {reset};
  };

  /* ---------- B05 · grouped rows with subtotals (one tbody per group, th scope=rowgroup) ---------- */
  // Hand-built tables (B05 / B06) follow TableKit's rule: the scroll box becomes a named, focusable region only while it overflows.
  function scrollRegion(wrap,capId){
    const fit=()=>{const s=wrap.scrollWidth>wrap.clientWidth+1;if(s){wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');wrap.setAttribute('aria-labelledby',capId);}
      else{wrap.removeAttribute('tabindex');wrap.removeAttribute('role');wrap.removeAttribute('aria-labelledby');}wrap.classList.toggle('scrolls',s);};
    new ResizeObserver(fit).observe(wrap);return fit;
  }
  ChartDemos.tbl_group=(root,C)=>{
    let open=new Set(['east','south']);
    const cap=nid('grp');
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('GROUPED','分组小计','<button type="button" class="fk-btn" data-k="all">全部展开</button><button type="button" class="fk-btn" data-k="none">全部收起</button>')}
      <div class="tb-wrap"><table class="tb" data-k="t"><caption id="${cap}" class="sr-only">区域 × 渠道分组表，组头含小计</caption><thead><tr><th scope="col">区域 / 渠道</th><th scope="col" class="num">营收（万元）</th><th scope="col" class="barcol">组内占比</th><th scope="col" class="num">占全部</th><th scope="col" class="num">订单</th></tr></thead></table></div>
      <p class="ftt-note">组头用 <code>th scope="rowgroup"</code>，小计写在组头行，<b>不用滚到组尾才看到</b>；折叠状态写在组头按钮的 <code>aria-expanded</code> 上。组内先比，组间再比。</p>`;
    const table=qk(root,'t'),fit=scrollRegion(table.parentElement,cap);let data=[];
    function render(){const tot=q({}),byR=q({},'region');data=REG.map(r=>{const c=q({regions:[r.id]},'channel'),members=CH.map(x=>({id:r.id+'-'+x.id,name:x.name,rev:c.get(x.id).rev,ord:c.get(x.id).ord})).sort((a,b)=>b.rev-a.rev);
        const rv=FD.apportion(members.map(m=>m.rev)),ov=FD.apportion(members.map(m=>m.ord),1);members.forEach((m,i)=>{m.rv=rv[i];m.ov=ov[i];});return {r,members,rev:sum(rv),ord:sum(ov)};});
      const grand=sum(data.map(g=>g.rev)),grandO=sum(data.map(g=>g.ord));
      table.querySelectorAll('tbody,tfoot').forEach(x=>x.remove());
      data.forEach(g=>{const tb=document.createElement('tbody'),gid=`${cap}-${g.r.id}`,isOpen=open.has(g.r.id);
        tb.innerHTML=`<tr class="grp" data-key="${g.r.id}"><th scope="rowgroup" id="${gid}"><button type="button" class="tb-exp" aria-expanded="${isOpen}" aria-controls="${g.members.map(m=>gid+'-'+m.id).join(' ')}" aria-label="${isOpen?'收起':'展开'} ${g.r.name}">▸</button>${g.r.name} <span class="sub" style="display:inline;margin-left:6px">${g.members.length} 个渠道 · 小计</span></th><td class="num">${W(g.rev)}</td><td class="barcol"></td><td class="num">${P(g.rev/grand)}</td><td class="num">${N(g.ord)}</td></tr>`+
          g.members.map(m=>`<tr class="member" id="${gid}-${m.id}" data-key="${m.id}" data-metric-target="true" tabindex="-1"${isOpen?'':' hidden'}><th scope="row">${m.name}</th><td class="num">${W(m.rv)}</td><td class="barcol"><span class="tb-bar"><i style="width:${(m.rv/g.rev*100).toFixed(1)}%"></i></span><span class="tb-barv">${P(m.rv/g.rev)}</span></td><td class="num mut">${P(m.rv/grand)}</td><td class="num">${N(m.ov)}</td></tr>`).join('');
        table.appendChild(tb);});
      const tf=document.createElement('tfoot');tf.innerHTML=`<tr><th scope="row">合计</th><td class="num">${W(grand)}</td><td class="barcol"></td><td class="num">100.0%</td><td class="num">${N(grandO)}</td></tr>`;table.appendChild(tf);
      table.querySelectorAll('.tb-exp').forEach(b=>{b.addEventListener('click',()=>toggle(b.closest('tr').dataset.key,b));b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();const k=b.closest('tr').dataset.key;if((e.key==='ArrowRight')!==open.has(k))toggle(k,b);}});});fit();}
    function toggle(k,btn){open.has(k)?open.delete(k):open.add(k);render();table.querySelector(`tr.grp[data-key="${k}"] .tb-exp`)?.focus();say(root,`${regName(k)} 已${open.has(k)?'展开':'收起'}`);}
    qk(root,'all').addEventListener('click',()=>{open=new Set(REG.map(r=>r.id));render();say(root,'已全部展开');});
    qk(root,'none').addEventListener('click',()=>{open.clear();render();say(root,'已全部收起');});
    AsOf.on(render);
    root.inspector={targets:[],lookup:el=>{if(!el.classList?.contains('member'))return null;const [rid]=el.dataset.key.split('-'),g=data.find(x=>x.r.id===rid),m=g.members.find(x=>x.id===el.dataset.key);
      return {el,read:()=>({title:`${g.r.name} · ${m.name}`,rows:[['营收',text(m.rv,'amount')],['组内占比',P(m.rv/g.rev)],['组小计',text(g.rev,'amount')],['订单',N(m.ov)+' 单']],foot:'组内先比（占小计），组间再比（占全部）'})};},placeholder:'悬浮任一渠道行查看组内占比'};
    function reset(){open=new Set(['east','south']);render();}
    render();
    return {reset};
  };

  /* ---------- B06 · expandable rows (separate expand button; the row itself does not drill) ---------- */
  ChartDemos.tbl_expand=(root,C)=>{
    let open=new Set(['east']);const cap=nid('exp');
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('EXPANDABLE','可展开行','展开按钮独立 · → 展开 ← 收起')}
      <div class="tb-wrap"><table class="tb" data-k="t"><caption id="${cap}" class="sr-only">区域可展开到省份</caption><thead><tr><th scope="col">区域 / 省份</th><th scope="col" class="num">营收（万元）</th><th scope="col" class="num">订单</th><th scope="col" class="num">环比同期</th><th scope="col" class="barcol">占比</th></tr></thead><tbody></tbody><tfoot></tfoot></table></div>
      <p class="ftt-note">展开按钮是行头里的独立按钮（<code>aria-expanded</code> + <code>aria-controls</code>），<b>不是整行可点</b>——整行可点会和「下钻」语义打架。子行插在父行之后，父行位置不动。</p>`;
    const table=qk(root,'t'),tbody=table.tBodies[0],fit=scrollRegion(table.parentElement,cap);let rows=[],kids=new Map();
    function render(focusKey=null){rows=regionRows();const tot=sum(rows.map(r=>r.rev)),mx=Math.max(...rows.map(r=>r.rev));kids=new Map(rows.map(r=>[r.id,provRows(r.id)]));
      const rv=FD.apportion(rows.map(r=>r.rev)),ov=FD.apportion(rows.map(r=>r.ord),1);rows.forEach((r,i)=>{r.rv=rv[i];r.ov=ov[i];});
      tbody.innerHTML=rows.map(r=>{const ks=kids.get(r.id),isOpen=open.has(r.id),pv=FD.apportion(ks.map(k=>k.rev)),po=FD.apportion(ks.map(k=>k.ord),1);
        return `<tr data-key="${r.id}" data-metric-target="true" tabindex="-1"><th scope="row"><button type="button" class="tb-exp" aria-expanded="${isOpen}" aria-controls="${ks.map(k=>cap+'-'+k.id.replace('.','-')).join(' ')}" aria-label="${isOpen?'收起':'展开'} ${r.name} 的 ${ks.length} 个省份">▸</button>${r.name}</th><td class="num">${W(r.rv)}</td><td class="num">${N(r.ov)}</td><td class="num">${deltaHTML(dlt(r.rev,r.base))}</td><td class="barcol"><span class="tb-bar"><i style="width:${(r.rev/mx*100).toFixed(1)}%"></i></span><span class="tb-barv">${P(r.rv/tot)}</span></td></tr>`
          +ks.map((k,i)=>`<tr class="child" id="${cap}-${k.id.replace('.','-')}" data-key="${k.id}" data-metric-target="true" tabindex="-1"${isOpen?'':' hidden'}><th scope="row">${k.name}</th><td class="num">${W(pv[i])}</td><td class="num">${N(po[i])}</td><td class="num">${deltaHTML(dlt(k.rev,k.base))}</td><td class="barcol"><span class="tb-barv mut">占${r.name} ${P(pv[i]/r.rv)}</span></td></tr>`).join('');}).join('');
      table.tFoot.innerHTML=`<tr><th scope="row">合计</th><td class="num">${W(sum(rows.map(r=>r.rv)))}</td><td class="num">${N(sum(rows.map(r=>r.ov)))}</td><td class="num">${deltaHTML(dlt(sum(rows.map(r=>r.rev)),sum(rows.map(r=>r.base))))}</td><td class="barcol"></td></tr>`;
      tbody.querySelectorAll('.tb-exp').forEach(b=>{const k=b.closest('tr').dataset.key;b.addEventListener('click',()=>toggle(k));
        b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&!open.has(k)||e.key==='ArrowLeft'&&open.has(k)){e.preventDefault();e.stopPropagation();toggle(k);}});});
      fit();if(focusKey)tbody.querySelector(`tr[data-key="${focusKey}"] .tb-exp`)?.focus();}
    function toggle(k){open.has(k)?open.delete(k):open.add(k);render(k);say(root,`${regName(k)} 已${open.has(k)?`展开 ${kids.get(k).length} 个省份`:'收起'}`);}
    AsOf.on(()=>render());
    root.inspector={targets:[],lookup:el=>{if(el.tagName!=='TR'||!tbody.contains(el))return null;const k=el.dataset.key,isKid=k.includes('.'),r=isKid?kids.get(k.split('.')[0]).find(x=>x.id===k):rows.find(x=>x.id===k);
      return r?{el,read:()=>({title:`${r.name} · 本月`,rows:[['营收',text(r.rev,'amount')],['订单',N(r.ord)+' 单'],['环比同期',dlt(r.rev,r.base).text]],foot:isKid?'省份值 = 大区营收 × 该省占比':'点行头的 ▸ 展开省份'})}:null;},placeholder:'点 ▸ 展开省份；悬浮任一行看读数'};
    function reset(){open=new Set(['east']);render();}
    render();
    return {reset};
  };

  /* ---------- B07 · comparison column groups: real colspan headers + headers/id (decision D6), five states ---------- */
  ChartDemos.tbl_compare=(root,C)=>{
    const ST=[['ok','正常'],['loading','加载中'],['empty','暂无数据'],['error','加载失败'],['stale','数据延迟']];let T=null;
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('COLUMN GROUPS','对比列组',`<span class="ftt-lab">状态</span>${seg('表格状态',ST,'ok')}`)}
      <div data-k="tb"></div>
      <p class="ftt-note">两行表头：列组 <code>th</code> 用 colspan + <code>scope="colgroup"</code>，并配 <code>&lt;colgroup span&gt;</code>；<b>每个数据格写 <code>headers="行 组 列"</code></b>，读屏不必推断（D6）。五种状态与 K01 同一套：同高切换、空态给出路、失败可重试。</p>`;
    const setSt=segWire(root.querySelector('.ftt-bar'),s=>{T.setState(s);if(s==='loading')setTimeout(()=>{if(T.host.querySelector('.tb-stack').dataset.state==='loading'){T.setState('ok');setSt('ok');}},1600);say(root,'表格状态：'+ST.find(x=>x[0]===s)[1]);});
    function build(){const rows=regionRows().map(r=>({...r,diff:r.rev-r.base}));
      T=TBK.create(qk(root,'tb'),{root,caption:`本期 9/1–${md(AsOf.key())} 与基期 8/1–8/${AsOf.get()} 对比`,key:r=>r.id,rows,
        groups:[{id:'cur',label:`本期 9/1–${md(AsOf.key())}`,cols:['rev','ord'],tone:'a'},{id:'base',label:`基期 8/1–8/${AsOf.get()}`,cols:['base','baseOrd'],tone:'b'},{id:'chg',label:'变化',cols:['diff','mom'],tone:'c'}],
        columns:[{id:'name',label:'区域',rowHeader:true,value:r=>r.name},colAmount('rev','营收'),colCount('ord','订单'),colAmount('base','营收',{cls:'mut'}),colCount('baseOrd','订单',{cls:'mut'}),
          {id:'diff',label:'差额（万元）',num:true,sortable:true,value:r=>r.diff,render:(r,v)=>(v>=0?'+':K.MINUS)+W(Math.abs(v))},colDelta('mom','环比','rev','base')],
        total:(rs,val)=>{const a=sum(rs.map(r=>val({id:'rev'},r))),b=sum(rs.map(r=>val({id:'base'},r)));return {name:'合计',rev:W(a),ord:N(sum(rs.map(r=>val({id:'ord'},r)))),base:W(b),baseOrd:N(sum(rs.map(r=>val({id:'baseOrd'},r)))),diff:(a-b>=0?'+':K.MINUS)+W(Math.abs(a-b)),mom:deltaHTML(dlt(a,b))};},
        read:r=>({title:`${r.name} · 本期 vs 基期`,rows:[['本期营收',text(r.rev,'amount')],['基期营收',text(r.base,'amount')],['差额',(r.diff>=0?'+':K.MINUS)+text(Math.abs(r.diff),'amount')],['环比',dlt(r.rev,r.base).text],['订单',`${N(r.ord)} vs ${N(r.baseOrd)}`]],foot:'差额与环比由两个列组派生，不单独给数据'}),
        emptyText:'该时段没有可对比的区域（示例）',onRetry:()=>setSt('ok')});
      T.setExits([{label:'恢复正常数据',run:()=>{T.setState('ok');setSt('ok');}}]);}
    AsOf.on(()=>{const s=T.host.querySelector('.tb-stack').dataset.state;build();T.setState(s);});
    root.inspector={targets:[],lookup:el=>T.lookup(el),placeholder:'悬浮任一行查看本期与基期'};
    function reset(){setSt('ok');build();}
    build();
    return {reset};
  };

  /* ---------- P05 · scorecard moved onto TableKit (three-state sort, look unchanged; decision D2) ---------- */
  ChartDemos.kpi_score=(root,C)=>{
    const {SC,MET}=KD,S=SC.month,M=S.cur,TM=DATA.target.month,SEV={bad:0,warn:1,good:2},{pace,band}=K;
    const YB=(b=>({...b,aov:b.rev*1e4/b.ord,refund:b.ref/b.ord}))(DATA.base.yoyM);
    const perDay=arr=>arr.map((v,i)=>v/MO.days[i]);
    const ROWS=[
      {id:'rev',cur:M.rev,target:TM.rev,ach:S.rate,trend:perDay(MO.rev),trendNote:'日均营收（未满月不吃亏）',status:()=>{const p=pace(S.rate,S.time);return {tone:p.tone==='warn'?'warn':'good',why:`达成 ${K.fmt(S.rate,'rate').num} vs 时间进度 ${K.fmt(S.time,'rate').num} → ${p.label}`};},tText:text(TM.rev,'amount',{short:true})},
      {id:'ord',cur:M.ord,target:TM.ord,ach:M.ord/TM.ord,trend:perDay(MO.ord),trendNote:'日均订单',status:()=>{const p=pace(M.ord/TM.ord,S.time);return {tone:p.tone==='warn'?'warn':'good',why:`达成 ${K.fmt(M.ord/TM.ord,'rate').num} vs 时间进度 ${K.fmt(S.time,'rate').num} → ${p.label}`};},tText:nf(TM.ord)},
      {id:'aov',cur:M.aov,target:TM.aov,ach:M.aov/TM.aov,trend:MO.rev.map((r,i)=>r*1e4/MO.ord[i]),trendNote:'月客单价',status:()=>{const r=M.aov/TM.aov;return {tone:r>=1?'good':r>=.95?'warn':'bad',why:`达成 ${K.fmt(r,'rate').num}：≥100% 正常 · 95–100% 关注 · <95% 异常`};},tText:nf(TM.aov)+' 元'},
      {id:'margin',cur:M.margin,target:TM.margin,ach:M.margin/TM.margin,trend:MO.margin,trendNote:'月毛利率',status:()=>{const r=M.margin/TM.margin;return {tone:r>=1?'good':r>=.95?'warn':'bad',why:`达成 ${K.fmt(r,'rate').num}：≥100% 正常 · 95–100% 关注 · <95% 异常`};},tText:'≥ '+K.fmt(TM.margin,'rate').num},
      {id:'refund',cur:M.refund,target:TM.refund,ach:TM.refund/M.refund,trend:MO.ref.map((r,i)=>r/MO.ord[i]),trendNote:'月退款率',status:()=>({tone:M.refund<=TM.refund?'good':M.refund<=TM.refund*1.2?'warn':'bad',why:`${K.fmt(M.refund,'rate',{d:2}).num} ≤ 上限 ${K.fmt(TM.refund,'rate').num}；减少为好，达成 = 上限 ÷ 实际`}),tText:'≤ '+K.fmt(TM.refund,'rate').num},
      {id:'ontime',cur:M.ontime,target:TM.ontime,ach:M.ontime/TM.ontime,trend:MO.ontime,trendNote:'月及时率',status:()=>({tone:band(M.ontime,[.95,TM.ontime],'up'),why:`原始值 ${nf(M.ontime*100,2)}%：≥98% 正常 · 95–98% 关注 · <95% 异常`}),tText:'≥ '+K.fmt(TM.ontime,'rate').num}
    ];
    ROWS.forEach(r=>{r.m=MET[r.id];r.st=r.status();r.d=change(r.cur,YB[r.id],r.m);});
    root.classList.add('kpi-host','kpi-wide');
    root.innerHTML=`<div class="kpi-bar"><span class="eyebrow">SCORECARD · 本月记分卡</span><div class="kpi-bar-end"><span class="kpi-period">${S.span} · 时间进度 ${K.fmt(S.time,'rate').num}</span></div></div><div data-k="tb"></div>`;
    const T=TBK.create(qk(root,'tb'),{root,caption:'本月记分卡，达成与状态列可排序（默认 → 降序 → 升序 → 默认）',key:r=>r.id,rows:ROWS,
      columns:[{id:'name',label:'指标',rowHeader:true,value:r=>r.m.name},
        {id:'cur',label:'本月',num:true,value:r=>r.cur,render:r=>text(r.cur,r.m.kind,{unit:r.m.unit,short:true})},
        {id:'target',label:'目标',num:true,value:r=>r.target,render:r=>r.tText},
        {id:'ach',label:'达成',num:true,sortable:true,value:r=>r.ach,render:r=>K.fmt(r.ach,'rate').num},
        {id:'yoy',label:'同比',num:true,value:r=>r.d,render:r=>deltaHTML(r.d)},
        {id:'trend',label:'1–9 月',value:r=>r.trend,render:r=>TBK.sparkSVG(r.trend,'var(--s-blue)',76,20,2.2)},
        {id:'status',label:'状态',sortable:true,value:r=>r.st.tone,render:r=>statusChip(r.st.tone),compare:(a,b,dir)=>{const v=(SEV[a.st.tone]-SEV[b.st.tone])||(a.ach-b.ach);return dir==='descending'?v:-v;}}],
      rowLabel:r=>`${r.m.name}，本月 ${text(r.cur,r.m.kind,{unit:r.m.unit})}，目标 ${r.tText}，达成 ${K.fmt(r.ach,'rate').num}，同比${r.d.dir} ${r.d.text.replace(K.MINUS,'')}，${K.STATUS[r.st.tone].label}`,
      read:r=>{const o={unit:r.m.unit,d:2};return {title:r.m.name+' · 本月',rows:[['本月',text(r.cur,r.m.kind,o)],['目标',r.tText],['达成',K.fmt(r.ach,'rate').num],['同比 '+YB.span,r.d.text+' · '+r.d.verdict],['状态',K.STATUS[r.st.tone].label,`var(--st-${r.st.tone})`]],foot:r.st.why+'。走势：'+r.trendNote+'，1–9 月。'};}});
    root.inspector={targets:[],lookup:T.lookup,placeholder:'轻点任一行查看判定依据'};
    function reset(){T.reset();}
    return {reset};
  };
  } catch (err) { try { const c=typeof console==='undefined'?null:console,f=c&&(c.error||c.log); if(typeof f==='function')f.call(c,'[筛选 / 页签 / 表格] 模块初始化失败',err); } catch (e) {} }
})();
