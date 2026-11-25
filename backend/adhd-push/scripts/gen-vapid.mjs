// node scripts/gen-vapid.mjs  -> prints a VAPID key pair. Put the private half in `wrangler secret put VAPID_PRIVATE`.
const k = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign']);
const b = x => Buffer.from(x).toString('base64url');
console.log('VAPID_PUBLIC=' + b(await crypto.subtle.exportKey('raw', k.publicKey)));
console.log('VAPID_PRIVATE=' + (await crypto.subtle.exportKey('jwk', k.privateKey)).d + '   <- secret, never commit');
