
  /* ---------- F07 · applied conditions (AND), with how much each one cuts ---------- */
  ChartDemos.flt_applied=(root,C)=>{
    const KEY='f07',ALL=['time','region','channel','link'];
    const CONDS={
      time:{label:()=>`时间：<b>近 7 天</b>`,aria:()=>'时间：近 7 天',f:()=>({from:Math.max(1,AsOf.get()-6)}),step:()=>`近 7 天 ${md(key(2026,9,Math.max(1,AsOf.get()-6)))}–${md(AsOf.key())}`},
      region:{label:()=>'区域：<b>华东 +2</b>',aria:()=>'区域：华东、华南、华北',f:()=>({regions:['east','south','north']}),step:()=>'区域 华东 / 华南 / 华北'},
      channel:{label:()=>'渠道：<b>电商</b>',aria:()=>'渠道：电商',f:()=>({channels:['online']}),step:()=>'渠道 电商'},
      link:{label:()=>'客群：<b>复购</b> · 来自图表联动',aria:()=>'客群：复购，来自图表联动',dash:true,f:()=>({segs:['repeat']}),step:()=>'客群 复购（联动）'}};
    let on=[...ALL];
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('APPLIED','已选条件回显','条件之间 AND · 虚线 = 来自图表联动')}
      <div class="ftt-row"><div data-k="chips"></div><span class="fk-anchor"><button type="button" class="fk-btn" data-k="add" data-focus-home aria-haspopup="dialog">＋ 添加条件</button>
        <div class="fk-pop" role="dialog" aria-label="添加条件" data-k="addpop" style="min-width:210px"><div data-k="addlist" class="fk-list"></div></div></span></div>
      <div class="ftt-row"><span class="fk-result" data-k="res"></span></div>
      <div class="ftt-panel"><h4>每个条件收窄了多少<b>按回显顺序依次叠加</b></h4><div class="fk-steps" data-k="steps"></div></div>
      <p class="ftt-note">每个 chip 的 ✕ 都是独立按钮，也可以聚焦后按 Delete；删掉一个，焦点落到下一个。<b>虚线 chip 来自图表点击</b>，和主动筛选分开标记，但同样按 AND 生效。</p>`;
    const addBtn=qk(root,'add'),addPop=FK.pop(addBtn,qk(root,'addpop'),{onOpen(){renderAdd();qk(root,'addlist').querySelector('button')?.focus();}});
    addBtn.addEventListener('click',()=>addPop.toggle());
    function renderAdd(){const off=ALL.filter(id=>!on.includes(id));qk(root,'addlist').innerHTML=off.length?off.map(id=>`<button type="button" class="fk-opt" data-id="${id}">${CONDS[id].label()}</button>`).join(''):'<div class="fk-empty-row">示例条件都已加上</div>';
      qk(root,'addlist').querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>{on=ALL.filter(id=>on.includes(id)||id===b.dataset.id);addPop.close(true);commit();}));}
    let cur=null;
    function render(){
      FK.applied(qk(root,'chips'),{items:on.map(id=>({id,label:CONDS[id].label(),aria:CONDS[id].aria(),dash:CONDS[id].dash})),onRemove:id=>{on=on.filter(x=>x!==id);commit();},onClear:()=>{on=[];commit();}});
      const all=q({});let f={},prev=all.rev;const steps=[{label:`全部 · 本月 9/1–${md(AsOf.key())}`,v:all.rev,keep:1}];
      on.forEach(id=>{f={...f,...CONDS[id].f()};const v=q(f).rev;steps.push({label:CONDS[id].step(),v,keep:prev?v/prev:0,dash:CONDS[id].dash});prev=v;});
      const fin=q(f);cur={steps,fin,all};
      qk(root,'steps').innerHTML=steps.map((s,i)=>`<div class="fk-step${s.dash?' dash':''}" data-i="${i}" data-metric-target="true" tabindex="-1"><span>${s.label}</span><span class="track"><i style="width:${(s.v/all.rev*100).toFixed(1)}%"></i></span><span class="v">${WU(s.v)}<small>${i?`保留 ${P(s.keep)}`:'基准'}</small></span></div>`).join('');
      qk(root,'res').innerHTML=`当前结果 <b>${W(fin.rev)}</b> 万元 · <b>${N(fin.ord)}</b> 单 · 占全部 <b>${P(fin.rev/all.rev)}</b>${on.length?` · ${on.length} 个条件`:' · 未设条件'}`;
      addBtn.disabled=on.length===ALL.length;addBtn.setAttribute('aria-label',addBtn.disabled?'示例条件都已加上':'添加条件');if(addBtn.disabled)addBtn.title='示例条件都已加上';else addBtn.removeAttribute('title');
      say(root,`${on.length} 个条件，结果 ${WU(fin.rev)}`);
    }
    function commit(){Hash.set(KEY,on.join(',')===ALL.join(',')?null:(on.join(',')||'none'));render();}
    AsOf.on(render);
    root.inspector={targets:[{el:qk(root,'res'),read:()=>({title:'当前结果',rows:[...cur.steps.slice(1).map(s=>[s.label,WU(s.v)]),['最终',text(cur.fin.rev,'amount')],['订单',N(cur.fin.ord)+' 单']],foot:'条件之间取交集（AND）；联动条件与筛选条件同样参与交集'})}],
      lookup:el=>{if(!el.classList.contains('fk-step'))return null;const s=cur.steps[+el.dataset.i];return s?{el,read:()=>({title:s.label,rows:[['剩余',text(s.v,'amount')],['占全部',P(s.v/cur.all.rev)],['相对上一步',+el.dataset.i?P(s.keep):'—']],foot:'依次叠加：每一行都在上一行的结果里再筛'})}:null;},placeholder:'轻点结果或任一行查看收窄过程'};
    function reset(){addPop.close(false);on=[...ALL];Hash.set(KEY,null,{push:false});render();}
    const dec=v=>v==='none'?[]:ALL.filter(id=>v.split(',').includes(id));
    const h=Hash.get(KEY);if(h!==undefined){on=dec(h);touched(root);}render();
    Hash.on(KEY,v=>{on=v===undefined?[...ALL]:dec(v);render();});
    return {reset};
  };

  /* ---------- F08 · filter drawer with batch apply (decision D2) ---------- */
  function range2(host,o){
    host.innerHTML=`<div class="fk-range"><span class="rail"></span><span class="fill"></span><span class="thumb" role="slider" tabindex="0" aria-label="${o.label}下限"></span><span class="thumb" role="slider" tabindex="0" aria-label="${o.label}上限"></span></div>`;
    const box=host.firstElementChild,[t0,t1]=[...box.querySelectorAll('.thumb')],fill=box.querySelector('.fill');let v=[...o.value],drag=null;
    const pct=x=>(x-o.min)/(o.max-o.min)*100,snap=x=>Math.round(x/o.step)*o.step;
    function paint(){[t0,t1].forEach((t,i)=>{t.style.left=pct(v[i])+'%';t.setAttribute('aria-valuemin',String(i?v[0]:o.min));t.setAttribute('aria-valuemax',String(i?o.max:v[1]));t.setAttribute('aria-valuenow',String(v[i]));t.setAttribute('aria-valuetext',o.fmt(v[i]));});
      fill.style.left=pct(v[0])+'%';fill.style.width=(pct(v[1])-pct(v[0]))+'%';}
    function set(i,x){x=Math.max(i?v[0]:o.min,Math.min(i?o.max:v[1],snap(x)));if(x===v[i])return;v[i]=x;paint();o.onChange([...v]);}
    [t0,t1].forEach((t,i)=>t.addEventListener('keydown',e=>{const s=o.step,map={ArrowLeft:-s,ArrowDown:-s,ArrowRight:s,ArrowUp:s,PageDown:-s*5,PageUp:s*5};
      if(e.key in map){e.preventDefault();e.stopPropagation();set(i,v[i]+map[e.key]);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();e.stopPropagation();set(i,e.key==='Home'?(i?v[0]:o.min):(i?o.max:v[1]));}}));
    const at=e=>{const r=box.getBoundingClientRect();return o.min+Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*(o.max-o.min);};
    box.addEventListener('pointerdown',e=>{const x=at(e);drag=Math.abs(x-v[0])<=Math.abs(x-v[1])?(x>v[1]?1:0):1;if(v[0]===v[1])drag=x<v[0]?0:1;const t=drag?t1:t0;t.classList.add('drag');t.focus();try{box.setPointerCapture(e.pointerId);}catch(_){}set(drag,x);e.preventDefault();});
    box.addEventListener('pointermove',e=>{if(drag!==null)set(drag,at(e));});
    const end=()=>{if(drag!==null){[t0,t1][drag].classList.remove('drag');drag=null;}};box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
    paint();return {get:()=>[...v],set(x){v=[...x];paint();}};
  }
  ChartDemos.flt_drawer=(root,C)=>{
    const KEY='f08',MAXV=210,DEF={regions:[],range:[0,MAXV],growth:'all'},INIT={regions:['east','south','north'],range:[50,MAXV],growth:'up'};   // opens on an example
    const PROVS=REG.flatMap(r=>GEO[r.id].map(p=>({path:r.id+'.'+p[0],name:p[1],region:r.id})));
    let st=JSON.parse(JSON.stringify(INIT)),draft=null;
    const dlg=nid('dlg');
    root.classList.add('ftt-host');root.style.position='relative';
    root.innerHTML=`${bar('PANEL','筛选抽屉','抽屉内批量应用 · 其余控件即时生效')}
      <div class="ftt-row"><button type="button" class="fk-btn" data-k="open" aria-haspopup="dialog" aria-controls="${dlg}" aria-expanded="false" data-focus-home>筛选<span data-k="n"></span></button><div data-k="chips"></div></div>
      <div class="ftt-row"><span class="fk-result" data-k="res"></span></div>
      <div data-k="table"></div>
      <div class="fk-drawer-wrap" data-k="wrap" hidden><div class="fk-scrim" data-k="scrim"></div>
        <div class="fk-drawer" role="dialog" aria-modal="true" aria-labelledby="${dlg}-h" id="${dlg}">
          <div class="fk-drawer-h"><h3 id="${dlg}-h">筛选省份</h3><button type="button" class="fk-btn ghost" data-k="x" aria-label="关闭，不应用改动">✕</button></div>
          <div class="fk-drawer-b"><div class="fk-group"><div class="t"><span>大区</span></div><div data-k="d-reg"></div></div>
            <div class="fk-group"><div class="t"><span>营收区间（本月）</span><b data-k="d-rng-t"></b></div><div data-k="d-rng"></div></div>
            <div class="fk-group"><div class="t"><span>环比同期</span></div><div data-k="d-gr"></div></div></div>
          <div class="fk-drawer-f"><span data-k="pending"></span><span class="fk-row"><button type="button" class="fk-btn" data-k="reset">重置</button><button type="button" class="fk-btn primary" data-k="apply">应用</button></span></div></div></div>
      <p class="ftt-note">筛选项超过一屏时收进抽屉：<b>抽屉里的改动先记为「未应用」</b>，点「应用」一次提交；关闭或 Esc 放弃改动并回到「筛选」按钮。</p>`;
    const wrap=qk(root,'wrap'),openBtn=qk(root,'open'),drawer=wrap.querySelector('.fk-drawer');
    const dReg=FK.chips(qk(root,'d-reg'),{items:[{id:'all',label:'全部'},...REG.map(r=>({id:r.id,label:r.name}))],mode:'multi',value:[],label:'大区',onChange:v=>{draft.regions=REG.map(r=>r.id).filter(id=>v.includes(id));paintDraft();}});   // REG order, so comparisons and the address ignore click order
    const dRng=range2(qk(root,'d-rng'),{min:0,max:MAXV,step:5,value:[0,MAXV],label:'营收',fmt:x=>x+' 万元',onChange:v=>{draft.range=v;paintDraft();}});
    const dGr=FK.chips(qk(root,'d-gr'),{items:[{id:'all',label:'全部'},{id:'up',label:'增长'},{id:'down',label:'下降'}],mode:'single',value:'all',label:'环比同期',onChange:v=>{draft.growth=v;paintDraft();}});
    const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    const diffs=(a,b)=>['regions','range','growth'].filter(k=>!same(a[k],b[k])).length;
    const active=s=>diffs(s,DEF);
    function paintDraft(){const n=diffs(draft,st);qk(root,'pending').innerHTML=n?`<span class="pending">改动 ${n} 项未应用</span>`:'没有未应用的改动';
      const ap=qk(root,'apply');ap.textContent=n?`应用（${n}）`:'应用';ap.disabled=!n;qk(root,'d-rng-t').textContent=`${draft.range[0]} – ${draft.range[1]} 万元`;}
    function open(){draft=JSON.parse(JSON.stringify(st));dReg.set(draft.regions);dRng.set(draft.range);dGr.set(draft.growth);paintDraft();wrap.hidden=false;openBtn.setAttribute('aria-expanded','true');opener=document.activeElement;
      // Keep the whole drawer (incl. 应用 / 重置 at the bottom) on screen; focus without a second scroll jump.
      requestAnimationFrame(()=>{drawer.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'});drawer.querySelector('.fk-chip')?.focus({preventScroll:true});});touched(root);}
    function close(apply){if(apply){st=draft;commit();}wrap.hidden=true;openBtn.setAttribute('aria-expanded','false');openBtn.focus();}
    openBtn.addEventListener('click',open);qk(root,'x').addEventListener('click',()=>close(false));qk(root,'scrim').addEventListener('click',()=>close(false));
    qk(root,'apply').addEventListener('click',()=>close(true));
    qk(root,'reset').addEventListener('click',()=>{draft=JSON.parse(JSON.stringify(DEF));dReg.set([]);dRng.set(DEF.range);dGr.set('all');paintDraft();});
    drawer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(false);return;}
      if(e.key!=='Tab')return;const f=[...drawer.querySelectorAll(FOCUSABLE)].filter(x=>!x.disabled&&x.offsetParent!==null&&x.tabIndex>=0);if(!f.length)return;const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}});
    root.addEventListener('metric-hide',()=>{if(!wrap.hidden)close(false);});
    const rowsFor=s=>PROVS.map(p=>{const g=FD.geo(p.path);return {...p,rev:g.rev,base:g.base};}).filter(p=>(!s.regions.length||s.regions.includes(p.region))&&p.rev>=s.range[0]&&p.rev<=s.range[1]&&(s.growth==='all'||(s.growth==='up'?p.rev>=p.base:p.rev<p.base)));
    const T=TBK.create(qk(root,'table'),{root,caption:'符合条件的省份，营收与环比可排序',key:r=>r.path,rows:[],sort:{by:'rev',dir:'descending'},
      columns:[{id:'name',label:'省份',rowHeader:true,value:r=>r.name},{id:'region',label:'大区',value:r=>regName(r.region),cls:'mut'},
        {id:'rev',label:'营收（万元）',num:true,sum:true,sortable:true,value:r=>r.rev,type:'amount'},
        {id:'mom',label:'环比同期',num:true,sortable:true,value:r=>dlt(r.rev,r.base),sortValue:r=>r.rev/r.base-1,type:'delta'},
        {id:'share',label:'占全部',type:'bar',value:r=>r.rev/q({}).rev,max:rows=>Math.max(...rows.map(r=>r.rev/q({}).rev))}],
      total:(rows,val)=>rows.length?{name:`合计 ${rows.length} 个`,rev:W(sum(rows.map(r=>val({id:'rev',value:x=>x.rev,sum:true},r)))),mom:deltaHTML(dlt(sum(rows.map(r=>r.rev)),sum(rows.map(r=>r.base)))),share:P(sum(rows.map(r=>r.rev))/q({}).rev)}:null,
      read:r=>({title:`${r.name} · ${regName(r.region)}`,rows:[['营收',text(r.rev,'amount')],['环比同期',text(r.base,'amount')],['变化',dlt(r.rev,r.base).text],['占全部',P(r.rev/q({}).rev)]],foot:'省份值 = 大区营收 × 该省占比（月度事实）'}),
      emptyText:'没有符合条件的省份'});
    function render(){
      const rows=rowsFor(st),n=active(st),tot=q({}).rev,sumRev=sum(rows.map(r=>r.rev));
      qk(root,'n').textContent=n?` · ${n}`:'';openBtn.setAttribute('aria-label',n?`筛选，已应用 ${n} 项`:'筛选');
      const items=[];if(st.regions.length)items.push({id:'regions',label:`大区：<b>${st.regions.length===1?regName(st.regions[0]):regName(st.regions[0])+' +'+(st.regions.length-1)}</b>`,aria:'大区：'+st.regions.map(regName).join('、')});
      if(!same(st.range,DEF.range))items.push({id:'range',label:`营收：<b>${st.range[0]}–${st.range[1]} 万</b>`,aria:`营收 ${st.range[0]} 到 ${st.range[1]} 万元`});
      if(st.growth!=='all')items.push({id:'growth',label:`环比：<b>${st.growth==='up'?'增长':'下降'}</b>`,aria:'环比'+(st.growth==='up'?'增长':'下降')});
      FK.applied(qk(root,'chips'),{items,onRemove:id=>{st[id]=JSON.parse(JSON.stringify(DEF[id]));commit();},onClear:()=>{st=JSON.parse(JSON.stringify(DEF));commit();},empty:`未设条件 · 全部 ${PROVS.length} 个省份`});
      qk(root,'res').innerHTML=rows.length?`符合 <b>${rows.length}</b> / ${PROVS.length} 个省份 · <b>${W(sumRev)}</b> 万元 · 占全部 <b>${P(sumRev/tot)}</b>`:`<span class="st-bad">没有符合条件的省份</span>`;
      qk(root,'res').classList.toggle('is-empty',!rows.length);
      T.update(rows,{animate:false});
      T.setExits([...(st.range[0]>0||st.range[1]<MAXV?[{label:'营收区间放宽到全部',run:()=>{st.range=[0,MAXV];commit();}}]:[]),...(st.regions.length?[{label:'移除「大区」',run:()=>{st.regions=[];commit();}}]:[]),{label:'清空全部',run:()=>{st=JSON.parse(JSON.stringify(DEF));commit();}}]);
      say(root,rows.length?`符合 ${rows.length} 个省份，营收 ${WU(sumRev)}`:'没有符合条件的省份');
    }
    const enc=s=>same(s,INIT)?null:`r=${s.regions.join(',')};v=${s.range.join('-')};g=${s.growth}`;
    const dec=v=>{const m=/^r=([\w,]*);v=(\d+)-(\d+);g=(all|up|down)$/.exec(v||'');return m?{regions:m[1]?m[1].split(',').filter(id=>REG.some(r=>r.id===id)):[],range:[+m[2],+m[3]],growth:m[4]}:null;};
    function commit(){Hash.set(KEY,enc(st));render();}
    AsOf.on(render);
    root.inspector={targets:[],lookup:T.lookup,placeholder:'轻点任一行查看省份读数'};
    function reset(){wrap.hidden=true;openBtn.setAttribute('aria-expanded','false');st=JSON.parse(JSON.stringify(INIT));Hash.set(KEY,null,{push:false});T.reset();render();}
    const h=dec(Hash.get(KEY));if(h){st=h;touched(root);}render();
    Hash.on(KEY,v=>{st=dec(v)||JSON.parse(JSON.stringify(INIT));render();});
    return {reset};
  };

  /* ---------- F09 · cross-filter board: single click = select + filter, board-level switch (D4 / D9) ---------- */
  ChartDemos.flt_link=(root,C)=>{
    const KEY='f09',RANGES=[['month','本月'],['d14','近 14 天'],['d7','近 7 天']],DEF={range:'month',regions:[],lr:null,lc:null,on:true};
    let st={...DEF};
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('CROSS-FILTER','图表联动',`<button type="button" class="fk-switch" data-k="sw" aria-label="图表联动"><i aria-hidden="true"></i>联动<span class="st" data-k="swt"></span></button>`)}
      <div class="ftt-row"><div data-k="range"></div><span data-k="ms"></span></div>
      <div class="ftt-row"><div data-k="chips"></div></div>
      <div class="ftt-row"><span class="fk-result" data-k="res"></span></div>
      <div class="ftt-grid3">
        <div class="ftt-panel"><h4>REGION<b>区域营收</b></h4><div class="fk-hbars" data-k="a" role="group" aria-label="区域营收，点击联动"></div></div>
        <div class="ftt-panel"><h4>CHANNEL<b>渠道构成</b></h4><div class="fk-hbars" data-k="b" role="group" aria-label="渠道构成，点击联动"></div></div>
        <div class="ftt-panel"><h4>DAILY<b>逐日营收</b></h4><div class="fk-cols pair" data-k="c" style="height:96px" aria-hidden="true"></div><div class="fk-legend"><span><i class="fk-dot" style="background:var(--s-blue);border-radius:2px"></i>当前条件</span><span><i class="fk-dot" style="background:var(--c-dim);border-radius:2px"></i>全部</span></div></div></div>
      <p class="ftt-hint" data-k="hint"></p>
      <p class="ftt-note">来源图不被自己的联动条件过滤（避免 A→B→A 回环），只高亮被点的一项；其余图按「筛选 ∩ 联动」重算。联动条件以<b>虚线 chip</b> 出现在回显条里，✕、再点同一项或 Esc 都能撤销。</p>`;
    const sw=FK.toggle(qk(root,'sw'),{checked:true,onChange:v=>{st.on=v;if(!v){st.lr=null;st.lc=null;}sel={r:null,c:null};commit();say(root,v?'已开启图表联动':'已关闭图表联动，单击只选中');}});
    const rc=FK.chips(qk(root,'range'),{items:RANGES.map(([id,label])=>({id,label})),mode:'single',value:'month',label:'时间',onChange:v=>{st.range=v;commit();}});
    const ms=FK.multi(qk(root,'ms'),{label:'区域',value:[],options:REG.map(r=>({id:r.id,name:r.name,meta:()=>WU(q({...span_(),regions:[r.id]}).rev)})),onChange:v=>{st.regions=REG.filter(r=>v.includes(r.id)).map(r=>r.id);if(st.lr&&st.regions.length&&!st.regions.includes(st.lr)){st.lr=null;say(root,'联动的区域已被筛掉，联动条件随之清除');}commit();}});
    let sel={r:null,c:null};   // highlight-only selection when the switch is off
    const span_=()=>{const e=AsOf.get(),n={month:e,d14:14,d7:7}[st.range];return {from:Math.max(1,e-n+1),to:e};};
    function onBar(kind,id){touched(root);if(st.on){if(kind==='r')st.lr=st.lr===id?null:id;else st.lc=st.lc===id?null:id;commit();
        const on=kind==='r'?st.lr:st.lc;say(root,on?`已按 ${kind==='r'?'区域':'渠道'} = ${kind==='r'?regName(id):chName(id)} 联动其余图表`:'已取消联动');}
      else{sel[kind]=sel[kind]===id?null:id;render();}}
    qk(root,'a').addEventListener('click',e=>{const b=e.target.closest('.fk-hbar');if(b)onBar('r',b.dataset.id);});
    qk(root,'b').addEventListener('click',e=>{const b=e.target.closest('.fk-hbar');if(b)onBar('c',b.dataset.id);});
    root.addEventListener('keydown',e=>{if(e.key==='Escape'&&(st.lr||st.lc||sel.r||sel.c)&&!FK.current()){st.lr=null;st.lc=null;sel={r:null,c:null};commit();say(root,'已清除联动');}});
    [qk(root,'a'),qk(root,'b')].forEach(g=>g.addEventListener('keydown',e=>{const bs=[...g.querySelectorAll('.fk-hbar')],i=bs.indexOf(document.activeElement);if(i<0)return;
      const d={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(d===undefined&&e.key!=='Home'&&e.key!=='End')return;e.preventDefault();e.stopPropagation();const j=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+d+bs.length)%bs.length;bs[j].focus();}));
    let cur=null;
    function render(){
      const sp=span_(),fReg=st.regions.length?st.regions:null,lr=st.on?st.lr:null,lc=st.on?st.lc:null;
      const A=q({...sp,regions:fReg,channels:lc?[lc]:null},'region'),B=q({...sp,regions:lr?[lr]:fReg,channels:null},'channel');
      const all=q({...sp}),res=q({...sp,regions:lr?[lr]:fReg,channels:lc?[lc]:null}),daysAll=q({...sp},'day'),daysF=q({...sp,regions:lr?[lr]:fReg,channels:lc?[lc]:null},'day');
      cur={sp,A,B,res,all,lr,lc};
      const hr=st.on?st.lr:sel.r,hc=st.on?st.lc:sel.c;
      const aItems=REG.filter(r=>!fReg||fReg.includes(r.id)).map(r=>({id:r.id,name:r.name,v:A.get(r.id)?.rev||0,on:hr===r.id,dim:!!hr&&hr!==r.id})).sort((x,y)=>y.v-x.v);
      const aEls=hbars(qk(root,'a'),aItems,{button:true,target:true,rove:true,label:it=>`${it.name} ${WU(it.v)}${it.on?'，已选中':''}，${st.on?'点击联动':'点击选中'}`});
      const bEls=hbars(qk(root,'b'),CH.map(c=>({id:c.id,name:c.name,v:B.get(c.id)?.rev||0,on:hc===c.id,dim:!!hc&&hc!==c.id})),{button:true,target:true,rove:true,label:it=>`${it.name} ${WU(it.v)}${it.on?'，已选中':''}，${st.on?'点击联动':'点击选中'}`});
      const dmax=Math.max(...[...daysAll.values()].map(v=>v.rev));
      cols(qk(root,'c'),Array.from({length:sp.to-sp.from+1},(_,i)=>{const d=sp.from+i;return {pair:[{v:daysAll.get(d)?.rev||0,cls:'base'},{v:daysF.get(d)?.rev||0}]};}),{max:dmax});
      const items=[];if(st.regions.length)items.push({id:'regions',label:`区域：<b>${st.regions.length===1?regName(st.regions[0]):regName(st.regions[0])+' +'+(st.regions.length-1)}</b>`,aria:'区域：'+st.regions.map(regName).join('、')});
      if(lr)items.push({id:'lr',dash:true,label:`区域 = <b>${regName(lr)}</b> · 来自 区域营收`,aria:`联动：区域 ${regName(lr)}，来自区域营收`});
      if(lc)items.push({id:'lc',dash:true,label:`渠道 = <b>${chName(lc)}</b> · 来自 渠道构成`,aria:`联动：渠道 ${chName(lc)}，来自渠道构成`});
      FK.applied(qk(root,'chips'),{items,onRemove:id=>{if(id==='regions'){st.regions=[];ms.set([]);}else st[id]=null;commit();},onClear:()=>{st.regions=[];ms.set([]);st.lr=null;st.lc=null;commit();},empty:'未设条件 · 点击任一图形即可联动'});
      qk(root,'res').innerHTML=`${RANGES.find(r=>r[0]===st.range)[1]} ${md(key(2026,9,sp.from))}–${md(key(2026,9,sp.to))} · 当前 <b>${W(res.rev)}</b> 万元 · <b>${N(res.ord)}</b> 单 · 占全部 <b>${P(res.rev/all.rev)}</b>`;
      qk(root,'swt').textContent=st.on?'开':'关';
      qk(root,'hint').innerHTML=st.on?'<b>联动开</b> · 单击条形即筛选其余两图，再点同一项或按 Esc 取消':'<b>联动关</b> · 单击只高亮被点项，其余两图不变';
      rc.set(st.range);ms.refresh();
    }
    const enc=s=>{const p=[];if(s.range!=='month')p.push('t='+s.range);if(s.regions.length)p.push('g='+s.regions.join(','));if(s.lr)p.push('lr='+s.lr);if(s.lc)p.push('lc='+s.lc);if(!s.on)p.push('x=0');return p.join(';')||null;};
    const dec=v=>{if(!v)return null;const o={...DEF,regions:[]};v.split(';').forEach(kv=>{const [k,x]=kv.split('=');if(k==='t'&&RANGES.some(r=>r[0]===x))o.range=x;if(k==='g')o.regions=x.split(',').filter(id=>REG.some(r=>r.id===id));if(k==='lr'&&REG.some(r=>r.id===x))o.lr=x;if(k==='lc'&&CH.some(c=>c.id===x))o.lc=x;if(k==='x')o.on=x!=='0';});return o;};
    function commit(){Hash.set(KEY,enc(st));render();}
    AsOf.on(render);
    const readBar=(kind,id)=>{const m=kind==='r'?cur.A:cur.B,v=m.get(id)||{rev:0,ord:0},tot=[...m.values()].reduce((s,x)=>s+x.rev,0);
      return {title:`${kind==='r'?regName(id):chName(id)} · ${kind==='r'?'区域营收':'渠道构成'}`,rows:[['营收',text(v.rev,'amount')],['订单',N(v.ord)+' 单'],['占本图',P(tot?v.rev/tot:0)]],foot:kind==='r'?(cur.lc?`已按渠道 = ${chName(cur.lc)} 过滤；本图不受自己的联动影响`:'本图不受自己的联动影响'):(cur.lr?`已按区域 = ${regName(cur.lr)} 过滤；本图不受自己的联动影响`:'本图不受自己的联动影响')};};
    root.inspector={targets:[{el:qk(root,'res'),read:()=>({title:'当前结果',rows:[['时间',`${md(key(2026,9,cur.sp.from))}–${md(key(2026,9,cur.sp.to))}`],['筛选区域',st.regions.length?st.regions.map(regName).join('、'):'全部'],['联动',[cur.lr&&'区域 '+regName(cur.lr),cur.lc&&'渠道 '+chName(cur.lc)].filter(Boolean).join(' ∩ ')||'无'],['营收',text(cur.res.rev,'amount')]],foot:'筛选与联动取交集（AND），不互相覆盖'})}],
      lookup:el=>{if(!el.classList.contains('fk-hbar'))return null;const kind=el.parentElement===qk(root,'a')?'r':'c';return {el,read:()=>readBar(kind,el.dataset.id)};},placeholder:'轻点任一条形查看读数；再点一次取消联动'};
    function reset(){ms.pop.close(false);st={...DEF,regions:[]};sel={r:null,c:null};sw.set(true);ms.set([]);Hash.set(KEY,null,{push:false});render();}
    const h=dec(Hash.get(KEY));if(h){st=h;sw.set(st.on);ms.set(st.regions);touched(root);}render();
    Hash.on(KEY,v=>{st=dec(v)||{...DEF,regions:[]};sw.set(st.on);ms.set(st.regions);render();});
    return {reset};
  };

  /* ---------- F10 · result bar and empty-state exits ---------- */
  ChartDemos.flt_result=(root,C)=>{
    const KEY='f10',DEF={region:'all',t:60};let st={...DEF};
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('RESULT','结果条与空态','空结果给出路，不给空白')}
      <div class="ftt-row"><span class="ftt-lab">区域</span><div data-k="reg"></div></div>
      <div class="ftt-row"><label class="ftt-lab" for="${root.id}-t">单日营收 ≥</label><input type="range" id="${root.id}-t" min="0" max="80" step="5" data-k="t" style="flex:1;max-width:260px;accent-color:var(--s-blue)"><b class="ftt-span" data-k="tv" style="min-width:52px"></b></div>
      <div class="ftt-row"><span class="fk-result" data-k="res"></span></div>
      <div data-k="ok"><div class="fk-strip" data-k="strip"></div><div class="fk-legend"><span><i class="fk-dot" style="background:var(--s-blue);border-radius:2px"></i>符合条件</span><span><i class="fk-dot" style="background:var(--c-track);border-radius:2px"></i>不符合</span><span><i class="fk-dot none" style="border-radius:2px"></i>截至日之后</span></div></div>
      <div class="ftt-empty" data-k="empty" hidden><div class="big">没有符合条件的日子</div><div class="sub" data-k="why"></div><div class="ftt-row" data-k="exits"></div></div>
      <p class="ftt-note">结果条常驻：既是反馈，也是「是不是筛过头了」的自检。空结果时<b>说原因 + 给三条可点的出路</b>，按钮直接改写条件，不用一个个回去删。</p>`;
    const rg=FK.chips(qk(root,'reg'),{items:[{id:'all',label:'全部'},...REG.map(r=>({id:r.id,label:r.name}))],mode:'single',value:'all',label:'区域',onChange:v=>{st.region=v;commit();}});
    const tIn=qk(root,'t');tIn.addEventListener('input',()=>{st.t=+tIn.value;commit(true);});tIn.addEventListener('keydown',e=>e.stopPropagation());
    const strip=qk(root,'strip');strip.innerHTML=Array.from({length:22},(_,i)=>`<span data-d="${i+1}">${i+1}</span>`).join('');
    const cells=[...strip.children];
    const dayRev=d=>st.region==='all'?DY.rev[d-1]:FACT.regionDayRev[d-1][FD.regById(st.region).i]/10;
    let cur=null;
    function render(){
      const E=AsOf.get(),days=Array.from({length:E},(_,i)=>i+1),hit=days.filter(d=>dayRev(d)>=st.t),rev=sum(hit.map(dayRev)),tot=sum(days.map(dayRev));cur={hit,rev,tot,E};
      tIn.value=String(st.t);tIn.setAttribute('aria-valuetext',`${st.t} 万元`);qk(root,'tv').textContent=st.t+' 万';rg.set(st.region);
      cells.forEach((c,i)=>{const d=i+1;c.className=d>E?'na':hit.includes(d)?'hit':'';c.setAttribute('aria-label',d>E?`9 月 ${d} 日，截至日之后`:`9 月 ${d} 日 ${WU(dayRev(d))}${hit.includes(d)?'，符合':''}`);});
      const empty=!hit.length;qk(root,'ok').hidden=empty;qk(root,'empty').hidden=!empty;
      qk(root,'res').classList.toggle('is-empty',empty);
      qk(root,'res').innerHTML=empty?`符合 <b>0</b> / ${E} 天 · 区域 ${st.region==='all'?'全部':regName(st.region)} · 单日 ≥ ${st.t} 万`:`符合 <b>${hit.length}</b> / ${E} 天 · 合计 <b>${W(rev)}</b> 万元 · 占区间 <b>${P(rev/tot)}</b>`;
      if(empty){const mx=Math.max(...days.map(dayRev)),relax=Math.floor(mx/5)*5,nRelax=days.filter(d=>dayRev(d)>=relax).length,allN=days.filter(d=>DY.rev[d-1]>=st.t).length;
        qk(root,'why').textContent=`${st.region==='all'?'全部区域':regName(st.region)}在 9/1–${md(AsOf.key())} 的单日营收最高 ${W(mx)} 万，低于阈值 ${st.t} 万。`;
        const ex=[{l:`阈值放宽到 ${relax} 万（${nRelax} 天）`,run:()=>{st.t=relax;commit();}}];
        if(st.region!=='all'&&allN)ex.push({l:`移除「区域」（${allN} 天）`,run:()=>{st.region='all';commit();}});
        ex.push({l:'清空全部',run:()=>{st={...DEF};commit();}});
        qk(root,'exits').innerHTML=ex.map((x,i)=>`<button type="button" class="fk-btn" data-i="${i}">${x.l}</button>`).join('');
        qk(root,'exits').querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>{ex[+b.dataset.i].run();requestAnimationFrame(()=>tIn.focus());}));}
    }
    let sayT=0;
    function commit(quiet){Hash.set(KEY,st.region===DEF.region&&st.t===DEF.t?null:`${st.region}~${st.t}`);render();clearTimeout(sayT);sayT=setTimeout(()=>say(root,cur.hit.length?`符合 ${cur.hit.length} 天，合计 ${WU(cur.rev)}`:'没有符合条件的日子，已给出三条出路'),quiet?500:0);}
    AsOf.on(render);
    root.inspector={targets:[{el:qk(root,'res'),read:()=>({title:'结果条',rows:[['符合天数',`${cur.hit.length} / ${cur.E} 天`],['合计',text(cur.rev,'amount')],['占区间',P(cur.tot?cur.rev/cur.tot:0)]],foot:'区间 = 9/1 至截至日；区域为「全部」时用逐日总营收'})},
      ...cells.map((c,i)=>({el:c,read:()=>{const d=i+1;return d>cur.E?{title:`9 月 ${d} 日`,rows:[['状态','截至日之后，暂无数据']]}:{title:`9 月 ${d} 日 · ${st.region==='all'?'全部区域':regName(st.region)}`,rows:[['营收',text(dayRev(d),'amount')],['阈值',st.t+' 万元'],['结果',dayRev(d)>=st.t?'符合':'不符合']]};}}))],placeholder:'轻点结果条或任一天查看读数'};
    cells.forEach(c=>c.setAttribute('tabindex','-1'));
    function reset(){st={...DEF};Hash.set(KEY,null,{push:false});render();}
    const dec=v=>{const m=/^(all|east|south|north|sw|central|other)~(\d+)$/.exec(v||'');return m?{region:m[1],t:Math.min(80,+m[2])}:null;};
    const h=dec(Hash.get(KEY));if(h){st=h;touched(root);}render();
    Hash.on(KEY,v=>{st=dec(v)||{...DEF};render();});
    return {reset};
  };

  /* ---------- F11 · date panel: daily status dots (weekday-weighted target) + page-level as-of (D3 / D6) ---------- */
  const dayTarget=k=>{const {y,m}=parts(k),T_=TARGET_M[m];if(!T_||y!==2026)return null;const n=mdays(y,m);let wd=0,we=0;for(let d=1;d<=n;d++)(wday(key(y,m,d))>4?we++:wd++);const unit=T_/(wd+we*.75);return wday(k)>4?unit*.75:unit;};
  const dayStatus=k=>{const v=dayAt(k),t=dayTarget(k);if(!v||!t)return 'none';const r=v.rev/t;return r>=1?'good':r>=.9?'warn':'bad';};
  const STL={good:'达标',warn:'接近',bad:'未达',none:'无数据'};
  ChartDemos.flt_panel=(root,C)=>{
    const KEY='f11';let day=AsOf.key();
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('DATE PANEL','日期面板','<span data-k="basis"></span>')}
      <div class="fk-dp"><div><div data-k="cal"></div><div class="fk-legend"><span><i class="fk-dot good"></i>达标 ≥100%</span><span><i class="fk-dot warn"></i>接近 90–100%</span><span><i class="fk-dot bad"></i>未达 &lt;90%</span><span><i class="fk-dot none"></i>无数据</span></div></div>
        <div class="fk-read" data-k="read"><div class="t" data-k="rt"></div><div data-k="rows"></div><div class="w" data-k="week"></div>
          <div class="ftt-row" style="margin-top:4px"><button type="button" class="fk-btn primary" data-k="asof"></button><button type="button" class="fk-btn" data-k="latest">回到最新</button></div><div class="w" data-k="asof-note"></div></div>
        <div class="fk-sum" data-k="sum"></div></div>
      <p class="ftt-note" data-k="note"></p>`;
    const calEl=qk(root,'cal');
    const cal=FK.cal(calEl,{mode:'single',month:'2026-09',min:DMIN,max:()=>AsOf.key(),monthMax:'2026-09-30',latest:null,value:day,focus:day,
      dayInner:k=>`<i class="fk-dot ${dayStatus(k)}" aria-hidden="true"></i>`,
      dayLabel:k=>{const {m,d}=parts(k),v=dayAt(k),s=dayStatus(k);return `${m} 月 ${d} 日 星期${WDN[wday(k)]}${v?`，营收 ${W(v.rev)} 万，${STL[s]}`:'，暂无数据'}`;},
      onPick:k=>{day=k;Hash.set(KEY,k===AsOf.key()?null:k.slice(5).replace('-',''));paint();say(root,`${md(k)}，营收 ${dayAt(k)?WU(dayAt(k).rev):'暂无数据'}，${STL[dayStatus(k)]}`);}});
    calEl.querySelector('.fk-cal-grid').classList.add('single');
    let cur=null;
    function paint(){
      const v=dayAt(day),t=dayTarget(day),s=dayStatus(day),w0=addD(day,-wday(day)),wk=dayRange(w0,addD(w0,6)).filter(k=>dayAt(k)),cnt={good:0,warn:0,bad:0};wk.forEach(k=>cnt[dayStatus(k)]++);
      const prev=dayAt(addD(day,-7)),{m,d}=parts(day);cur={v,t,s,prev};
      qk(root,'basis').textContent=`按日巡检 · 数据截至 ${md(AsOf.key())}`;
      qk(root,'rt').innerHTML=`${m} 月 ${d} 日 · 周${WDN[wday(day)]}<span class="kpi-chip ${s==='none'?'':s}" style="margin-left:auto">${s==='none'?'—':`<i aria-hidden="true">${{good:'✓',warn:'!',bad:'✕'}[s]}</i>`}${STL[s]}</span>`;
      qk(root,'rows').innerHTML=v?[['营收',WU(v.rev)],[`日目标（${wday(day)>4?'周末':'工作日'}）`,t?WU(t):'—'],['达成',t?`<span class="st-${s}">${P(v.rev/t)}</span>`:'—'],['订单',N(v.ord)+' 单'],['客单价',nf(Math.round(aov(v.rev,v.ord)))+' 元'],['较上周同日',prev?deltaHTML(dlt(v.rev,prev.rev)):'—']].map(([a,b])=>`<div class="r"><span>${a}</span><b>${b}</b></div>`).join(''):`<div class="r"><span>状态</span><b>截至日之后，暂无数据</b></div>`;
      qk(root,'week').textContent=`本周 ${md(w0)}–${md(addD(w0,6))}：达标 ${cnt.good} · 接近 ${cnt.warn} · 未达 ${cnt.bad}${wk.length<7?`（有数据 ${wk.length} 天）`:''}`;
      const inSep=parts(day).m===9,isAs=day===AsOf.key(),btn=qk(root,'asof');
      btn.disabled=!inSep||isAs;btn.textContent=isAs?`当前截至日 ${md(day)}`:inSep?`设为截至日 → 全页按 ${md(day)} 重算`:'8 月不作截至日';
      qk(root,'latest').hidden=AsOf.latest();
      summary(parts(day).m);
      qk(root,'asof-note').textContent=AsOf.latest()?'截至日决定「本月 / 本季 / 本年」累计到哪一天；卡内分段仍决定口径（D3）。':`全页截至 ${md(AsOf.key())}：筛选、页签、表格三组与 K04、K05 已按该日重算。`;
    }
    function summary(m){const n=m===9?AsOf.get():31,days=Array.from({length:n},(_,i)=>key(2026,m,i+1)).filter(k=>dayAt(k)),cnt={good:0,warn:0,bad:0};days.forEach(k=>cnt[dayStatus(k)]++);
      const weeks=[];days.forEach(k=>{const w0=addD(k,-wday(k));let w=weeks.find(x=>x.w0===w0);if(!w){w={w0,days:[]};weeks.push(w);}w.days.push(k);});
      const worst=weeks.map(w=>({w,bad:w.days.filter(k=>dayStatus(k)==='bad').length})).sort((a,b)=>b.bad-a.bad)[0];
      qk(root,'sum').innerHTML=`<h4>${m===9?'SEPTEMBER':'AUGUST'}<b>${m} 月巡检</b></h4><div class="fk-sumline">达标 <b>${cnt.good}</b> · 接近 <b>${cnt.warn}</b> · 未达 <b>${cnt.bad}</b><span>（${md(days[0])}–${md(days[days.length-1])}）</span></div>
        <div class="fk-weeks">${weeks.map((w,i)=>{const c={good:0,warn:0,bad:0};w.days.forEach(k=>c[dayStatus(k)]++);return `<div class="fk-wk" data-metric-target="true" tabindex="-1" data-w="${i}"><span class="lab">${md(w.days[0])}–${md(w.days[w.days.length-1])}</span><span class="stk">${['good','warn','bad'].map(s=>c[s]?`<i class="${s}" style="flex:${c[s]}"></i>`:'').join('')}</span><span class="n">${c.good}·${c.warn}·${c.bad}</span></div>`;}).join('')}</div>
        <p class="ftt-note" style="margin-top:8px">${worst&&worst.bad?`未达集中在 ${md(worst.w.days[0])}–${md(worst.w.days[worst.w.days.length-1])} 这一周（${worst.bad} 天）。`:'这个月没有未达的日子。'}每行依次是达标 · 接近 · 未达的天数。</p>`;
      summaryWeeks=weeks;}
    let summaryWeeks=[];
    const wd=1800/(22+8*.75),we=wd*.75;
    qk(root,'note').innerHTML=`<b>日目标按星期加权</b>（周末 0.75：9 月工作日 ${W(wd)} 万、周末 ${W(we)} 万）。若按平均日目标 60 万判定，9 月的红点全部落在周六日——那是星期规律，不是经营问题。`;
    qk(root,'asof').addEventListener('click',()=>{if(parts(day).m!==9)return;AsOf.set(parts(day).d);say(root,`截至日已设为 ${md(day)}，筛选、页签、表格与 K04、K05 已按该日重算`);});
    qk(root,'latest').addEventListener('click',()=>{AsOf.set(22);day=AsOf.key();cal.set({value:day,focus:day});paint();});
    AsOf.on(()=>{if(day>AsOf.key())day=AsOf.key();cal.set({value:day,focus:day});paint();});
    const wkLookup=el=>{if(!el.classList.contains('fk-wk'))return null;const w=summaryWeeks[+el.dataset.w];if(!w)return null;return {el,read:()=>({title:`${md(w.days[0])}–${md(w.days[w.days.length-1])} 这一周`,rows:w.days.map(k=>[`${md(k)} 周${WDN[wday(k)]}`,`${W(dayAt(k).rev)} 万 · ${STL[dayStatus(k)]}`]),foot:'日目标按星期加权；周末权重 0.75'})};};
    root.inspector={lookup:wkLookup,targets:[{el:qk(root,'rows'),read:()=>cur.v?{title:`${md(day)} · 日目标`,rows:[['营收',text(cur.v.rev,'amount')],['日目标',cur.t?text(cur.t,'amount'):'—'],['达成',cur.t?P(cur.v.rev/cur.t,2):'—'],['判定',STL[cur.s]]],foot:'日目标 = 月目标 ÷（工作日数 + 周末天数 × 0.75），周末再 × 0.75'}:{title:md(day),rows:[['状态','暂无数据']]}}],placeholder:'轻点读数查看日目标算法'};
    function reset(){if(!AsOf.latest())AsOf.set(22);day=AsOf.key();Hash.set(KEY,null,{push:false});cal.set({value:day,focus:day,ym:'2026-09'});paint();}
    const dec=v=>{const m=/^(\d\d)(\d\d)$/.exec(v||'');if(!m)return null;const k=key(2026,+m[1],+m[2]);return k>=DMIN&&k<=AsOf.key()?k:null;};
    const h=dec(Hash.get(KEY));if(h){day=h;cal.set({value:day,focus:day});}if(h||!AsOf.latest())touched(root);paint();
    Hash.on(KEY,v=>{day=dec(v)||AsOf.key();cal.set({value:day,focus:day});paint();});
    return {reset};
  };

  /* ---------- page-level as-of pill ---------- */
  (function pill(){const run=()=>{const el=document.getElementById('asof-pill');if(!el)return;const paint=()=>{el.classList.toggle('moved',!AsOf.latest());
      el.innerHTML=AsOf.latest()?`数据截至 <b>9/22</b>`:`全页截至 <b>${md(AsOf.key())}</b> <button type="button">回到最新</button>`;el.querySelector('button')?.addEventListener('click',()=>AsOf.set(22));};paint();AsOf.on(paint);};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();})();
