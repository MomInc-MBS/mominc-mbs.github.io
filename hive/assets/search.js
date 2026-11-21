(() => {
  'use strict';
  const form = document.getElementById('vault-search');
  const query = document.getElementById('query');
  const type = document.getElementById('type-filter');
  const evidence = document.getElementById('evidence-filter');
  const results = document.getElementById('results');
  const count = document.getElementById('result-count');
  const params = new URLSearchParams(location.search);
  let records, timeout;
  const titles = {
    research_path:'Research path',frontier_path:'Frontier path',legacy_catalog_entry:'Legacy catalog',historical_source:'Source history',prior_method:'Prior method',source:'Primary source',build:'Local build',
    historical_import_not_reverified:'Historical import · not reverified',primary_source_reviewed:'Primary source reviewed',design_proposal:'Design proposal',preserved_original:'Preserved original',prior_artifact_reviewed:'Prior artifact reviewed',primary_observation_linked:'Primary observation linked',scoped_claim_with_links:'Scoped claim with links',artifact_checks:'Artifact checks',proposed_implementation:'Proposed implementation'
  };
  const label = s => titles[s] || s.replaceAll('_',' ').replace(/^./, c => c.toUpperCase());
  titles.research_synthesis_and_provisional_decision = 'Research synthesis · Provisional decision';
  const esc = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function snippet(record, words) {
    let offset = words.length ? record.text.toLowerCase().indexOf(words[0]) : 0;
    offset = Math.max(0, offset - 55);
    let sample = record.text.slice(offset, offset + 220);
    const parts = sample.split(/(\s+)/);
    sample = parts.map(part => words.some(word => part.toLowerCase().includes(word)) ? `<mark>${esc(part)}</mark>` : esc(part)).join('');
    return (offset ? '…' : '') + sample + (offset + 220 < record.text.length ? '…' : '');
  }
  function syncUrl() {
    const p = new URLSearchParams();
    if (query.value.trim()) p.set('q', query.value.trim());
    if (type.value) p.set('type', type.value);
    if (evidence.value) p.set('evidence', evidence.value);
    history.replaceState(null,'',location.pathname + (p.size ? '?' + p.toString() : ''));
  }
  function filter() {
    if (!records) return;
    const words = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const scored = records.filter(r => (!type.value || r.type === type.value) && (!evidence.value || r.evidence_status === evidence.value))
      .map(r => {
        const text = `${r.id} ${r.title} ${r.tags.join(' ')} ${r.text}`.toLowerCase();
        if (!words.every(w => text.includes(w))) return null;
        const rank = words.reduce((n,w) => n + (r.id.toLowerCase() === w ? 100 : 0) + (r.title.toLowerCase().includes(w) ? 15 : 0), 0);
        return {r,rank};
      }).filter(Boolean).sort((a,b) => b.rank - a.rank);
    count.textContent = `${scored.length} ${scored.length === 1 ? 'page' : 'pages'}${words.length ? ` matching “${query.value.trim()}”` : ' in this view'}`;
    results.innerHTML = scored.length ? scored.map(({r}) => `<a class="result" href="${r.url}"><div class="result-meta"><span>${esc(r.id)}</span><span>${esc(label(r.type))}</span></div><h2>${esc(r.title)}</h2><p>${snippet(r,words)}</p><span class="badge">${esc(label(r.evidence_status))}</span></a>`).join('')
      : '<div class="empty-results"><h2>No matching pages</h2><p>Try a broader phrase or clear a filter. Page IDs such as P02 and E04 work too.</p></div>';
    syncUrl();
  }
  function loadParams() {
    const p = new URLSearchParams(location.search);
    query.value = p.get('q') || ''; type.value = p.get('type') || ''; evidence.value = p.get('evidence') || '';
  }
  loadParams();
  query.addEventListener('input', () => {clearTimeout(timeout); timeout = setTimeout(filter, 150);});
  type.addEventListener('change', filter); evidence.addEventListener('change', filter);
  form.addEventListener('submit',e => {e.preventDefault(); filter();});
  form.addEventListener('reset', () => setTimeout(() => {query.value='';type.value='';evidence.value='';filter();},0));
  window.addEventListener('popstate', () => {loadParams();filter();});
  fetch('/hive/search-index.json').then(r => {if(!r.ok)throw new Error(r.status);return r.json();})
    .then(data => {records=data;filter();})
    .catch(() => {const el=document.getElementById('search-error');el.hidden=false;el.textContent='Search could not load. All pages remain listed below; reload to try again.';});
})();
