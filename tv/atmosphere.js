/* Quiet room tone for public standalone scenes. Never starts without a click.
   Generated locally: no external media request, permissions, or access-state changes. */
(() => {
  const rotation = document.querySelector('.rotate-notice');
  if (rotation) {
    const portrait = matchMedia('(max-width:950px) and (orientation:portrait)');
    const stage = document.querySelector('.stage');
    const update = () => {
      const blocked = portrait.matches && !document.documentElement.classList.contains('portrait-allowed');
      if (stage) stage.inert = blocked;
      rotation.setAttribute('aria-hidden', String(!blocked));
    };
    portrait.addEventListener('change', update);
    document.querySelector('#portraitContinue').addEventListener('click', () => {
      document.documentElement.classList.add('portrait-allowed'); update();
      document.querySelector('.exit')?.focus();
    });
    update();
  }
  let audio, gain, oscillator, second, enabled = false;
  window.MBS_ATMOSPHERE = {mount(host,slug) {
    if ((slug === 'djscratch'&&document.documentElement.dataset.game) || document.querySelector('.ambience-toggle')) return;
    const rail = document.querySelector('.rail')||document.querySelector('#ctlrow')||document.querySelector('main footer'); if (!rail) return;
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'ambience-toggle'; button.textContent = 'Room sound: off';
    button.setAttribute('aria-pressed','false'); rail.appendChild(button);
    button.addEventListener('click', async () => {
      try {
        if (!audio) {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) throw new Error('unsupported');
          audio = new Audio(); gain = audio.createGain(); gain.gain.value=0;
          gain.connect(audio.destination);
          oscillator=audio.createOscillator(); second=audio.createOscillator();
          const frequency={lilboyfriend:65.4,corgi:60,girlfriend:82.4,fuel:98}[slug]||65.4;
          oscillator.type='sine'; oscillator.frequency.value=frequency;
          second.type='sine'; second.frequency.value=frequency*1.502;
          oscillator.connect(gain);second.connect(gain);oscillator.start();second.start();
        }
        enabled=!enabled; await audio.resume();
        gain.gain.setTargetAtTime(enabled?.012:0,audio.currentTime,.35);
        button.textContent='Room sound: '+(enabled?'on':'off');
        button.setAttribute('aria-pressed',String(enabled));
      } catch {enabled=false;button.textContent='Room sound unavailable';button.disabled=true;}
    });
    const autoStart=e=>{if(!audio&&e.target!==button)button.click();};
    document.addEventListener('pointerdown',autoStart,{once:true});
    document.addEventListener('keydown',autoStart,{once:true});
    document.addEventListener('visibilitychange',()=>{
      if (!audio) return;
      if(document.hidden) audio.suspend(); else if(enabled) audio.resume().catch(()=>{});
    });
    window.addEventListener('pagehide',()=>{if(audio)audio.suspend();});
    window.addEventListener('pageshow',()=>{if(audio&&enabled&&!document.hidden)audio.resume().catch(()=>{});});
  }};
  if(document.body.dataset.slug&&!document.documentElement.dataset.game)window.MBS_ATMOSPHERE.mount(document.body,document.body.dataset.slug);
  if(document.querySelector('#tv'))window.MBS_ATMOSPHERE.mount(document.body,new URLSearchParams(location.search).get('ch')||'mominc');
})();
