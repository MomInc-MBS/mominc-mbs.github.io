# Television sound

The shared `/tv/` shell plays quiet CRT hiss after a visitor gesture, recorded switch/click sounds for cabinet keys and the channel dial, static for accepted glass presses, and a soft bloop for ordinary digital buttons and links. The cabinet's MUTE key persists its setting. Same-origin website frames receive digital button sounds; known game frames keep their own audio. The engine limits simultaneous voices, throttles repeated cues, and stops on hide or navigation. Back/forward restoration keeps it usable.

Six small MP3s are CC0: two mechanical clicks from qubodup, two switches from Kenney, and two original renders for static and bloop. Source links are in [audio/credits.html](audio/credits.html). All six files and `sound.js` are in the generated offline game packs.

Validation: `node --test tools/tv_sound.test.mjs` passed 5 cases; the real Edge/Playwright test `tools/tv_sound.browser.test.mjs` passed physical/digital playback, keyboard knob press, mute, 320/375 px fit, and Back playback; `node --test tools/check_game_loading.test.mjs` passed 20 cases after `python tools/gen_game_packs.py`.
