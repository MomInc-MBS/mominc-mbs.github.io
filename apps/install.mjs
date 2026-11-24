// Install help for MOM Inc apps. Adapted from MYR5 Coach install.mjs (coach-app @ f1b6b5d):
// same iOS/Android/desktop manual steps, beforeinstallprompt and appinstalled handling,
// minus the Coach-specific handoff. appinstalled is a hint, not proof, and never gates play.
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export function setupInstall({button, status, list, iosHelp, name}) {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  let prompt = null;
  const steps = ios
    ? ['Tap Share, then Add to Home Screen.', 'Leave Open as Web App on if shown, then tap Add.', `Open the ${name} icon on your home screen.`]
    : android
      ? ['Open the ⋮ menu and tap Install app or Add to Home screen.', `Confirm, then open ${name} from your home screen.`]
      : ['Use your browser’s install icon beside the address bar, or its Install app menu item.', `Open ${name} from your apps.`];
  list.replaceChildren(...steps.map(text => Object.assign(document.createElement('li'), {textContent: text})));
  if (iosHelp) iosHelp.hidden = !ios;
  const done = () => { prompt = null; button.hidden = true; status.textContent = 'Installed. Open it from your home screen.'; };
  if (isStandalone()) { done(); status.textContent = 'Running as an installed app.'; return; }
  addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt = event; });
  addEventListener('appinstalled', done);
  button.onclick = async () => {
    if (!prompt) { status.textContent = 'Follow the steps below to add it.'; return; }
    const current = prompt; prompt = null;
    try {
      await current.prompt();
      if ((await current.userChoice).outcome === 'accepted') done(); else status.textContent = 'Install cancelled.';
    } catch { status.textContent = 'Follow the steps below to add it.'; }
  };
}
