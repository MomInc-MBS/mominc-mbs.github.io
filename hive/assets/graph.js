(() => {
  'use strict';
  const svg = document.getElementById('research-graph');
  const pages = document.getElementById('graph-pages');
  const selection = document.getElementById('graph-selection');
  const summary = document.getElementById('graph-summary');
  const query = document.getElementById('graph-query');
  const relation = document.getElementById('relation-filter');
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const palette=['#ff5f0f','#ffb347','#ff7a1a','#ffd27a','#e04800','#ff9a3c','#c43d00','#ffc46b','#ff6a2b','#f2a65a','#b83200','#ffdd99','#ff8c42','#d9772b','#ff4500','#ffe0b0'];
  let data, byId, focus = new URLSearchParams(location.search).get('focus') || '';
  function draw() {
    const selected = byId.get(focus);
    if (!selected) focus='';
    const edges = data.edges.filter(e => !relation.value || e.relation === relation.value);
    const neighbors = new Set(focus ? [focus] : data.nodes.map(n=>n.id));
    if (focus) edges.filter(e=>e.source===focus || e.target===focus).forEach(e=>{neighbors.add(e.source);neighbors.add(e.target);});
    const words = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = n => words.every(w => `${n.id} ${n.title}`.toLowerCase().includes(w));
    const visible = data.nodes.filter(n=>neighbors.has(n.id) && (n.id===focus || matches(n)));
    const shown = new Set(visible.map(n=>n.id));
    const shownEdges = edges.filter(e=>shown.has(e.source)&&shown.has(e.target)&&(!focus||e.source===focus||e.target===focus));
    const groups = [...new Set(data.nodes.map(n=>n.type))];
    const color = type => palette[groups.indexOf(type) % palette.length];
    const positions = new Map();
    let clusters = '';
    if (focus) {
      const rest=visible.filter(n=>n.id!==focus);
      positions.set(focus,{x:500,y:370});
      rest.forEach((n,i)=>{
        const angle=i/Math.max(rest.length,1)*Math.PI*2-Math.PI/2;
        const radius=rest.length>30 ? (i%2?285:185) : 265;
        positions.set(n.id,{x:500+Math.cos(angle)*radius*1.25,y:370+Math.sin(angle)*radius});
      });
    } else {
      groups.forEach((group,g)=>{
        const cx=135+(g%4)*243, cy=110+Math.floor(g/4)*180;
        clusters+=`<text class="graph-cluster-title" x="${cx}" y="${cy-72}" text-anchor="middle">${esc(group.replaceAll('_',' '))}</text>`;
        const list=visible.filter(n=>n.type===group);
        list.forEach((n,i)=>{
          const a=i*2.399963229728653, r=11+Math.sqrt(i/Math.max(list.length-1,1))*60;
          positions.set(n.id,{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r});
        });
      });
    }
    let markup = shownEdges.map(e=>{
      const a=positions.get(e.source),b=positions.get(e.target);
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><title>${esc(e.source+' '+e.relation+' '+e.target)}</title></line>`;
    }).join('') + clusters;
    markup+=visible.map(n=>{
      const p=positions.get(n.id),isFocus=n.id===focus;
      return `<g><circle data-id="${esc(n.id)}" cx="${p.x}" cy="${p.y}" r="${isFocus?15:focus?8:4.5}" fill="${color(n.type)}" class="${isFocus?'selected-node':''}"><title>${esc(n.id+': '+n.title)}</title></circle>${focus && visible.length<45?`<text x="${p.x}" y="${p.y+25}" text-anchor="middle">${esc(n.id)}</text>`:''}</g>`;
    }).join('');
    svg.innerHTML=markup;
    summary.textContent=`${visible.length} pages · ${shownEdges.length.toLocaleString()} ${focus?'direct':'visible'} connections`;
    if (selected) {
      selection.innerHTML=`<span class="badge">${esc(selected.id)}</span><h2>${esc(selected.title)}</h2><p>${esc(selected.evidence_status.replaceAll('_',' '))}</p><a class="button dark" href="${selected.url}">Read this page</a><button class="clear-selection">Clear selection</button>`;
      selection.querySelector('button').addEventListener('click',()=>{focus='';draw();});
    } else selection.innerHTML='<p>Select a node or a page below. Color groups page types; lines retain the source graph’s relationship labels.</p>';
    pages.innerHTML=visible.map(n=>{
      const connections=focus?shownEdges.filter(e=>(e.source===n.id&&e.target===focus)||(e.target===n.id&&e.source===focus)).map(e=>`${e.source} ${e.relation.replaceAll('_',' ')} ${e.target}`):[];
      return `<button data-id="${esc(n.id)}" aria-pressed="${n.id===focus}"><small>${esc(n.id)} · ${esc(n.type.replaceAll('_',' '))}</small>${esc(n.title)}${connections.length?`<small>${esc(connections.join('; '))}</small>`:''}</button>`;
    }).join('');
    document.getElementById('graph-legend').innerHTML=groups.filter(t=>visible.some(n=>n.type===t)).map(t=>`<span><i style="background:${color(t)}"></i>${esc(t.replaceAll('_',' '))}</span>`).join('');
    const p = new URLSearchParams(); if(focus)p.set('focus',focus);
    if(relation.value)p.set('relation',relation.value);
    history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():''));
  }
  const select=e=>{const target=e.target.closest('[data-id]');if(target){focus=target.dataset.id;query.value='';draw();}};
  pages.addEventListener('click',select);svg.addEventListener('click',select);
  query.addEventListener('input',()=>{if(data)draw();});relation.addEventListener('change',()=>{if(data)draw();});
  document.getElementById('graph-reset').addEventListener('click',()=>{focus='';query.value='';relation.value='';if(data)draw();});
  window.addEventListener('popstate',()=>{focus=new URLSearchParams(location.search).get('focus')||'';if(data)draw();});
  relation.value=new URLSearchParams(location.search).get('relation')||'';
  fetch('/hive/graph.json').then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
    .then(graph=>{data=graph;byId=new Map(data.nodes.map(n=>[n.id,n]));draw();})
    .catch(()=>{summary.innerHTML='The graph could not load. <a href="/hive/explore/">Browse all pages</a> or reload to try again.';});
})();
