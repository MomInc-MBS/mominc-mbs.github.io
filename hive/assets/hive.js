(() => {
  'use strict';
  const menu = document.querySelector('.menu-button');
  const nav = document.getElementById('mobile-nav');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.hidden = !open;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav && !nav.hidden) {
      nav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.focus();
    }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !e.target.isContentEditable) {
      e.preventDefault();
      const query = document.getElementById('query');
      if (query) query.focus(); else location.href = '/hive/search/';
    }
  });
  let toastTimer;
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3500);
  }
  document.querySelector('.copy-link')?.addEventListener('click', async e => {
    const button = e.currentTarget;
    const reference = `${button.dataset.title} [${button.dataset.id}] — ${button.dataset.series || 'HIVE framework 0.2'}\n${document.querySelector('link[rel=canonical]').href}${location.hash}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(reference);
      else {
        const field = document.createElement('textarea'); field.value = reference;
        field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field);
        field.select(); const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('Copy unavailable');
      }
      toast('Reference copied');
    } catch { toast('Copy unavailable. Use the page URL to reference this note.'); }
  });
  document.querySelector('.print-page')?.addEventListener('click', () => window.print());
  const formulas = [...document.querySelectorAll('pre > code.language-math')];
  if (formulas.length) {
    const style = document.createElement('link');
    style.rel = 'stylesheet'; style.href = '/hive/assets/vendor/katex/katex.min.css';
    document.head.append(style);
    const script = document.createElement('script');
    script.src = '/hive/assets/vendor/katex/katex.min.js';
    script.onload = () => {
      formulas.forEach(code => {
        const figure = document.createElement('figure'); figure.className = 'rendered-formula';
        const view = document.createElement('div'); view.className = 'formula-view';
        try {
          katex.render(code.textContent, view, {displayMode:true,throwOnError:true,trust:false,strict:'error'});
          const source = document.createElement('details');
          const title = document.createElement('summary'); title.textContent = 'Formula source'; source.append(title);
          const pre = code.parentElement; pre.replaceWith(figure); source.append(pre); figure.append(view,source);
        } catch { /* Preserve the readable source if typesetting is unavailable. */ }
      });
    };
    document.head.append(script);
  }
  const diagrams = [...document.querySelectorAll('pre > code.language-mermaid')];
  if (diagrams.length) {
    const script = document.createElement('script');
    script.src = '/hive/assets/vendor/mermaid.min.js';
    script.onload = async () => {
      mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',fontFamily:'"JetBrains Mono", ui-monospace, monospace',themeVariables:{darkMode:true,background:'#0b0704',primaryColor:'#140a04',primaryTextColor:'#ffdcbc',primaryBorderColor:'#ff5f0f',lineColor:'#ff7a2e',secondaryColor:'#1c0d04',secondaryTextColor:'#ffdcbc',tertiaryColor:'#0b0704',tertiaryTextColor:'#ffdcbc',textColor:'#ffdcbc',edgeLabelBackground:'#0b0704',clusterBkg:'#0b0704',clusterBorder:'#5c2808',fontSize:'16px'},flowchart:{htmlLabels:false,useMaxWidth:true},state:{useMaxWidth:true}});
      for (let i=0; i<diagrams.length; i++) {
        const code = diagrams[i], pre = code.parentElement;
        const figure = document.createElement('figure'); figure.className='rendered-diagram';
        const view = document.createElement('div'); view.className='diagram-view';
        try {
          const result = await mermaid.render(`hive-diagram-${i}`,code.textContent);
          view.innerHTML=result.svg;
          const detail=document.createElement('details');
          const summary=document.createElement('summary');summary.textContent='Diagram source';detail.append(summary);
          pre.replaceWith(figure);detail.append(pre);figure.append(view,detail);
        } catch { figure.remove(); /* The original source remains readable on failure. */ }
      }
    };
    document.head.append(script);
  }
})();
