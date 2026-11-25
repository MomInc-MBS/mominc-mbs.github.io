// Cloudflare Worker entry: HTTP API + a once-a-minute cron that materialises occurrences and sends pushes.
import {handle} from './api.mjs';
import {runCron} from './core.mjs';
import {sendPush} from './webpush.mjs';

export default {
  fetch: (request, env) => handle(request, env, env.DB),
  scheduled: (event, env, ctx) => {
    const vapid = {public: env.VAPID_PUBLIC, private: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT};
    ctx.waitUntil(runCron(env.DB, Date.now(), {
      publicOrigin: env.PUBLIC_ORIGIN,
      send: (sub, payload, opts) => sendPush(sub, payload, vapid, opts),
      sleep: ms => new Promise(r => setTimeout(r, ms)),
    }));
  },
};
