
  /* ---------- 5 · shared bits ---------- */
  const FOCUSABLE='button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const reduced=()=>ChartKit.reduced();
  const W=v=>K.fmt(v,'amount',{scale:'万',short:true}).num;            // 万元，1 位
  const WU=v=>text(v,'amount',{scale:'万',short:true});               // 带「万」
  const N=v=>nf(Math.round(v));
  const P=(v,d=1)=>K.fmt(v,'rate',{d}).num;
  const aov=(rev,ord)=>ord?rev*1e4/ord:null;
  function say(root,msg){const live=root.querySelector(':scope > .sr-only[role="status"]');if(!live)return;live.textContent='';setTimeout(()=>{live.textContent=msg;},40);}
  function bar(en,name,right=''){return `<div class="ftt-bar"><span class="eyebrow">${en}<b>${name}</b></span>${right?`<div class="ftt-bar-end">${right}</div>`:''}</div>`;}
  const seg=(label,choices,active,cls='')=>`<div class="segmented ${cls}" role="group" aria-label="${label}">${choices.map(([id,name])=>`<button type="button" data-choice="${id}" aria-pressed="${id===active}">${name}</button>`).join('')}</div>`;
  function segWire(host,fn){const bs=[...host.querySelectorAll('[data-choice]')];const set=id=>bs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===id)));bs.forEach(b=>b.addEventListener('click',()=>{set(b.dataset.choice);fn(b.dataset.choice);}));return set;}
  // Delta between two values with the KPI polarity rules; null when the base is missing.
  const dlt=(cur,base,o={change:'ratio',polarity:'up'})=>base===null||base===undefined?null:change(cur,base,o);

  /* ---------- 6 · FilterKit: popover, chips, switch, calendar, multi-select, applied chips ---------- */
  const FK=(()=>{
    let openPop=null;
    document.addEventListener('pointerdown',e=>{if(openPop&&!openPop.panel.contains(e.target)&&!openPop.trigger.contains(e.target))openPop.close(false);},true);
    addEventListener('resize',()=>{if(openPop)openPop.place();});
    // Popover anchored under its trigger; flips up near the viewport bottom and is clamped horizontally.
    function pop(trigger,panel,o={}){
      trigger.setAttribute('aria-expanded','false');if(!panel.id)panel.id=nid('pop');trigger.setAttribute('aria-controls',panel.id);panel.hidden=true;
      const api={trigger,panel,isOpen:false,
        // place() runs again after onOpen: content (calendar, list) is often built there, so the first measurement is too short to decide the flip.
        open(focus=true){if(api.isOpen)return;if(openPop&&openPop!==api)openPop.close(false);panel.hidden=false;trigger.setAttribute('aria-expanded','true');api.isOpen=true;openPop=api;raise(true);api.place();o.onOpen&&o.onOpen(focus);api.place();},
        close(back=true){if(!api.isOpen)return;panel.hidden=true;trigger.setAttribute('aria-expanded','false');api.isOpen=false;if(openPop===api)openPop=null;raise(false);o.onClose&&o.onClose();if(back)trigger.focus();},
        toggle(){api.isOpen?api.close():api.open();},
        place(){panel.classList.remove('up');panel.style.left='';
          const tr=trigger.getBoundingClientRect(),pr=panel.getBoundingClientRect(),vw=document.documentElement.clientWidth;
          if(pr.bottom>innerHeight-8&&tr.top-pr.height-14>(document.querySelector('.topbar')?.getBoundingClientRect().bottom||0))panel.classList.add('up');
          const r2=panel.getBoundingClientRect();let shift=0;if(r2.right>vw-8)shift=vw-8-r2.right;if(r2.left+shift<8)shift=8-r2.left;if(shift)panel.style.left=shift+'px';
          // Neither side has room (short viewport): bring the panel into view instead of leaving it below the fold.
          const r3=panel.getBoundingClientRect(),top=(document.querySelector('.topbar')?.getBoundingClientRect().bottom||0);if(r3.bottom>innerHeight||r3.top<top)panel.scrollIntoView({block:'nearest'});}};
      function raise(on){const a=trigger.closest('.specimen');if(a)a.classList.toggle('fk-raised',on);}
      panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();api.close(true);}});
      // Escape also works while focus is still on the trigger (e.g. before the panel has taken focus).
      trigger.addEventListener('keydown',e=>{if(e.key==='Escape'&&api.isOpen){e.stopPropagation();e.preventDefault();api.close(true);}});
      panel.addEventListener('focusout',e=>{const t=e.relatedTarget;if(api.isOpen&&t&&!panel.contains(t)&&t!==trigger)api.close(false);});
      trigger.closest('.chart-host')?.addEventListener('metric-hide',()=>api.close(false));
      return api;
    }
    // Chips: single = radiogroup (arrows move and select), multi = toggle buttons (arrows move, Space toggles).
    function chips(host,{items,mode='single',value,label,onChange}){
      host.classList.add('fk-chips');host.setAttribute('role',mode==='single'?'radiogroup':'group');host.setAttribute('aria-label',label);
      host.innerHTML=items.map(it=>`<button type="button" class="fk-chip" data-id="${it.id}"${mode==='single'?' role="radio"':''}${it.title?` title="${esc(it.title)}"`:''}>${it.label}</button>`).join('');
      const btns=[...host.children];let val=mode==='single'?value:new Set(value||[]);
      const on=id=>mode==='single'?id===val:id==='all'?val.size===0:val.has(id);
      function paint(){btns.forEach(b=>{const v=on(b.dataset.id);b.classList.toggle('on',v);b.setAttribute(mode==='single'?'aria-checked':'aria-pressed',String(v));});
        if(mode==='single'){btns.forEach(b=>b.tabIndex=on(b.dataset.id)?0:-1);if(!btns.some(b=>b.tabIndex===0))btns[0].tabIndex=0;}}
      const get=()=>mode==='single'?val:[...val];
      function choose(id,src){if(mode==='single'){if(val===id)return;val=id;}else if(id==='all')val.clear();else val.has(id)?val.delete(id):val.add(id);paint();onChange&&onChange(get(),src);}
      btns.forEach((b,i)=>{b.addEventListener('click',()=>choose(b.dataset.id,'click'));
        b.addEventListener('focus',()=>{if(mode!=='single')btns.forEach(x=>x.tabIndex=x===b?0:-1);});
        b.addEventListener('keydown',e=>{const d={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[e.key];if(d===undefined&&e.key!=='Home'&&e.key!=='End')return;
          e.preventDefault();e.stopPropagation();const j=e.key==='Home'?0:e.key==='End'?btns.length-1:(i+d+btns.length)%btns.length;
          btns.forEach(x=>x.tabIndex=-1);btns[j].tabIndex=0;btns[j].focus();if(mode==='single')choose(btns[j].dataset.id,'key');});});
      if(mode!=='single')btns.forEach((b,i)=>b.tabIndex=i?-1:0);
      paint();
      return {el:host,btns,get,set(v){val=mode==='single'?v:new Set(v||[]);paint();}};
    }
    function toggle(btn,{checked=true,onChange}={}){
      btn.setAttribute('role','switch');let v=checked;
      const paint=()=>{btn.setAttribute('aria-checked',String(v));btn.classList.toggle('on',v);};
      btn.addEventListener('click',()=>{v=!v;paint();onChange&&onChange(v);});paint();
      return {get:()=>v,set(x){v=!!x;paint();}};
    }
    // Month grid (W3C APG date-picker grid): one roving cell, arrows / PageUp / PageDown / Home / End, Enter or Space picks.
    function cal(host,o){
      const st={ym:o.month,focus:o.focus||o.value||o.to||(typeof o.max==='function'?o.max():o.max),from:o.from||null,to:o.to||null,value:o.value||null,anchor:null,hover:null};
      const cap=nid('cal');
      host.classList.add('fk-cal');
      host.innerHTML=`<div class="fk-cal-head"><button type="button" class="fk-cal-nav" data-nav="-1" aria-label="上个月">‹</button><span class="fk-cal-title" id="${cap}"></span><button type="button" class="fk-cal-nav" data-nav="1" aria-label="下个月">›</button></div>
        <table class="fk-cal-grid" role="grid" aria-labelledby="${cap}"><thead><tr>${WDN.map((w,i)=>`<th scope="col" abbr="星期${w}"${i>4?' class="we"':''}>${w}</th>`).join('')}</tr></thead><tbody></tbody></table>`;
      const tbody=host.querySelector('tbody'),title=host.querySelector('.fk-cal-title'),navs=[...host.querySelectorAll('.fk-cal-nav')];
      const maxK=()=>typeof o.max==='function'?o.max():o.max;
      const ymOf=k=>k.slice(0,7),minYM=ymOf(o.min),maxYM=ymOf(o.monthMax||maxK());
      const disabled=k=>k<o.min||k>maxK()||(o.isDisabled&&o.isDisabled(k));
      function inRange(k){const a=st.anchor?(st.hover&&st.hover<st.anchor?st.hover:st.anchor):st.from,b=st.anchor?(st.hover&&st.hover>st.anchor?st.hover:st.anchor):st.to;return a&&b&&k>=a&&k<=b;}
      function render(){
        const [y,m]=st.ym.split('-').map(Number),n=mdays(y,m),first=key(y,m,1),lead=wday(first);
        title.textContent=`${y} 年 ${m} 月`;navs[0].disabled=st.ym<=minYM;navs[1].disabled=st.ym>=maxYM;
        let cells=[];for(let i=0;i<lead;i++)cells.push('<td class="pad"></td>');
        for(let d=1;d<=n;d++){const k=key(y,m,d),dis=disabled(k),sel=o.mode==='range'?inRange(k):k===st.value;
          const edge=o.mode==='range'&&(k===(st.anchor||st.from)||(!st.anchor&&k===st.to))?' edge':'';
          cells.push(`<td role="gridcell" data-k="${k}" tabindex="${k===st.focus?0:-1}" aria-selected="${sel}"${dis?' aria-disabled="true"':''} class="${[sel?'sel':'',edge,wday(k)>4?'we':'',k===o.latest?'latest':'',dis?'dis':''].join(' ').trim()}" aria-label="${esc((o.dayLabel?o.dayLabel(k):`${m} 月 ${d} 日 星期${WDN[wday(k)]}`)+(dis&&!o.dayLabel?'，无数据':''))}"><span class="n">${d}</span>${o.dayInner?o.dayInner(k):''}</td>`);}
        while(cells.length%7)cells.push('<td class="pad"></td>');
        let html='';for(let i=0;i<cells.length;i+=7)html+=`<tr>${cells.slice(i,i+7).join('')}</tr>`;tbody.innerHTML=html;
        if(!tbody.querySelector('[tabindex="0"]')){const c=tbody.querySelector('[data-k]:not([aria-disabled])')||tbody.querySelector('[data-k]');if(c){c.tabIndex=0;st.focus=c.dataset.k;}}
      }
      function focusDay(k,move=true){const top=o.monthMax||maxK();k=k<o.min?o.min:k>top?top:k;st.focus=k;if(ymOf(k)!==st.ym){st.ym=ymOf(k);render();o.onMonth&&o.onMonth(st.ym);}
        tbody.querySelectorAll('[data-k]').forEach(c=>c.tabIndex=c.dataset.k===k?0:-1);if(st.anchor){st.hover=k;paintSel();}if(move)tbody.querySelector(`[data-k="${k}"]`)?.focus();}
      function paintSel(){tbody.querySelectorAll('[data-k]').forEach(c=>{const k=c.dataset.k,sel=o.mode==='range'?inRange(k):k===st.value;c.classList.toggle('sel',sel);c.setAttribute('aria-selected',String(sel));
        c.classList.toggle('edge',o.mode==='range'&&(k===(st.anchor||st.from)||(!st.anchor&&k===st.to)));});}
      function pick(k){if(disabled(k))return;
        if(o.mode==='range'){if(!st.anchor){st.anchor=k;st.hover=k;st.from=k;st.to=k;paintSel();o.onPick&&o.onPick({from:k,to:k,done:false});return;}
          const a=st.anchor;st.from=k<a?k:a;st.to=k<a?a:k;st.anchor=null;st.hover=null;paintSel();o.onPick&&o.onPick({from:st.from,to:st.to,done:true});}
        else{st.value=k;paintSel();o.onPick&&o.onPick(k);}}
      tbody.addEventListener('click',e=>{const c=e.target.closest('[data-k]');if(!c)return;focusDay(c.dataset.k,false);pick(c.dataset.k);});
      tbody.addEventListener('pointerover',e=>{const c=e.target.closest('[data-k]');if(c&&st.anchor){st.hover=c.dataset.k;paintSel();}});
      tbody.addEventListener('keydown',e=>{const c=e.target.closest('[data-k]');if(!c)return;const k=c.dataset.k,{y,m,d}=parts(k);let t=null;
        switch(e.key){case 'ArrowLeft':t=addD(k,-1);break;case 'ArrowRight':t=addD(k,1);break;case 'ArrowUp':t=addD(k,-7);break;case 'ArrowDown':t=addD(k,7);break;
          case 'Home':t=addD(k,-wday(k));break;case 'End':t=addD(k,6-wday(k));break;
          case 'PageUp':case 'PageDown':{const dm=(e.key==='PageUp'?-1:1)*(e.shiftKey?12:1);let yy=y,mm=m+dm;while(mm<1){mm+=12;yy--;}while(mm>12){mm-=12;yy++;}t=key(yy,mm,Math.min(d,mdays(yy,mm)));break;}
          case 'Enter':case ' ':e.preventDefault();e.stopPropagation();pick(k);return;default:return;}
        e.preventDefault();e.stopPropagation();focusDay(t);});
      navs.forEach(b=>b.addEventListener('click',()=>{const [y,m]=st.ym.split('-').map(Number),dm=+b.dataset.nav;let yy=y,mm=m+dm;if(mm<1){mm=12;yy--;}if(mm>12){mm=1;yy++;}st.ym=key(yy,mm,1).slice(0,7);
        const f=parts(st.focus);st.focus=key(yy,mm,Math.min(f.d,mdays(yy,mm)));render();o.onMonth&&o.onMonth(st.ym);
        // Focus stays on ‹ / ›, so say the new month through the card's one announcement channel (the readout layer's live region).
        const card=host.closest('.chart-host');if(card)say(card,title.textContent);}));
      render();
      return {render,focusDay,set(v){Object.assign(st,v);if(v.focus)st.ym=ymOf(v.focus);render();},state:st,focus(){tbody.querySelector('[tabindex="0"]')?.focus();}};
    }
    // Searchable multi-select: trigger button + popover (search combobox, select-all checkbox, multi listbox).
    function multi(anchor,o){
      const lb=nid('lb'),sid=nid('ms');
      anchor.classList.add('fk-anchor');
      anchor.innerHTML=`<button type="button" class="fk-field" aria-haspopup="dialog"><span class="k">${o.label}</span><b></b><span class="caret" aria-hidden="true">▾</span></button>
        <div class="fk-pop fk-pop-list" role="dialog" aria-label="${o.label}筛选">
          <div class="fk-search"><span aria-hidden="true">⌕</span><input type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="${lb}" aria-label="搜索${o.label}" placeholder="搜索${o.label}" autocomplete="off" id="${sid}"></div>
          <button type="button" class="fk-opt fk-all" role="checkbox" aria-checked="false"><i class="fk-box" aria-hidden="true"></i>全选<span class="num" data-k="all-n"></span></button>
          <div class="fk-div"></div>
          <div class="fk-list" role="listbox" id="${lb}" aria-multiselectable="true" aria-label="${o.label}"></div>
          <div class="fk-empty-row" hidden>没有匹配的${o.label}</div>
          <div class="fk-foot"><span data-k="count"></span><span class="fk-row"><button type="button" class="fk-btn" data-k="clear">清空</button><button type="button" class="fk-btn primary" data-k="done">完成</button></span></div>
        </div>`;
      const trig=anchor.querySelector('.fk-field'),pane=anchor.querySelector('.fk-pop'),input=pane.querySelector('input'),list=pane.querySelector('.fk-list'),all=pane.querySelector('.fk-all');
      let sel=new Set(o.value||[]),active=-1,order=o.options.map(x=>x.id),shown=[];
      const optById=id=>o.options.find(x=>x.id===id);
      function summary(){const ids=o.options.filter(x=>sel.has(x.id)).map(x=>x.name);return !ids.length?'全部':ids.length===1?ids[0]:`${ids[0]} +${ids.length-1}`;}
      function paintTrigger(){trig.querySelector('b').textContent=summary();trig.setAttribute('aria-label',`${o.label}：${sel.size?[...sel].map(id=>optById(id).name).join('、'):'全部'}，已选 ${sel.size} / ${o.options.length}`);}
      function renderList(){const qv=input.value.trim();shown=order.filter(id=>!qv||optById(id).name.includes(qv));
        list.innerHTML=shown.map((id,i)=>{const x=optById(id);return `<div class="fk-opt" role="option" id="${lb}-${id}" data-id="${id}" aria-selected="${sel.has(id)}"><i class="fk-box${sel.has(id)?' on':''}" aria-hidden="true"></i>${x.name}${x.meta?`<span class="num">${x.meta()}</span>`:''}</div>`;}).join('');
        pane.querySelector('.fk-empty-row').hidden=shown.length>0;if(active>=shown.length)active=shown.length-1;paintActive();paintAll();}
      function paintActive(){list.querySelectorAll('.fk-opt').forEach((el,i)=>el.classList.toggle('active',i===active));const el=list.children[active];
        if(el){input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
      function paintAll(){const n=sel.size,t=o.options.length;all.setAttribute('aria-checked',n===0?'false':n===t?'true':'mixed');all.querySelector('.fk-box').className='fk-box'+(n===t?' on':n?' part':'');
        pane.querySelector('[data-k="all-n"]').textContent=`${t}`;pane.querySelector('[data-k="count"]').textContent=`已选 ${n} / ${t}`;}
      function commit(src){paintTrigger();paintAll();list.querySelectorAll('.fk-opt').forEach(el=>{const v=sel.has(el.dataset.id);el.setAttribute('aria-selected',String(v));el.querySelector('.fk-box').classList.toggle('on',v);});o.onChange&&o.onChange([...sel],src);}
      function flip(id){sel.has(id)?sel.delete(id):sel.add(id);commit('toggle');}
      const P_=pop(trig,pane,{onOpen(){order=[...o.options.filter(x=>sel.has(x.id)),...o.options.filter(x=>!sel.has(x.id))].map(x=>x.id);input.value='';active=0;renderList();input.focus();}});
      trig.addEventListener('click',()=>P_.toggle());
      trig.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();P_.open();}});
      input.addEventListener('input',()=>{active=shown.length?0:-1;renderList();});
      input.addEventListener('keydown',e=>{const n=shown.length;
        if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();active=Math.min(n-1,active+1);paintActive();}
        else if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();active=Math.max(0,active-1);paintActive();}
        else if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();e.stopPropagation();active=e.key==='PageUp'?0:n-1;paintActive();}
        else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(shown[active])flip(shown[active]);}
        else if(e.key==='Escape'&&input.value){e.preventDefault();e.stopPropagation();input.value='';renderList();}
        else if((e.key==='a'||e.key==='A')&&(e.ctrlKey||e.metaKey)&&!input.value){e.preventDefault();e.stopPropagation();sel=new Set(o.options.map(x=>x.id));commit('all');}});
      list.addEventListener('pointerdown',e=>e.preventDefault());
      list.addEventListener('click',e=>{const el=e.target.closest('.fk-opt');if(!el)return;active=[...list.children].indexOf(el);paintActive();flip(el.dataset.id);input.focus();});
      all.addEventListener('click',()=>{sel=sel.size===o.options.length?new Set():new Set(o.options.map(x=>x.id));commit('all');});
      pane.querySelector('[data-k="clear"]').addEventListener('click',()=>{sel.clear();commit('clear');input.focus();});
      pane.querySelector('[data-k="done"]').addEventListener('click',()=>P_.close(true));
      paintTrigger();
      return {get:()=>[...sel],set(v){sel=new Set(v||[]);paintTrigger();if(P_.isOpen)renderList();},pop:P_,trigger:trig,refresh(){if(P_.isOpen)renderList();paintTrigger();}};
    }
    // Applied-condition chips (F07): every chip removable; focus moves to the next chip after removal.
    function applied(host,{items,onRemove,onClear,empty='未设置条件 · 显示全部数据'}){
      host.classList.add('fk-applied');
      host.innerHTML=(items.length?items.map(it=>`<span class="fk-tag${it.dash?' dash':''}" data-id="${it.id}"><span class="t">${it.label}</span><button type="button" class="x" aria-label="移除 ${esc(it.aria||it.label.replace(/<[^>]+>/g,''))}">✕</button></span>`).join('')+`<button type="button" class="fk-btn ghost" data-k="clear">清空全部</button>`:`<span class="fk-none">${empty}</span>`);
      host.querySelectorAll('.fk-tag .x').forEach(x=>x.addEventListener('click',()=>{const tag=x.closest('.fk-tag'),tags=[...host.querySelectorAll('.fk-tag')],i=tags.indexOf(tag),id=tag.dataset.id;
        const hadFocus=document.activeElement===x;onRemove(id);if(!hadFocus)return;requestAnimationFrame(()=>{const xs=[...host.querySelectorAll('.fk-tag .x')];(xs[Math.min(i,xs.length-1)]||host.querySelector('[data-k="clear"]')||host.closest('.chart-host')?.querySelector('[data-focus-home]'))?.focus();});}));
      host.querySelectorAll('.fk-tag').forEach(t=>t.addEventListener('keydown',e=>{if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopPropagation();t.querySelector('.x').click();}}));
      host.querySelector('[data-k="clear"]')?.addEventListener('click',()=>{onClear();requestAnimationFrame(()=>host.closest('.chart-host')?.querySelector('[data-focus-home]')?.focus());});
    }
    return {pop,chips,toggle,cal,multi,applied,current:()=>openPop};
  })();

  /* ---------- 7 · TabKit: tablist / tab / tabpanel, roving focus, auto or manual activation, URL hash ---------- */
  const TK=(()=>{
    function create(list,o){
      let tabs=[...o.tabs],panels=[...o.panels],idx=-1,orient=o.orientation||'horizontal';
      const activation=o.activation||'auto';
      list.setAttribute('role','tablist');
      const ink=o.ink===false?null:(()=>{const i=document.createElement('span');i.className='tk-ink';i.setAttribute('aria-hidden','true');list.appendChild(i);return i;})();
      function wire(){tabs.forEach((t,i)=>{t.setAttribute('role','tab');if(!t.id)t.id=nid('tab');const p=panels[i];if(!p.id)p.id=nid('tp');
        t.setAttribute('aria-controls',p.id);p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',t.id);
        if(!p.querySelector(FOCUSABLE))p.tabIndex=0;else p.removeAttribute('tabindex');});list.setAttribute('aria-orientation',orient);}
      function moveInk(anim=true){if(!ink||idx<0||!tabs[idx])return;const t=tabs[idx];ink.style.transition=anim&&!reduced()?'':'none';
        if(orient==='vertical'){ink.style.width='';ink.style.transform=`translateY(${t.offsetTop}px)`;ink.style.height=t.offsetHeight+'px';}
        else{ink.style.height='';ink.style.transform=`translateX(${t.offsetLeft}px)`;ink.style.width=t.offsetWidth+'px';}
        if(!anim||reduced())requestAnimationFrame(()=>{ink.style.transition='';});}
      function select(i,{focus=false,source='api',silent=false}={}){
        if(!tabs.length)return;i=Math.max(0,Math.min(tabs.length-1,i));const prev=idx,changed=i!==idx;idx=i;
        tabs.forEach((t,j)=>{const on=j===i;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;t.classList.toggle('on',on);panels[j].hidden=!on;});
        if(changed&&prev>=0&&!reduced()){panels[i].classList.remove('tk-enter');void panels[i].offsetWidth;panels[i].classList.add('tk-enter');}
        moveInk(prev>=0);if(focus)tabs[i].focus();if(['key','click','menu'].includes(source))tabs[i].scrollIntoView({block:'nearest',inline:'nearest'});
        if(changed&&o.hashKey&&!silent&&source!=='hash')Hash.set(o.hashKey,o.ids?o.ids(i):i,{push:true});
        if(changed&&o.onSelect&&source!=='init')o.onSelect(i,prev,source);}
      function isVert(){return list.getAttribute('aria-orientation')==='vertical';}
      list.addEventListener('keydown',e=>{const t=e.target.closest('[role="tab"]');if(!t||!list.contains(t))return;const i=tabs.indexOf(t),v=isVert();
        const prev=v?'ArrowUp':'ArrowLeft',next=v?'ArrowDown':'ArrowRight';let j=null;
        if(e.key===prev)j=i-1;else if(e.key===next)j=i+1;else if(e.key==='Home')j=0;else if(e.key==='End')j=tabs.length-1;
        else if((e.key==='Enter'||e.key===' ')&&activation==='manual'){e.preventDefault();e.stopPropagation();select(i,{source:'key'});return;}
        else{if(o.onKey)o.onKey(e,i);return;}
        e.preventDefault();e.stopPropagation();j=(j+tabs.length)%tabs.length;
        if(activation==='auto')select(j,{focus:true,source:'key'});else{tabs[j].focus();tabs[j].scrollIntoView({block:'nearest',inline:'nearest'});}});
      list.addEventListener('click',e=>{const t=e.target.closest('[role="tab"]');if(!t||!list.contains(t))return;select(tabs.indexOf(t),{source:'click'});});
      new ResizeObserver(()=>moveInk(false)).observe(list);
      wire();
      let start=o.selected||0;if(o.hashKey){const h=Hash.get(o.hashKey);if(h!==undefined){const j=o.fromHash?o.fromHash(h):-1;if(j>=0)start=j;}
        Hash.on(o.hashKey,v=>{const j=v===undefined?(o.selected||0):o.fromHash(v);if(j>=0)select(j,{source:'hash'});});}
      select(start,{source:'init',silent:true});
      return {select,index:()=>idx,tabs:()=>tabs,panels:()=>panels,
        setOrientation(v){orient=v;list.setAttribute('aria-orientation',v);moveInk(false);},
        add(t,p){tabs.push(t);panels.push(p);wire();},
        remove(i){const t=tabs.splice(i,1)[0],p=panels.splice(i,1)[0];t.remove();p.remove();const wasSel=i===idx;if(i<idx)idx--;if(wasSel){idx=-1;}return wasSel;},
        refreshInk:()=>moveInk(false)};
    }
    return {create};
  })();

  /* ---------- 8 · TableKit: columns → rows, cell grammar, three-state sort, row actions, pages, five states ---------- */
  const TBK=(()=>{
    const ARROW={none:'↕',descending:'↓',ascending:'↑'};
    function sparkSVG(vals,color='var(--s-blue)',w=62,h=18,rad=2){const lo=Math.min(...vals),hi=Math.max(...vals),x=i=>2+i*(w-4)/(vals.length-1),y=v=>h-3-(v-lo)/((hi-lo)||1)*(h-6);
      return `<svg class="tb-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${vals.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join('')}" fill="none" style="stroke:${color}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="${x(vals.length-1).toFixed(1)}" cy="${y(vals[vals.length-1]).toFixed(1)}" r="${rad}" style="fill:${color}"/></svg>`;}
    function create(host,o){
      const cap=nid('tbc'),root=o.root||host.closest('.chart-host');
      let rows=o.rows||[],sort={by:o.sort?.by||null,dir:o.sort?.dir||null},page=0,action=o.rowAction||'inspect',sel=new Set(),on=new Set(o.filterOn||[]),state='ok',focusKey=null;
      const cols=o.columns,rh=cols.find(c=>c.rowHeader)||cols[0],trs=new Map();
      const groups=o.groups||[],gOf=c=>groups.find(g=>g.cols.includes(c.id));
      host.classList.add('tb-host');
      host.innerHTML=`<div class="tb-stack" data-state="ok">
        <div class="tb-layer" data-layer="data"><div class="tb-stale" hidden>${statusChip('warn')}</div><div class="tb-wrap"><table class="tb ${o.cls||''}"><caption id="${cap}" class="${o.captionVisible?'tb-cap':'sr-only'}">${o.caption}</caption><thead></thead><tbody></tbody><tfoot></tfoot></table></div>
          <div class="tb-pager" hidden><span data-k="info"></span><span class="tb-pages" role="group" aria-label="翻页"></span></div></div>
        <div class="tb-layer" data-layer="loading" aria-hidden="true"><div class="tb-skel-rows"></div></div>
        <div class="tb-layer tb-msg" data-layer="empty" aria-hidden="true"><div class="big">—</div><div class="sub" data-k="empty-text">${o.emptyText||'没有符合条件的行'}</div><div class="tb-exits" data-k="exits"></div></div>
        <div class="tb-layer tb-msg" data-layer="error" aria-hidden="true"><div class="sub">数据源超时（示例）· 已保留上次成功的筛选条件</div><button type="button" class="fk-btn" data-k="retry">重试</button></div></div>`;
      const table=host.querySelector('table'),thead=table.tHead,tbody=table.tBodies[0],tfoot=table.tFoot,wrap=host.querySelector('.tb-wrap'),stack=host.querySelector('.tb-stack'),pager=host.querySelector('.tb-pager');
      if(o.colgroup!==false&&groups.length){const cg=[];if(action==='select')cg.push('<colgroup><col class="c-sel"></colgroup>');let i=0;while(i<cols.length){const g=gOf(cols[i]);if(g){cg.push(`<colgroup span="${g.cols.length}" class="g-${g.tone||'a'}"></colgroup>`);i+=g.cols.length;}else{cg.push('<colgroup><col></colgroup>');i++;}}table.insertAdjacentHTML('afterbegin',cg.join('').replace(/^/,''));table.insertBefore(table.querySelector('caption'),table.firstChild);}
      const hid=c=>`${cap}-${c.id}`,gid=g=>`${cap}-g-${g.id}`;
      // ---- header (one row, or two rows with real colspan groups; decision D6) ----
      function headCell(c,extra=''){const sorted=sort.by===c.id&&sort.dir;
        const inner=c.sortable?`<button type="button" class="tb-sort" data-col="${c.id}">${c.label}<i aria-hidden="true">${ARROW[sorted?sort.dir:'none']}</i></button>`:c.label;
        return `<th scope="col" id="${hid(c)}" class="${[c.num?'num':'',c.type==='bar'?'barcol':'',c.cls||'',gOf(c)?'g g-'+(gOf(c).tone||'a'):'',sorted?'sorted':''].join(' ').trim()}"${sorted?` aria-sort="${sort.dir}"`:''}${extra}>${inner}</th>`;}
      function renderHead(){const two=groups.length>0,selTh=action==='select'?`<th scope="col" class="tb-sel"${two?' rowspan="2"':''}><input type="checkbox" data-k="all" aria-label="全选当前 ${rows.length} 行"></th>`:'';
        if(!two){thead.innerHTML=`<tr>${selTh}${cols.map(c=>headCell(c)).join('')}</tr>`;}
        else{let r1='',r2='',i=0;while(i<cols.length){const c=cols[i],g=gOf(c);if(!g){r1+=headCell(c,' rowspan="2"');i++;continue;}
            r1+=`<th scope="colgroup" colspan="${g.cols.length}" id="${gid(g)}" class="gh g-${g.tone||'a'}">${g.label}</th>`;g.cols.forEach(id=>{r2+=headCell(cols.find(x=>x.id===id));});i+=g.cols.length;}
          thead.innerHTML=`<tr>${selTh}${r1}</tr><tr>${r2}</tr>`;}
        thead.querySelectorAll('.tb-sort').forEach(b=>b.addEventListener('click',()=>cycle(b.dataset.col)));
        const all=thead.querySelector('[data-k="all"]');if(all){all.addEventListener('change',()=>{const keys=rows.map(o.key);if(sel.size===keys.length)sel.clear();else sel=new Set(keys);paintSel();saySel();o.onSelect&&o.onSelect([...sel]);});}
        paintSel();}
      function cycle(id){const next=sort.by!==id||!sort.dir?'descending':sort.dir==='descending'?'ascending':null;sort={by:next?id:null,dir:next};page=0;
        renderHead();renderRows(true);const c=cols.find(x=>x.id===id);say(root,next?`已按${c.label}${next==='descending'?'降序':'升序'}排列`:'已恢复默认顺序');thead.querySelector(`[data-col="${id}"]`)?.focus();o.onSort&&o.onSort({...sort});}
      // ---- values: additive columns are apportioned over the full row set so rows add up to the total (decision: 合计由行派生) ----
      let disp=new Map();
      function computeDisplay(){disp=new Map();cols.forEach(c=>{if(!c.sum)return;const step=c.step||(c.type==='count'?1:.1);const vals=apportion(rows.map(r=>c.value(r)||0),step);rows.forEach((r,i)=>{if(!disp.has(o.key(r)))disp.set(o.key(r),{});disp.get(o.key(r))[c.id]=vals[i];});});}
      const val=(c,r)=>{const d=disp.get(o.key(r));return d&&c.id in d?d[c.id]:c.value?c.value(r):r[c.id];};
      function cell(c,r){const v=val(c,r);
        if(c.render)return c.render(r,v);
        switch(c.type){case 'amount':return W(v);case 'count':return v===null||v===undefined?'—':N(v);case 'yuan':return v?nf(Math.round(v)):'—';case 'rate':return v===null||v===undefined?'—':P(v);
          case 'delta':return deltaHTML(v);case 'status':return statusChip(v);
          case 'bar':{const mx=c.max?c.max(rows):Math.max(...rows.map(x=>Math.abs(val(c,x))||0));const w=mx?Math.abs(v)/mx*100:0;return `<span class="tb-bar${v<0?' neg':''}"><i style="width:${w.toFixed(1)}%"></i></span><span class="tb-barv">${c.label2?c.label2(r,v):P(v)}</span>`;}
          case 'spark':return sparkSVG(v,c.color);default:return v===null||v===undefined?'—':esc(v);}}
      function rowAria(r){return o.rowLabel?o.rowLabel(r):cols.map(c=>`${c.label} ${String(cell(c,r)).replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()}`).join('，');}
      function buildRow(r){const k=o.key(r);let tr=trs.get(k);if(!tr){tr=document.createElement('tr');tr.dataset.key=k;trs.set(k,tr);}
        const rid=`${cap}-r-${String(k).replace(/[^\w-]/g,'_')}`,drill=action==='drill'&&(!o.canDrill||o.canDrill(r)),pressed=on.has(k);
        const hdr=h=>{const g=gOf(h);return [`${rid}`,g?gid(g):'',hid(h)].filter(Boolean).join(' ');};
        let html=action==='select'?`<td class="tb-sel"><input type="checkbox" tabindex="-1" data-k="sel" aria-label="选择 ${esc(String(val(rh,r)).replace(/<[^>]+>/g,''))}"${sel.has(k)?' checked':''}></td>`:'';
        cols.forEach(c=>{const content=cell(c,r);
          if(c===rh){const label=o.rowHeaderHTML?o.rowHeaderHTML(r,content):content;
            const inner=action==='drill'?(drill?`<button type="button" class="tb-go" tabindex="-1" aria-label="下钻：${esc(String(val(rh,r)))}">${label}<i aria-hidden="true">›</i></button>`:label)
              :action==='filter'?`<button type="button" class="tb-go" tabindex="-1" aria-pressed="${pressed}">${label}<i aria-hidden="true">${pressed?'●':'○'}</i></button>`:label;
            html+=`<th scope="row" id="${rid}" class="${['tb-rh',c.cls||''].join(' ').trim()}">${inner}</th>`;}
          else html+=`<td class="${[c.num?'num':'',c.type==='bar'?'barcol':'',c.cls||'',gOf(c)?'g g-'+(gOf(c).tone||'a'):''].join(' ').trim()}"${groups.length?` headers="${hdr(c)}"`:''}>${content}</td>`;});
        tr.innerHTML=html;tr.className=[drill?'can-drill':'',pressed?'is-on':'',sel.has(k)?'is-sel':'',o.rowClass?o.rowClass(r):''].join(' ').trim();
        tr.dataset.metricTarget='true';tr.setAttribute('aria-label',rowAria(r)+(drill?'，Enter 下钻':'')+(action==='filter'?`，${pressed?'已联动':'Enter 联动'}`:''));
        return tr;}
      function ordered(){let list=[...rows];if(sort.by&&sort.dir){const c=cols.find(x=>x.id===sort.by),sv=c.sortValue||(r=>val(c,r)),k=sort.dir==='descending'?-1:1;
          list.sort((a,b)=>{if(c.compare)return c.compare(a,b,sort.dir);const x=sv(a),y=sv(b);if(typeof x==='string'||typeof y==='string')return String(x).localeCompare(String(y),'zh-CN')*k;return ((x??-Infinity)>(y??-Infinity)?1:(x??-Infinity)<(y??-Infinity)?-1:0)*k;});}return list;}
      function renderRows(animate=false){
        const before=animate&&!reduced()?new Map([...tbody.children].map(tr=>[tr,tr.getBoundingClientRect().top])):null;
        const all=ordered(),paged=all.length>(o.pageAt??50),size=o.pageSize||20,pages=paged?Math.ceil(all.length/size):1;page=Math.min(page,pages-1);
        const vis=paged?all.slice(page*size,page*size+size):all;
        const frag=document.createDocumentFragment();vis.forEach(r=>frag.appendChild(buildRow(r)));tbody.replaceChildren(frag);
        const trList=[...tbody.children];if(!trList.some(t=>t.dataset.key===String(focusKey)))focusKey=trList[0]?.dataset.key??null;trList.forEach(t=>t.tabIndex=t.dataset.key===String(focusKey)?0:-1);
        table.classList.toggle('zebra',o.zebra===true||(o.zebra!==false&&vis.length>20&&cols.length>=6));
        // pager
        pager.hidden=!paged;if(paged){pager.querySelector('[data-k="info"]').textContent=`共 ${all.length} 行 · 第 ${page+1} / ${pages} 页 · 每页 ${size} 行`;
          const pg=pager.querySelector('.tb-pages');pg.innerHTML=`<button type="button" class="fk-btn" data-p="${page-1}"${page?'':' disabled'} aria-label="上一页">‹</button>`+Array.from({length:pages},(_,i)=>`<button type="button" class="fk-btn${i===page?' on':''}" data-p="${i}"${i===page?' aria-current="page"':''} aria-label="第 ${i+1} 页">${i+1}</button>`).join('')+`<button type="button" class="fk-btn" data-p="${page+1}"${page<pages-1?'':' disabled'} aria-label="下一页">›</button>`;
          pg.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{page=+b.dataset.p;renderRows();say(root,`第 ${page+1} / ${pages} 页`);}));}
        // total row (derived from the displayed rows, never typed)
        if(o.total){const t=o.total(rows,val);tfoot.innerHTML=t?`<tr class="tb-total">${action==='select'?'<td class="tb-sel"></td>':''}${cols.map(c=>c===rh?`<th scope="row"${groups.length?` id="${cap}-total"`:''}>${t[c.id]??'合计'}</th>`:`<td class="${[c.num?'num':'',c.type==='bar'?'barcol':'',gOf(c)?'g g-'+(gOf(c).tone||'a'):''].join(' ').trim()}"${groups.length?` headers="${cap}-total ${gOf(c)?gid(gOf(c))+' ':''}${hid(c)}"`:''}>${t[c.id]??''}</td>`).join('')}</tr>`:'';}
        if(before){trList.forEach(tr=>{const b=before.get(tr);if(b===undefined)return;const dy=b-tr.getBoundingClientRect().top;if(!dy)return;tr.style.transition='none';tr.style.transform=`translateY(${dy}px)`;});
          tbody.getBoundingClientRect();trList.forEach(tr=>{if(!tr.style.transform)return;tr.style.transition='transform .42s cubic-bezier(.2,.7,.2,1)';tr.style.transform='';});}
        paintSel();scrollable();o.onRender&&o.onRender();}
      function paintSel(){const all=thead.querySelector('[data-k="all"]');if(all){const n=sel.size,t=rows.length;all.checked=n>0&&n===t;all.indeterminate=n>0&&n<t;all.setAttribute('aria-label',`全选当前 ${t} 行（已选 ${n}）`);}
        tbody.querySelectorAll('tr').forEach(tr=>{const s=sel.has(keyOf(tr));tr.classList.toggle('is-sel',s);const cb=tr.querySelector('[data-k="sel"]');if(cb)cb.checked=s;});}
      const saySel=()=>say(root,sel.size?`已选 ${sel.size} 行`:'已取消全部选择');   // ticking a row changes no focus, so say it
      const keyOf=tr=>{const r=rows.find(x=>String(o.key(x))===tr.dataset.key);return r?o.key(r):tr.dataset.key;};
      const rowOf=tr=>rows.find(x=>String(o.key(x))===tr.dataset.key);
      function act(tr,src){const r=rowOf(tr);if(!r)return;const k=o.key(r);
        if(action==='drill'){if(!o.canDrill||o.canDrill(r))o.onDrill&&o.onDrill(r);}
        else if(action==='select'){sel.has(k)?sel.delete(k):sel.add(k);paintSel();saySel();o.onSelect&&o.onSelect([...sel]);}
        else if(action==='filter'){on.has(k)?on.delete(k):on.add(k);buildRow(r);tr.tabIndex=0;if(src==='key')tr.focus();o.onFilter&&o.onFilter([...on],k);}}
      tbody.addEventListener('click',e=>{const tr=e.target.closest('tr');if(!tr||action==='inspect')return;if(e.target.matches('[data-k="sel"]')){e.stopPropagation();}act(tr,'click');});
      tbody.addEventListener('focusin',e=>{const tr=e.target.closest('tr');if(!tr)return;focusKey=tr.dataset.key;[...tbody.children].forEach(t=>t.tabIndex=t===tr?0:-1);});
      tbody.addEventListener('keydown',e=>{const tr=e.target.closest('tr');if(!tr||e.target!==tr)return;const list=[...tbody.children],i=list.indexOf(tr);let j=null;
        if(o.onKey&&o.onKey(e,rowOf(tr),tr)){e.preventDefault();e.stopPropagation();return;}
        switch(e.key){case 'ArrowDown':j=Math.min(list.length-1,i+1);break;case 'ArrowUp':j=Math.max(0,i-1);break;case 'Home':j=0;break;case 'End':j=list.length-1;break;
          case 'PageDown':case 'PageUp':{if(pager.hidden)return;const b=pager.querySelector(`[data-p="${page+(e.key==='PageDown'?1:-1)}"]`);if(b&&!b.disabled){b.click();tbody.firstElementChild?.focus();}e.preventDefault();e.stopPropagation();return;}
          case 'Enter':if(action==='inspect')return;e.preventDefault();e.stopPropagation();act(tr,'key');return;
          case ' ':if(action!=='select'&&action!=='filter')return;e.preventDefault();e.stopPropagation();act(tr,'key');return;default:return;}
        e.preventDefault();e.stopPropagation();list.forEach(t=>t.tabIndex=-1);list[j].tabIndex=0;list[j].focus();});
      // Scroll container is focusable only when it actually scrolls (Adrian Roselli).
      function scrollable(){const s=wrap.scrollWidth>wrap.clientWidth+1;if(s){wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');wrap.setAttribute('aria-labelledby',cap);}else{wrap.removeAttribute('tabindex');wrap.removeAttribute('role');wrap.removeAttribute('aria-labelledby');}wrap.classList.toggle('scrolls',s);}
      new ResizeObserver(scrollable).observe(wrap);
      // five states
      function setState(s){state=s;stack.dataset.state=s;host.querySelectorAll('.tb-layer').forEach(l=>{const vis=l.dataset.layer===(s==='stale'||s==='ok'?'data':s);l.setAttribute('aria-hidden',String(!vis));l.inert=!vis;});
        host.querySelector('.tb-stale').hidden=s!=='stale';if(s==='stale')host.querySelector('.tb-stale').innerHTML=`<span class="kpi-chip warn"><i aria-hidden="true">!</i>数据延迟 8 小时</span><span>上次更新 9/23 01:30 · 数值照常显示</span>`;
        if(s==='loading'){const n=Math.max(3,Math.min(o.pageSize||20,tbody.children.length||6));host.querySelector('.tb-skel-rows').innerHTML=Array.from({length:n},(_,i)=>`<i style="width:${[92,78,86,70,88,74][i%6]}%"></i>`).join('');}}
      host.querySelector('[data-k="retry"]').addEventListener('click',()=>{setState('loading');setTimeout(()=>setState('ok'),900);o.onRetry&&o.onRetry();});
      function setExits(list){const box=host.querySelector('[data-k="exits"]');box.innerHTML=list.map((x,i)=>`<button type="button" class="fk-btn" data-i="${i}">${x.label}</button>`).join('');box.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>list[+b.dataset.i].run()));}
      function update(next,{animate=false,keepPage=false}={}){rows=next;if(!keepPage)page=0;const keys=new Set(rows.map(o.key));sel=new Set([...sel].filter(k=>keys.has(k)));computeDisplay();renderRows(animate);if(!rows.length&&state==='ok')setState('empty');else if(rows.length&&state==='empty')setState('ok');}
      function setAction(a){action=a;sel.clear();host.querySelectorAll('colgroup').forEach(c=>c.remove());if(groups.length&&o.colgroup!==false){/* rebuild colgroups with/without select column */const cg=[];if(a==='select')cg.push('<colgroup><col class="c-sel"></colgroup>');let i=0;while(i<cols.length){const g=gOf(cols[i]);if(g){cg.push(`<colgroup span="${g.cols.length}" class="g-${g.tone||'a'}"></colgroup>`);i+=g.cols.length;}else{cg.push('<colgroup><col></colgroup>');i++;}}table.querySelector('caption').insertAdjacentHTML('afterend',cg.join(''));}
        trs.clear();renderHead();renderRows();table.dataset.action=a;}
      computeDisplay();renderHead();renderRows();table.dataset.action=action;setState('ok');
      return {el:table,host,update,setAction,setState,setExits,sort:()=>({...sort}),setSort(s){sort={by:s?.by||null,dir:s?.dir||null};renderHead();renderRows();},
        selected:()=>[...sel],setFilterOn(k){on=new Set(k);renderRows();},rows:()=>rows,
        lookup(el){if(el.tagName!=='TR'||!tbody.contains(el))return null;const r=rowOf(el);return r?{el,read:()=>o.read?o.read(r):null}:null;},
        reset(){sort={by:o.sort?.by||null,dir:o.sort?.dir||null};page=0;sel.clear();on=new Set(o.filterOn||[]);setState('ok');renderHead();renderRows();}};
    }
    return {create,sparkSVG};
  })();
  // One inspector lookup for several dynamic sources (tables, lists).
  const lookups=(...fns)=>el=>{for(const f of fns){const d=f(el);if(d)return d;}return null;};
  window.FilterKit=FK;window.TabKit=TK;window.TableKit=TBK;
