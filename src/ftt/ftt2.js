
  /* ---------- 9 · demo helpers ---------- */
  const qk=(el,k)=>el.querySelector(`[data-k="${k}"]`);
  const touched=root=>{const a=root.closest('.specimen');if(a)a.dataset.interacted='true';};
  const sep=' · ';
  // Keyed horizontal bars: rows are reused so width changes animate in the same coordinate system.
  function hbars(host,items,o={}){
    const tag=o.button?'BUTTON':'DIV',max=o.max??Math.max(0,...items.map(x=>x.v||0));
    const have=new Map([...host.children].map(el=>[el.dataset.id,el]));
    const out=items.map(it=>{let el=have.get(it.id);
      if(!el||el.tagName!==tag){el=document.createElement(tag);if(o.button)el.type='button';el.className='fk-hbar';el.dataset.id=it.id;el.innerHTML='<span class="n"></span><span class="track" aria-hidden="true"><i style="width:0"></i></span><span class="v"></span>';}
      el.querySelector('.n').textContent=it.name;el.querySelector('.v').textContent=o.fmt?o.fmt(it.v,it):W(it.v);
      // Optional 4th column (e.g. 环比), HTML allowed; the host switches to the 4-column grid.
      let x=el.querySelector('.x');if(o.extra){if(!x){x=document.createElement('span');x.className='x';el.appendChild(x);}x.innerHTML=o.extra(it);}else if(x)x.remove();
      const w=max?Math.max(0,it.v||0)/max*100:0,b=el.querySelector('.track i');requestAnimationFrame(()=>{b.style.width=w.toFixed(2)+'%';});
      el.classList.toggle('dim',!!it.dim);if(o.button)el.setAttribute('aria-pressed',String(!!it.on));if(o.target)el.dataset.metricTarget='true';
      if(o.button&&o.rove){if(!host.dataset.rove)host.dataset.rove=items[0]?.id||'';el.tabIndex=it.id===host.dataset.rove?0:-1;}
      el.setAttribute('aria-label',o.label?o.label(it):`${it.name} ${o.fmt?o.fmt(it.v,it):WU(it.v)}`);return el;});
    if(o.button&&o.rove&&!out.some(el=>el.tabIndex===0)&&out[0]){out[0].tabIndex=0;host.dataset.rove=out[0].dataset.id;}
    if(o.rove&&!host.dataset.roveWired){host.dataset.roveWired='1';host.addEventListener('focusin',e=>{const b=e.target.closest('.fk-hbar');if(!b)return;host.dataset.rove=b.dataset.id;[...host.children].forEach(x=>x.tabIndex=x===b?0:-1);});}
    host.classList.toggle('x4',!!o.extra);
    const same=out.length===host.children.length&&out.every((el,i)=>host.children[i]===el);
    if(!same){const f=document.activeElement;host.replaceChildren(...out);if(f&&host.contains(f))f.focus();}
    return out;
  }
  // Mini column chart; items: {v, cls, t(title)}; heights relative to the largest value.
  function cols(host,items,o={}){const max=o.max??Math.max(0,...items.flatMap(x=>x.pair?x.pair.map(p=>p.v||0):[x.v||0]));
    const h=v=>max?Math.max(2,(v||0)/max*100):0;
    host.innerHTML=items.map(x=>x.pair?`<span class="pair">${x.pair.map(p=>`<i class="${p.cls||''}" style="height:${h(p.v).toFixed(1)}%"></i>`).join('')}</span>`:`<i class="${x.cls||''}" style="height:${x.cls==='miss'?2:h(x.v).toFixed(1)}%"></i>`).join('');}
  const regName=id=>FD.regById(id).name,chName=id=>FD.chById(id).name;
  const dayRange=(a,b)=>{const out=[];for(let n=dnum(a);n<=dnum(b);n++)out.push(dkey(n));return out;};
  // Daily value that respects the page as-of date (days after it count as "no data yet").
  const dayAt=k=>{const {y,m,d}=parts(k);if(y===2026&&m===9&&d>AsOf.get())return null;return dayVal(k);};
  function spanAt(a,b){let rev=0,ord=0,days=0,missing=0;dayRange(a,b).forEach(k=>{const v=dayAt(k);if(v){rev+=v.rev;ord+=v.ord;days++;}else missing++;});return {rev,ord,days,missing,total:days+missing};}
  const shiftMonth=(k,dm)=>{const {y,m,d}=parts(k);let yy=y,mm=m+dm;while(mm<1){mm+=12;yy--;}while(mm>12){mm-=12;yy++;}return key(yy,mm,Math.min(d,mdays(yy,mm)));};

  /* ---------- F01 · quick time chips ---------- */
  ChartDemos.flt_quick=(root,C)=>{
    const PRE=[['today','今日'],['yday','昨日'],['week','本周'],['month','本月'],['quarter','本季'],['year','本年'],['d7','近 7 天'],['d30','近 30 天']];
    const KEY='f01',DEF={preset:'month'};let st={...DEF},draft=null;
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('QUICK RANGE','快捷时间','<span data-k="basis"></span>')}
      <div class="ftt-row"><div data-k="chips"></div>
        <span class="fk-anchor"><button type="button" class="fk-chip dash" data-k="custom" aria-haspopup="dialog">自定义 ▾</button>
          <div class="fk-pop" role="dialog" aria-label="自定义日期区间" data-k="pop" style="width:268px"><div data-k="cal"></div>
            <div class="fk-foot"><span data-k="picked">先点起点，再点终点</span><span class="fk-row"><button type="button" class="fk-btn" data-k="cancel">取消</button><button type="button" class="fk-btn primary" data-k="ok" disabled>确定</button></span></div></div></span></div>
      <div class="ftt-panel" data-k="out">
        <div class="ftt-span" data-k="span"></div>
        <div data-k="data"><div class="ftt-big" data-k="big"><span class="v" data-k="v">0</span><span class="u">万元</span><span data-k="d"></span></div>
          <div class="ftt-facts" data-k="facts"><span>订单<b data-k="ord"></b></span><span>日均<b data-k="avg"></b></span><span>客单价<b data-k="aov"></b></span></div>
          <div class="fk-cols" data-k="cols" aria-hidden="true"></div></div>
        <div class="ftt-empty" data-k="empty" hidden><div class="big">今日数据尚未产出</div><div class="sub" data-k="why"></div><div class="ftt-row"><button type="button" class="fk-btn" data-k="to-yday">看昨日</button></div></div>
      </div>
      <p class="ftt-note">选中态用反色，和分段控件同一套选中语法；<b>「今日」没有数据时写原因，不写 0</b>。对比口径：日 / 周比上周同期，月比上月同期，滚动区间比前一段等长区间。</p>`;
    const ch=FK.chips(qk(root,'chips'),{items:PRE.map(([id,label])=>({id,label})),mode:'single',value:'month',label:'快捷时间',onChange:id=>{st={preset:id};commit();}});
    const custom=qk(root,'custom'),pane=qk(root,'pop');
    const cal=FK.cal(qk(root,'cal'),{mode:'range',month:'2026-09',min:DMIN,max:()=>AsOf.key(),monthMax:'2026-09-30',onPick:({from,to,done})=>{draft={from,to};qk(root,'ok').disabled=!done;qk(root,'picked').textContent=done?`${spanText(from,to)} · ${dayRange(from,to).length} 天`:`起点 ${md(from)}，再点终点`;}});
    qk(root,'cal').querySelector('.fk-cal-grid').classList.add('range');
    const pop=FK.pop(custom,pane,{onOpen(){cal.set({from:st.from||null,to:st.to||null,anchor:null,focus:st.to||AsOf.key()});draft=null;qk(root,'ok').disabled=true;qk(root,'picked').textContent='先点起点，再点终点';requestAnimationFrame(()=>cal.focus());}});
    custom.addEventListener('click',()=>pop.toggle());
    qk(root,'cancel').addEventListener('click',()=>pop.close(true));
    qk(root,'ok').addEventListener('click',()=>{if(!draft)return;st={preset:'custom',from:draft.from,to:draft.to};pop.close(true);commit();});
    qk(root,'to-yday').addEventListener('click',()=>{st={preset:'yday'};commit();ch.btns.find(b=>b.dataset.id==='yday').focus();});
    function range(s){const T=AsOf.today(),{y,m}=parts(T);
      switch(s.preset){
        case 'today':return {from:T,to:T,shift:k=>addD(k,-7),cmpLabel:'上周同日'};
        case 'yday':return {from:addD(T,-1),to:addD(T,-1),shift:k=>addD(k,-7),cmpLabel:'上周同日'};
        case 'week':{const a=addD(T,-wday(T));return {from:a,to:T,shift:k=>addD(k,-7),cmpLabel:'上周同期'};}
        case 'month':{const a=key(y,m,1);return {from:a,to:T,shift:k=>shiftMonth(k,-1),cmpLabel:'上月同期'};}
        case 'quarter':return {from:key(y,7,1),to:T,months:[7,8],cmpBase:AsOf.latest()?DATA.base.qoq:null,cmpLabel:'上季同期'};
        case 'year':return {from:key(y,1,1),to:T,months:[1,2,3,4,5,6,7,8],cmpBase:AsOf.latest()?DATA.base.yoyY:null,cmpLabel:'去年同期'};
        case 'd7':return {from:addD(T,-6),to:T,shift:k=>addD(k,-7),cmpLabel:'前 7 天'};
        case 'd30':return {from:addD(T,-29),to:T,shift:k=>addD(k,-30),cmpLabel:'前 30 天'};
        default:{const n=dnum(s.to)-dnum(s.from)+1;return {from:s.from,to:s.to,shift:k=>addD(k,-n),cmpLabel:`前 ${n} 天`};}}}
    let cur=null;
    function render(){
      const r=range(st),T=AsOf.today();let v,cmp=null,cmpNote='';
      qk(root,'basis').textContent=`口径：自然日 · 数据截至 ${md(AsOf.key())}`;
      if(r.months){const sep9=spanAt(key(2026,9,1),r.to);v={rev:sum(r.months.map(FD.monthRev))+sep9.rev,ord:sum(r.months.map(FD.monthOrd))+sep9.ord,days:dnum(AsOf.key())-dnum(r.from)+1,missing:1,total:dnum(r.to)-dnum(r.from)+1};
        if(r.cmpBase)cmp={rev:r.cmpBase.rev,ord:r.cmpBase.ord};else cmpNote=`${r.cmpLabel}只在截至日为 9/22 时有值`;}
      else{v=spanAt(r.from,r.to);const have=dayRange(r.from,r.to).filter(k=>dayAt(k)),cd=have.map(r.shift),cv=cd.map(dayAt),miss=cv.filter(x=>!x).length;
        // compare like with like: only the days that already have data, each shifted to its counterpart
        if(have.length&&!miss){cmp={rev:sum(cv.map(x=>x.rev)),ord:sum(cv.map(x=>x.ord)),from:cd[0],to:cd[cd.length-1]};}else if(have.length)cmpNote=miss<cd.length?`对比期缺 ${miss} 天数据`:'对比期无逐日数据';}
      cur={r,v,cmp,cmpNote};
      const empty=!v.days,dd=cmp?dlt(v.rev,cmp.rev):null;
      qk(root,'span').textContent=`${spanText(r.from,r.to)} · ${v.total} 天${v.missing?`（有数据 ${v.days} 天）`:''}`;
      qk(root,'data').hidden=empty;qk(root,'empty').hidden=!empty;
      if(empty){qk(root,'why').textContent=`${md(T)} 当天的数据次日 09:30 产出；当前数据截至 ${md(AsOf.key())}。空值写原因，零值才写 0。`;say(root,`${md(T)} 暂无数据`);}
      else{K.count(C,'f01-v',[{el:qk(root,'v'),from:parseFloat(qk(root,'v').textContent.replace(/,/g,''))||0,to:v.rev,format:x=>W(x)}],600);
        qk(root,'d').innerHTML=dd?`${deltaHTML(dd)} <span class="u">vs ${r.cmpLabel}</span>`:`<span class="u">vs ${r.cmpLabel}：— ${cmpNote}</span>`;
        qk(root,'ord').textContent=N(v.ord)+' 单';qk(root,'avg').textContent=WU(v.rev/Math.max(1,v.days));qk(root,'aov').textContent=nf(Math.round(aov(v.rev,v.ord)))+' 元';
        if(r.months){const ms=[...r.months,9];cols(qk(root,'cols'),ms.map(m=>({v:m===9?spanAt(key(2026,9,1),r.to).rev:FD.monthRev(m),cls:m===9?'part':''})));}
        else cols(qk(root,'cols'),dayRange(r.from,r.to).map(k=>{const x=dayAt(k);return x?{v:x.rev}:{cls:'miss'};}));
        say(root,`${spanText(r.from,r.to)}，营收 ${WU(v.rev)}${dd?`，${r.cmpLabel}${dd.dir} ${dd.text.replace(K.MINUS,'')}`:''}`);}
      custom.classList.toggle('on',st.preset==='custom');custom.textContent=st.preset==='custom'?`${spanText(st.from,st.to)} ▾`:'自定义 ▾';
      custom.setAttribute('aria-label',st.preset==='custom'?`自定义区间 ${spanText(st.from,st.to)}，点击修改`:'自定义区间');
      ch.set(st.preset==='custom'?null:st.preset);cal.set({});
    }
    const enc=s=>s.preset==='custom'?`c${s.from.slice(5).replace('-','')}-${s.to.slice(5).replace('-','')}`:s.preset==='month'?null:s.preset;
    const dec=v=>{if(!v)return null;if(PRE.some(p=>p[0]===v))return {preset:v};const m=/^c(\d\d)(\d\d)-(\d\d)(\d\d)$/.exec(v);if(!m)return null;return {preset:'custom',from:key(2026,+m[1],+m[2]),to:key(2026,+m[3],+m[4])};};
    function commit(){Hash.set(KEY,enc(st));render();}
    AsOf.on(()=>{cal.set({});render();});
    root.inspector={targets:[
      {el:qk(root,'big'),read:()=>{const {r,v,cmp}=cur;return {title:`营收 · ${spanText(r.from,r.to)}`,rows:[['营收',text(v.rev,'amount')],['全值',nf(Math.round(v.rev*1e4))+' 元'],[r.cmpLabel+(cmp&&cmp.from?` ${spanText(cmp.from,cmp.to)}`:''),cmp?text(cmp.rev,'amount'):'—'],['变化',cmp?dlt(v.rev,cmp.rev).text:'—']],foot:cmp?'只拿已有数据的天数逐日对齐比较；变化 = 本期 ÷ 对比期 − 1':cur.cmpNote};}},
      {el:qk(root,'facts'),read:()=>{const {v}=cur;return {title:'订单 · 日均 · 客单价',rows:[['订单',N(v.ord)+' 单'],['有数据天数',v.days+' 天'],['日均营收',text(v.rev/Math.max(1,v.days),'amount')],['客单价',nf(Math.round(aov(v.rev,v.ord)))+' 元']],foot:'日均按有数据的天数算；客单价 = 营收 ÷ 订单'};}},
      {el:qk(root,'span'),read:()=>{const {r,v}=cur;return {title:'区间口径',rows:[['区间',spanText(r.from,r.to)],['自然日',v.total+' 天'],['有数据',v.days+' 天'],['截至',md(AsOf.key())]],foot:'快捷项都以「今天」为终点；截至日之后的天数计入区间，但没有数据'};}}],placeholder:'轻点数字查看口径与对比'};
    function reset(){pop.close(false);st={...DEF};Hash.set(KEY,null,{push:false});render();}
    const h=dec(Hash.get(KEY));if(h){st=h;touched(root);render();}else render();
    Hash.on(KEY,v=>{st=dec(v)||{...DEF};render();});
    return {reset};
  };

  /* ---------- F02 · date range with presets and comparison period ---------- */
  ChartDemos.flt_range=(root,C)=>{
    const KEY='f02',DEF=()=>({from:key(2026,9,1),to:AsOf.key(),cmp:'mom'});let st=DEF(),draft=null;
    const CMP=[['mom','上期同期'],['yoy','去年同期'],['none','不对比']];
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('DATE RANGE','日期区间','<span data-k="cmp-note"></span>')}
      <div class="ftt-row"><span class="fk-anchor"><button type="button" class="fk-field" data-k="trig" aria-haspopup="dialog"><span class="k">时间</span><b data-k="tv"></b><span class="caret" aria-hidden="true">▾</span></button>
        <div class="fk-pop fk-pop-range" role="dialog" aria-label="选择日期区间与对比期" data-k="pop">
          <div class="fk-rng"><div class="fk-presets" role="group" aria-label="预设区间" data-k="presets"></div><div data-k="cal"></div></div>
          <div class="fk-div"></div><div class="ftt-row"><span class="ftt-lab">对比期</span><div data-k="cmp"></div></div>
          <div class="fk-foot"><span data-k="sum"></span><span class="fk-row"><button type="button" class="fk-btn" data-k="cancel">取消</button><button type="button" class="fk-btn primary" data-k="ok">确定</button></span></div></div></span>
        <span class="fk-tag" data-k="cmp-tag"><span class="t"></span></span></div>
      <div class="ftt-panel"><div class="ftt-span" data-k="span"></div>
        <div class="ftt-grid2" style="margin-top:8px"><div data-k="k-rev"><div class="ftt-lab">营收</div><div class="ftt-big"><span class="v" data-k="rev">0</span><span class="u">万元</span></div><div data-k="d-rev"></div></div>
          <div data-k="k-ord"><div class="ftt-lab">订单</div><div class="ftt-big"><span class="v" data-k="ord">0</span><span class="u">单</span></div><div data-k="d-ord"></div></div></div>
        <div class="fk-cols pair" data-k="cols" aria-hidden="true" style="margin-top:8px"></div>
        <div class="ftt-legend fk-legend"><span><i class="fk-dot" style="background:var(--s-blue);border-radius:2px"></i>本期</span><span><i class="fk-dot" style="background:var(--c-dim);border-radius:2px"></i>对比期</span></div></div>
      <p class="ftt-note">预设 + 自定义两级结构；<b>对比期跟着区间走</b>：上期同期 = 每一天往前挪一个月。7 月与 2025 年 8 月没有逐日数据时写「—」并说明，不补 0。</p>`;
    const PRESETS=[['d7','近 7 天'],['d14','近 14 天'],['month','本月'],['last','上月'],['all','8/1 至今']];
    const presetRange=id=>{const E=AsOf.key();switch(id){case 'd7':return [addD(E,-6),E];case 'd14':return [addD(E,-13),E];case 'month':return [key(2026,9,1),E];case 'last':return [key(2026,8,1),key(2026,8,31)];default:return [DMIN,E];}};
    const trig=qk(root,'trig'),pane=qk(root,'pop');
    qk(root,'presets').innerHTML=PRESETS.map(([id,l])=>`<button type="button" class="fk-opt" data-p="${id}" aria-pressed="false">${l}</button>`).join('');
    const cal=FK.cal(qk(root,'cal'),{mode:'range',month:'2026-09',min:DMIN,max:()=>AsOf.key(),monthMax:'2026-09-30',onPick:({from,to,done})=>{draft.from=from;draft.to=to;draft.pending=!done;paintDraft();}});
    const cmpChips=FK.chips(qk(root,'cmp'),{items:CMP.map(([id,label])=>({id,label})),mode:'single',value:'mom',label:'对比期',onChange:id=>{draft.cmp=id;paintDraft();}});
    function paintDraft(){const n=dnum(draft.to)-dnum(draft.from)+1,s=spanAt(draft.from,draft.to);
      qk(root,'sum').textContent=draft.pending?`起点 ${md(draft.from)}，再点终点`:`已选 ${n} 天 · 有数据 ${s.days} 天${draft.from===key(2026,9,1)&&draft.to===AsOf.key()?` · 时间进度 ${P(AsOf.get()/30)}`:''}`;
      qk(root,'ok').disabled=!!draft.pending;qk(root,'presets').querySelectorAll('[data-p]').forEach(b=>{const [a,z]=presetRange(b.dataset.p);b.setAttribute('aria-pressed',String(a===draft.from&&z===draft.to));});}
    const pop=FK.pop(trig,pane,{onOpen(){draft={...st,pending:false};cal.set({from:st.from,to:st.to,anchor:null,focus:st.to});cmpChips.set(st.cmp);paintDraft();requestAnimationFrame(()=>qk(root,'presets').querySelector('[aria-pressed="true"]')?.focus()||cal.focus());}});
    trig.addEventListener('click',()=>pop.toggle());
    qk(root,'presets').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;const [a,z]=presetRange(b.dataset.p);draft.from=a;draft.to=z;draft.pending=false;cal.set({from:a,to:z,anchor:null,focus:z});paintDraft();});
    qk(root,'cancel').addEventListener('click',()=>pop.close(true));
    qk(root,'ok').addEventListener('click',()=>{st={from:draft.from,to:draft.to,cmp:draft.cmp};pop.close(true);commit();});
    function cmpRange(s){if(s.cmp==='none')return null;if(s.cmp==='mom')return [shiftMonth(s.from,-1),shiftMonth(s.to,-1)];const y=k=>{const p=parts(k);return key(p.y-1,p.m,p.d);};return [y(s.from),y(s.to)];}
    let cur=null;
    function render(){
      if(st.to>AsOf.key())st.to=AsOf.key();if(st.from>st.to)st.from=st.to;
      const v=spanAt(st.from,st.to),cr=cmpRange(st),cs=cr?spanAt(cr[0],cr[1]):null,ok=cs&&cs.days&&!cs.missing,lab=CMP.find(c=>c[0]===st.cmp)[1];
      cur={v,cr,cs,ok,lab};
      qk(root,'tv').textContent=spanText(st.from,st.to);trig.setAttribute('aria-label',`时间 ${spanText(st.from,st.to)}，对比 ${lab}，点击修改`);
      qk(root,'cmp-tag').querySelector('.t').innerHTML=`对比：<b>${lab}</b>`;
      qk(root,'span').textContent=`${spanText(st.from,st.to)} · ${v.total} 天${cr?` · 对比 ${spanText(cr[0],cr[1])}`:''}`;
      qk(root,'cmp-note').textContent=cr&&!ok?(cs.days?`对比期缺 ${cs.missing} 天数据`:'对比期无逐日数据'):'';
      K.count(C,'f02',[{el:qk(root,'rev'),from:parseFloat(qk(root,'rev').textContent.replace(/,/g,''))||0,to:v.rev,format:x=>W(x)},{el:qk(root,'ord'),from:parseFloat(qk(root,'ord').textContent.replace(/,/g,''))||0,to:v.ord,format:x=>N(x)}],600);
      const dr=ok?dlt(v.rev,cs.rev):null,dO=ok?dlt(v.ord,cs.ord):null,why=cr?(ok?'':`<span class="u">vs ${lab}：— ${cs.days?`缺 ${cs.missing} 天`:'无逐日数据'}</span>`):'<span class="u">不对比</span>';
      qk(root,'d-rev').innerHTML=dr?`${deltaHTML(dr)} <span class="u">vs ${lab}</span>`:why;qk(root,'d-ord').innerHTML=dO?`${deltaHTML(dO)} <span class="u">vs ${lab}</span>`:why;
      const days=dayRange(st.from,st.to),cdays=cr?dayRange(cr[0],cr[1]):[];
      cols(qk(root,'cols'),days.map((k,i)=>{const a=dayAt(k),b=cdays[i]?dayAt(cdays[i]):null;return {pair:[...(cr?[{v:b?b.rev:0,cls:b?'base':'miss'}]:[]),{v:a?a.rev:0,cls:a?'':'miss'}]};}));
      say(root,`${spanText(st.from,st.to)}，营收 ${WU(v.rev)}${dr?`，${lab}${dr.dir} ${dr.text.replace(K.MINUS,'')}`:''}`);
    }
    const enc=s=>{const d=DEF();if(s.from===d.from&&s.to===d.to&&s.cmp===d.cmp)return null;return `${s.from.slice(5).replace('-','')}-${s.to.slice(5).replace('-','')}.${s.cmp}`;};
    const dec=v=>{const m=v&&/^(\d\d)(\d\d)-(\d\d)(\d\d)\.(mom|yoy|none)$/.exec(v);return m?{from:key(2026,+m[1],+m[2]),to:key(2026,+m[3],+m[4]),cmp:m[5]}:null;};
    function commit(){Hash.set(KEY,enc(st));render();}
    AsOf.on(()=>{const wasLatest=st.to>=addD(AsOf.key(),0);if(st.from===key(2026,9,1))st.to=AsOf.key();cal.set({});render();});
    root.inspector={targets:[
      {el:qk(root,'k-rev'),read:()=>({title:'营收 · 本期 vs 对比期',rows:[['本期',text(cur.v.rev,'amount')],[cur.lab,cur.ok?text(cur.cs.rev,'amount'):'—'],['变化',cur.ok?dlt(cur.v.rev,cur.cs.rev).text:'—']],foot:cur.cr?`对比期 ${spanText(cur.cr[0],cur.cr[1])}；逐日对齐，缺一天就不算变化`:'已选择不对比'})},
      {el:qk(root,'k-ord'),read:()=>({title:'订单 · 本期 vs 对比期',rows:[['本期',N(cur.v.ord)+' 单'],[cur.lab,cur.ok?N(cur.cs.ord)+' 单':'—'],['变化',cur.ok?dlt(cur.v.ord,cur.cs.ord).text:'—']],foot:'订单按支付日统计'})}],placeholder:'轻点营收或订单查看对比口径'};
    function reset(){pop.close(false);st=DEF();Hash.set(KEY,null,{push:false});render();}
    const h=dec(Hash.get(KEY));if(h){st=h;touched(root);}render();
    Hash.on(KEY,v=>{st=dec(v)||DEF();render();});
    return {reset};
  };

  /* ---------- F03 · single select (select-only combobox, W3C APG) ---------- */
  ChartDemos.flt_single=(root,C)=>{
    const KEY='f03',OPTS=[{id:'all',name:'全部'},...CH.map(c=>({id:c.id,name:c.name}))];let val='all',active=0;
    const lb=nid('lb'),lab=nid('lab'),vid=nid('val');
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('SINGLE SELECT','单选下拉','候选 ≤ 10 · 只能选，不能输入')}
      <div class="ftt-row"><span class="fk-anchor"><div class="fk-field" role="combobox" tabindex="0" aria-haspopup="listbox" aria-labelledby="${lab} ${vid}" data-k="combo"><span class="k" id="${lab}">业务线</span><b id="${vid}" data-k="val"></b><span class="caret" aria-hidden="true">▾</span></div>
        <div class="fk-pop" role="listbox" id="${lb}" aria-labelledby="${lab}" data-k="list" style="min-width:200px"></div></span><span class="ftt-span" data-k="span"></span></div>
      <div class="ftt-panel" data-k="out"><div class="ftt-big" data-k="big"><span class="v" data-k="v">0</span><span class="u">万元</span><span class="u" data-k="share"></span></div>
        <div class="ftt-facts" data-k="facts"><span>订单<b data-k="ord"></b></span><span>客单价<b data-k="aov"></b></span><span>环比同期<b data-k="d"></b></span></div>
        <div class="fk-hbars" data-k="bars" style="margin-top:10px"></div></div>
      <p class="ftt-note">选中项带 ✓，不用色块；方向键只移动高亮，<b>Enter / Tab 才确认</b>（APG select-only combobox）。未选中的业务线在下方降为浅色，保留比较参照。</p>`;
    const combo=qk(root,'combo'),list=qk(root,'list');
    list.innerHTML=OPTS.map((o,i)=>`<div class="fk-opt" role="option" id="${lb}-${o.id}" data-i="${i}"><span>${o.name}</span><span class="num" data-k="n-${o.id}"></span><span class="tick" aria-hidden="true"></span></div>`).join('');
    const opts=[...list.children];
    const pop=FK.pop(combo,list,{onOpen(){active=OPTS.findIndex(o=>o.id===val);paintActive();},onClose(){combo.removeAttribute('aria-activedescendant');}});
    function paintActive(){opts.forEach((el,i)=>el.classList.toggle('active',i===active));combo.setAttribute('aria-activedescendant',opts[active].id);opts[active].scrollIntoView({block:'nearest'});}
    function choose(i){pop.close(false);combo.focus();if(OPTS[i].id===val)return;val=OPTS[i].id;Hash.set(KEY,val==='all'?null:val);render();}
    let typed='',typeT=0;
    combo.addEventListener('click',()=>pop.toggle());
    combo.addEventListener('keydown',e=>{const open=pop.isOpen,k=e.key;
      if(!open){if(['ArrowDown','ArrowUp','Enter',' ','Home','End'].includes(k)){e.preventDefault();e.stopPropagation();pop.open(false);if(k==='Home')active=0;if(k==='End')active=OPTS.length-1;paintActive();}
        else if(k.length===1&&/\S/.test(k)){pop.open(false);typeahead(k);e.stopPropagation();}return;}
      if(k==='ArrowDown'){active=Math.min(OPTS.length-1,active+1);}else if(k==='ArrowUp'){if(e.altKey){e.preventDefault();e.stopPropagation();choose(active);return;}active=Math.max(0,active-1);}
      else if(k==='Home')active=0;else if(k==='End')active=OPTS.length-1;
      else if(k==='Enter'||k===' '){e.preventDefault();e.stopPropagation();choose(active);return;}
      else if(k==='Tab'){choose(active);return;}
      else if(k==='Escape'){e.preventDefault();e.stopPropagation();pop.close(true);return;}
      else if(k.length===1&&/\S/.test(k)){typeahead(k);e.stopPropagation();return;}else return;
      e.preventDefault();e.stopPropagation();paintActive();});
    function typeahead(ch_){clearTimeout(typeT);typed+=ch_;typeT=setTimeout(()=>typed='',600);const i=OPTS.findIndex(o=>o.name.startsWith(typed)||o.id.startsWith(typed.toLowerCase()));if(i>=0){active=i;paintActive();}}
    list.addEventListener('pointerdown',e=>e.preventDefault());
    list.addEventListener('click',e=>{const o=e.target.closest('[data-i]');if(o)choose(+o.dataset.i);});
    let cur=null;
    function render(){
      const byC=q({},'channel'),base=qBase({},'channel'),tot=q({});const vals=CH.map(c=>byC.get(c.id)),sel=val==='all'?tot:byC.get(val),bs=val==='all'?qBase({}):base.get(val);
      cur={sel,bs};
      qk(root,'val').textContent=OPTS.find(o=>o.id===val).name;
      opts.forEach((el,i)=>{const on=OPTS[i].id===val;el.setAttribute('aria-selected',String(on));el.querySelector('.tick').textContent=on?'✓':'';el.querySelector('.num').textContent=WU(OPTS[i].id==='all'?tot.rev:byC.get(OPTS[i].id).rev);});
      K.count(C,'f03',[{el:qk(root,'v'),from:parseFloat(qk(root,'v').textContent.replace(/,/g,''))||0,to:sel.rev,format:x=>W(x)}],600);
      qk(root,'share').textContent=val==='all'?'· 全部业务线':`· 占全部 ${P(sel.rev/tot.rev)}`;
      qk(root,'ord').textContent=N(sel.ord)+' 单';qk(root,'aov').textContent=nf(Math.round(aov(sel.rev,sel.ord)))+' 元';
      const d=dlt(sel.rev,bs.rev);qk(root,'d').innerHTML=deltaHTML(d);
      qk(root,'span').textContent=`本月 9/1 – ${md(AsOf.key())}`;
      hbars(qk(root,'bars'),CH.map((c,i)=>({id:c.id,name:c.name,v:vals[i].rev,dim:val!=='all'&&c.id!==val})),{label:it=>`${it.name} ${WU(it.v)}${it.dim?'（未选中）':''}`});
      say(root,`业务线 ${OPTS.find(o=>o.id===val).name}，营收 ${WU(sel.rev)}`);
    }
    AsOf.on(render);
    root.inspector={targets:[{el:qk(root,'big'),read:()=>({title:`营收 · ${OPTS.find(o=>o.id===val).name}`,rows:[['营收',text(cur.sel.rev,'amount')],['环比同期',text(cur.bs.rev,'amount')],['变化',dlt(cur.sel.rev,cur.bs.rev).text]],foot:'业务线 = 渠道；同期为 8 月相同天数'})},
      {el:qk(root,'facts'),read:()=>({title:'订单与客单价',rows:[['订单',N(cur.sel.ord)+' 单'],['客单价',nf(Math.round(aov(cur.sel.rev,cur.sel.ord)))+' 元']],foot:'客单价 = 营收 ÷ 订单'})}],placeholder:'轻点数字查看算法'};
    function reset(){pop.close(false);val='all';Hash.set(KEY,null,{push:false});render();}
    const h=Hash.get(KEY);if(h&&CH.some(c=>c.id===h)){val=h;touched(root);}render();
    Hash.on(KEY,v=>{val=v&&CH.some(c=>c.id===v)?v:'all';render();});
    return {reset};
  };

  /* ---------- F04 · multi select with search, count and select-all ---------- */
  ChartDemos.flt_multi=(root,C)=>{
    const KEY='f04',DEF=['east','south','north'];
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('MULTI SELECT','多选下拉','候选 &gt; 100 时先搜后选')}
      <div class="ftt-row"><span data-k="ms"></span><span class="ftt-span" data-k="selcount"></span></div>
      <div class="ftt-panel"><div class="ftt-big" data-k="big"><span class="v" data-k="v">0</span><span class="u">万元</span><span class="u" data-k="share"></span></div>
        <div class="ftt-facts" data-k="facts"><span>订单<b data-k="ord"></b></span><span>环比同期<b data-k="d"></b></span></div>
        <div class="fk-hbars" data-k="bars" style="margin-top:10px"></div></div>
      <p class="ftt-note">触发器写「华东 +2」，面板里有搜索、全选（半选态）与计数；<b>已选项在重新打开时置顶</b>。每勾一项即时生效（D2）；Enter 勾选、Ctrl / ⌘ + A 全选、Esc 先清搜索再关闭。</p>`;
    let cur=null;
    const ms=FK.multi(qk(root,'ms'),{label:'区域',value:DEF,options:REG.map(r=>({id:r.id,name:r.name,meta:()=>WU(q({regions:[r.id]}).rev)})),onChange:v=>{const s=REG.filter(r=>v.includes(r.id)).map(r=>r.id);Hash.set(KEY,s.join(',')===DEF.join(',')?null:(s.join(',')||'none'));render();}});
    function render(){
      const sel=ms.get(),all=q({}),cur_=sel.length?q({regions:sel}):all,base=sel.length?qBase({regions:sel}):qBase({}),by=q({},'region');cur={sel,cur_,base,all};
      K.count(C,'f04',[{el:qk(root,'v'),from:parseFloat(qk(root,'v').textContent.replace(/,/g,''))||0,to:cur_.rev,format:x=>W(x)}],600);
      qk(root,'share').textContent=sel.length?`· 占全部 ${P(cur_.rev/all.rev)}`:'· 未筛选 = 全部';
      qk(root,'ord').textContent=N(cur_.ord)+' 单';qk(root,'d').innerHTML=deltaHTML(dlt(cur_.rev,base.rev));
      qk(root,'selcount').textContent=`已选 ${sel.length} / ${REG.length}`;
      hbars(qk(root,'bars'),[...REG].sort((a,b)=>by.get(b.id).rev-by.get(a.id).rev).map(r=>({id:r.id,name:r.name,v:by.get(r.id).rev,dim:sel.length>0&&!sel.includes(r.id)})),{label:it=>`${it.name} ${WU(it.v)}${it.dim?'（未选中）':''}`});
      say(root,`已选 ${sel.length} 个区域，营收 ${WU(cur_.rev)}`);ms.refresh();
    }
    AsOf.on(render);
    root.inspector={targets:[{el:qk(root,'big'),read:()=>({title:'所选区域营收',rows:[['所选',cur.sel.length?cur.sel.map(regName).join('、'):'全部'],['营收',text(cur.cur_.rev,'amount')],['占全部',P(cur.cur_.rev/cur.all.rev)],['环比同期',dlt(cur.cur_.rev,cur.base.rev).text]],foot:'多选之间是「或」，与其他筛选之间是「且」'})}],placeholder:'轻点数字查看所选区域'};
    function reset(){ms.pop.close(false);ms.set(DEF);Hash.set(KEY,null,{push:false});render();}
    const dec=v=>v==='none'?[]:v.split(',').filter(id=>REG.some(r=>r.id===id));
    const h=Hash.get(KEY);if(h!==undefined){ms.set(dec(h));touched(root);}render();
    Hash.on(KEY,v=>{ms.set(v===undefined?DEF:dec(v));render();});
    return {reset};
  };

  /* ---------- F05 · cascader (province / city / district, full-path values; decision D5) ---------- */
  ChartDemos.flt_cascade=(root,C)=>{
    const KEY='f05',DEF=['east.js.nj.gl','south.fj.fz.gl'];
    const PROV=[];REG.forEach(r=>GEO[r.id].forEach(p=>{if(p[4])PROV.push({key:r.id+'.'+p[0],name:p[1],kids:p[4].map(c=>({key:r.id+'.'+p[0]+'.'+c[0],name:c[1],kids:c[4].map(x=>({key:r.id+'.'+p[0]+'.'+c[0]+'.'+x[0],name:x[1]}))}))});}));
    const LEAVES=PROV.flatMap(p=>p.kids.flatMap(c=>c.kids.map(x=>({...x,city:c.name,prov:p.name}))));
    const dupe=name=>LEAVES.filter(x=>x.name===name).length>1;
    const label=k=>{const x=LEAVES.find(l=>l.key===k);return dupe(x.name)?`${x.name}（${x.city}）`:x.name;};
    let sel=new Set(DEF),path=['east.js','east.js.nj'];
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('CASCADER','级联筛选','策略：全路径匹配')}
      <div class="ftt-row"><span class="fk-anchor"><button type="button" class="fk-field" data-k="trig" aria-haspopup="dialog"><span class="k">区县</span><b data-k="tv"></b><span class="caret" aria-hidden="true">▾</span></button>
        <div class="fk-pop" role="dialog" aria-label="按省 / 市 / 区选择" data-k="pop" style="width:min(420px,calc(100vw - 32px))"><div class="fk-casc" data-k="casc"></div>
          <div class="fk-foot"><span data-k="fs"></span><span class="fk-row"><button type="button" class="fk-btn" data-k="clear">清空</button><button type="button" class="fk-btn primary" data-k="done">完成</button></span></div></div></span>
        <span class="ftt-span" data-k="count"></span></div>
      <div class="fk-applied" data-k="chips"></div>
      <div class="ftt-panel"><div class="ftt-big" data-k="big"><span class="v" data-k="v">0</span><span class="u">万元</span><span class="u" data-k="share"></span></div><div class="fk-hbars" data-k="bars" style="margin-top:10px;--lab:84px"></div><p class="ftt-note" data-k="dup" style="margin-top:8px"></p></div>
      <p class="ftt-note">显示值（鼓楼）与筛选值（江苏 / 南京 / 鼓楼）分开存：<b>末级重名时只认全路径</b>。→ 进入下一级、← 返回上一级，Space 勾选区县。</p>`;
    const trig=qk(root,'trig'),casc=qk(root,'casc');
    const count=node=>node.kids?node.kids.reduce((s,k)=>s+count(k),0):sel.has(node.key)?1:0;
    function renderCols(focusCol=null){
      const p=PROV.find(x=>x.key===path[0])||PROV[0],c=p.kids.find(x=>x.key===path[1])||p.kids[0];
      const colHTML=(title,items,leaf,level)=>`<div class="col" role="listbox" aria-label="${title}"${leaf?' aria-multiselectable="true"':''} data-level="${level}"><div class="col-h" aria-hidden="true">${title}</div>${items.map(it=>{const onPath=path.includes(it.key),n=leaf?0:count(it);
        return leaf?`<div class="fk-opt" role="option" tabindex="-1" data-key="${it.key}" aria-selected="${sel.has(it.key)}"><i class="fk-box${sel.has(it.key)?' on':''}" aria-hidden="true"></i>${it.name}${dupe(it.name)?'<span class="path">重名</span>':''}</div>`
          :`<div class="fk-opt${onPath?' path-on':''}" role="option" tabindex="-1" data-key="${it.key}" aria-selected="${onPath}"><span>${it.name}</span><span class="cnt">${n?n:''}</span><span class="go" aria-hidden="true">›</span></div>`;}).join('')}</div>`;
      casc.innerHTML=colHTML('省',PROV,false,0)+colHTML('市',p.kids,false,1)+colHTML('区',c.kids,true,2);
      [...casc.querySelectorAll('.col')].forEach((col,i)=>{const items=[...col.querySelectorAll('.fk-opt')];const cur=items.find(x=>x.dataset.key===path[i])||items[0];cur.tabIndex=0;});
      if(focusCol!==null){const col=casc.querySelectorAll('.col')[focusCol];(col.querySelector('[tabindex="0"]')||col.querySelector('.fk-opt'))?.focus();}
      qk(root,'fs').textContent=`已选 ${sel.size} 个区县 · 全路径匹配`;}
    function activate(el,focusNext){const level=+el.closest('.col').dataset.level,k=el.dataset.key;
      if(level===2){sel.has(k)?sel.delete(k):sel.add(k);commit();renderCols();casc.querySelector(`[data-key="${k}"]`)?.focus();return;}
      path=level===0?[k,PROV.find(p=>p.key===k).kids[0].key]:[path[0],k];renderCols(focusNext?level+1:null);if(!focusNext)casc.querySelector(`[data-key="${k}"]`)?.focus();}
    casc.addEventListener('click',e=>{const el=e.target.closest('.fk-opt');if(el)activate(el,false);});
    casc.addEventListener('keydown',e=>{const el=e.target.closest('.fk-opt');if(!el)return;const col=el.closest('.col'),level=+col.dataset.level,items=[...col.querySelectorAll('.fk-opt')],i=items.indexOf(el);let j=null;
      switch(e.key){case 'ArrowDown':j=Math.min(items.length-1,i+1);break;case 'ArrowUp':j=Math.max(0,i-1);break;case 'Home':j=0;break;case 'End':j=items.length-1;break;
        case 'ArrowRight':if(level<2){e.preventDefault();e.stopPropagation();activate(el,true);}return;
        case 'ArrowLeft':if(level>0){e.preventDefault();e.stopPropagation();const prev=casc.querySelectorAll('.col')[level-1];(prev.querySelector('[tabindex="0"]'))?.focus();}return;
        case 'Enter':case ' ':e.preventDefault();e.stopPropagation();activate(el,level<2);return;default:return;}
      e.preventDefault();e.stopPropagation();items.forEach(x=>x.tabIndex=-1);items[j].tabIndex=0;items[j].focus();});
    const pop=FK.pop(trig,qk(root,'pop'),{onOpen(){const first=[...sel][0];if(first){const [r,p,c]=first.split('.');path=[r+'.'+p,r+'.'+p+'.'+c];}renderCols(2);}});
    trig.addEventListener('click',()=>pop.toggle());
    qk(root,'clear').addEventListener('click',()=>{sel.clear();commit();renderCols();});
    qk(root,'done').addEventListener('click',()=>pop.close(true));
    let cur=null;
    function render(){
      const keys=[...sel],tot=q({}),val=sum(keys.map(k=>FD.geo(k).rev));cur={keys,val,tot};
      qk(root,'tv').textContent=!keys.length?'全部':keys.length===1?label(keys[0]):`${label(keys[0])} +${keys.length-1}`;
      trig.setAttribute('aria-label',`区县：${keys.length?keys.map(k=>FD.geo(k).names.slice(1).join(' / ')).join('、'):'全部'}，点击修改`);
      qk(root,'count').textContent=`已选 ${keys.length} 个区县`;
      FK.applied(qk(root,'chips'),{items:keys.map(k=>{const g=FD.geo(k);return {id:k,label:`${g.names.slice(1).join(' / ')}`,aria:g.names.slice(1).join(' / ')};}),onRemove:id=>{sel.delete(id);commit();},onClear:()=>{sel.clear();commit();},empty:'未选区县 · 显示全部'});
      K.count(C,'f05',[{el:qk(root,'v'),from:parseFloat(qk(root,'v').textContent.replace(/,/g,''))||0,to:keys.length?val:tot.rev,format:x=>W(x)}],600);
      qk(root,'share').textContent=keys.length?`· 占全部 ${P(val/tot.rev)}`:'· 未筛选 = 全部';
      hbars(qk(root,'bars'),keys.map(k=>{const g=FD.geo(k);return {id:k,name:label(k),v:g.rev};}),{max:Math.max(...LEAVES.map(l=>FD.geo(l.key).rev))});
      const d=[...new Set(keys.map(k=>FD.geo(k).names[3]))].filter(dupe);
      qk(root,'dup').innerHTML=d.length?d.map(n=>`「${n}」在 ${LEAVES.filter(x=>x.name===n).map(x=>x.city).join(' / ')} 都有，已按全路径分开计算。`).join(''):'所选区县没有重名。';
      say(root,`已选 ${keys.length} 个区县，营收 ${WU(keys.length?val:tot.rev)}`);
    }
    // The address uses one fixed order (the leaf order of the tree), so re-ticking the defaults writes nothing.
    const canon=keys=>LEAVES.map(l=>l.key).filter(k=>keys.includes(k)).join(',');
    function commit(){const v=canon([...sel]);Hash.set(KEY,v===canon(DEF)?null:(v||'none'));render();}
    AsOf.on(render);
    root.inspector={targets:[{el:qk(root,'big'),read:()=>({title:'所选区县营收',rows:cur.keys.length?cur.keys.map(k=>{const g=FD.geo(k);return [g.names.slice(1).join(' / '),text(g.rev,'amount')];}):[['全部',text(cur.tot.rev,'amount')]],foot:'区县值 = 所属区域本月营收 × 该区县占比（月度事实）'})}],placeholder:'轻点数字查看每个区县'};
    function reset(){pop.close(false);sel=new Set(DEF);path=['east.js','east.js.nj'];Hash.set(KEY,null,{push:false});render();}
    const dec=v=>v==='none'?[]:v.split(',').filter(k=>LEAVES.some(l=>l.key===k));
    const h=Hash.get(KEY);if(h!==undefined){sel=new Set(dec(h));touched(root);}render();
    Hash.on(KEY,v=>{sel=new Set(v===undefined?DEF:dec(v));render();});
    return {reset};
  };

  /* ---------- F06 · facet chips (channel × customer segment) ---------- */
  ChartDemos.flt_facet=(root,C)=>{
    const KEY='f06';let chs=[],sgs=['repeat'];
    root.classList.add('ftt-host');
    root.innerHTML=`${bar('FACET','维度 chips','候选 ≤ 6 才平铺')}
      <div class="ftt-row"><span class="ftt-lab">渠道</span><div data-k="ch"></div></div>
      <div class="ftt-row"><span class="ftt-lab">客群</span><div data-k="sg"></div></div>
      <div class="fk-mx" data-k="mx" aria-hidden="true"></div>
      <div class="ftt-facts" data-k="facts"><span>营收<b data-k="rev"></b></span><span>订单<b data-k="ord"></b></span><span>客单价<b data-k="aov"></b></span></div>
      <p class="ftt-note">一维一行，行首写维度名；「全部」= 这一维不设条件。<b>图例不承担筛选</b>：chips 只放在数据上方，不放图下方。</p>`;
    const onCh=v=>{chs=v;commit();},onSg=v=>{sgs=v;commit();};
    const cc=FK.chips(qk(root,'ch'),{items:[{id:'all',label:'全部'},...CH.map(c=>({id:c.id,label:c.name}))],mode:'multi',value:chs,label:'渠道',onChange:onCh});
    const sc=FK.chips(qk(root,'sg'),{items:[{id:'all',label:'全部'},...SEG.map(s=>({id:s.id,label:s.name}))],mode:'multi',value:sgs,label:'客群',onChange:onSg});
    let cur=null;
    function render(){
      const r=q({channels:chs,segs:sgs});cur=r;
      const cell=(c,s)=>q({channels:[c.id],segs:[s.id]});
      qk(root,'mx').innerHTML=`<span></span>${CH.map(c=>`<span class="h">${c.name}</span>`).join('')}`+SEG.map(s=>`<span class="h" style="align-self:center">${s.name}</span>${CH.map(c=>{const v=cell(c,s),on=(!chs.length||chs.includes(c.id))&&(!sgs.length||sgs.includes(s.id));return `<span class="c ${on?'on':'off'}"><b>${W(v.rev)}</b><small>${N(v.ord)} 单</small></span>`;}).join('')}`).join('');
      qk(root,'rev').textContent=WU(r.rev);qk(root,'ord').textContent=N(r.ord)+' 单';qk(root,'aov').textContent=nf(Math.round(aov(r.rev,r.ord)))+' 元';
      say(root,`渠道 ${chs.length?chs.map(chName).join('、'):'全部'}，客群 ${sgs.length?sgs.map(id=>SEG.find(s=>s.id===id).name).join('、'):'全部'}，营收 ${WU(r.rev)}`);
    }
    const ord=(ids,all)=>all.map(x=>x.id).filter(id=>ids.includes(id)).join(',');   // fixed CH / SEG order, whatever the click order
    const enc=()=>`${ord(chs,CH)||'all'}~${ord(sgs,SEG)||'all'}`,DEFV='all~repeat';
    function commit(){Hash.set(KEY,enc()===DEFV?null:enc());render();}
    AsOf.on(render);
    root.inspector={targets:[{el:qk(root,'facts'),read:()=>({title:'交集结果',rows:[['渠道',chs.length?chs.map(chName).join('、'):'全部'],['客群',sgs.length?sgs.map(id=>SEG.find(s=>s.id===id).name).join('、'):'全部'],['营收',text(cur.rev,'amount')],['订单',N(cur.ord)+' 单'],['客单价',nf(Math.round(aov(cur.rev,cur.ord)))+' 元']],foot:'同一维内是「或」，两维之间是「且」；上方矩阵里反色的格子就是被选中的组合'})}],placeholder:'轻点结果行查看口径'};
    function reset(){chs=[];sgs=['repeat'];cc.set(chs);sc.set(sgs);Hash.set(KEY,null,{push:false});render();}
    const dec=v=>{const m=/^([\w,]+)~([\w,]+)$/.exec(v||'');if(!m)return null;const f=(s,L)=>s==='all'?[]:s.split(',').filter(id=>L.some(x=>x.id===id));return [f(m[1],CH),f(m[2],SEG)];};
    const h=dec(Hash.get(KEY));if(h){[chs,sgs]=h;cc.set(chs);sc.set(sgs);touched(root);}render();
    Hash.on(KEY,v=>{const d=dec(v)||[[],['repeat']];[chs,sgs]=d;cc.set(chs);sc.set(sgs);render();});
    return {reset};
  };
