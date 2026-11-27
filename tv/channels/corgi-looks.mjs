// Cortisol Corgi appearance system: 100 cosmetic looks, drawn in code from 15 shared families.
// A look = one coat recipe (base + mark + pattern), ONE skin colour (nose leather AND every pad) and a claw colour.
// Cosmetic only: no look changes health, speed, reach, collision, progression or vision.
// applyLook(root, look) sets CSS vars on the #cc element and (re)draws the nose, both walking paws and the locker grip paw.
// Pure strings + a few DOM writes; nothing here runs per frame. The story page never calls it (its static markup stays as is).
export const DEFAULT_LOOK = 'animal_001';

// ---- the catalogue: [id, name, group, family, pattern, base, mark, skin, mark2?]. Claws are picked for contrast below.
const ROWS = `
001|Original corgi|dog|corgi|solid|#caa06a|#f1e6cf|#2a1a10
002|Cardigan corgi, brindle|dog|corgi|brindle|#9a6a3c|#2e1c10|#2a1a10
003|Labrador, black|dog|short-canine|solid|#232120|#3a3633|#141010
004|Labrador, chocolate|dog|short-canine|solid|#5a3a28|#6d4a36|#3a2218
005|Labrador, yellow|dog|short-canine|solid|#dcc08a|#efd9a8|#3a2a22
006|Golden retriever|dog|shaggy-canine|solid|#c8923e|#e0b567|#1f1612
007|German shepherd, black and tan|dog|long-canine|mask|#b9803c|#1f1812|#111010
008|White shepherd, ivory|dog|long-canine|solid|#efe6d2|#fbf6ea|#2a2220
009|Border collie|dog|long-canine|tuxedo|#1e1c1b|#f4efe4|#1a1514
010|Rough collie, sable and white|dog|shaggy-canine|tuxedo|#b06a2c|#f5eee0|#1a1412
011|Sheltie, tricolor|dog|shaggy-canine|tricolor|#1f1c1a|#f2ece0|#151110|#b4682f
012|Australian shepherd, blue merle|dog|long-canine|merle|#8d9aa8|#2f3540|#3a2f33
013|Australian shepherd, red merle|dog|long-canine|merle|#b98a76|#6b3b30|#8a4f48
014|Husky, gray and white|dog|long-canine|tuxedo|#7d8590|#f3f3f0|#1c1c1e
015|Malamute, charcoal and white|dog|shaggy-canine|tuxedo|#3d4044|#f0efea|#17171a
016|Samoyed|dog|shaggy-canine|solid|#f6f3ea|#ffffff|#25201f
017|Shiba, red and cream|dog|small-canine|tuxedo|#c9722f|#f6e8cf|#1e1512
018|Akita, sesame and cream|dog|broad-canine|tuxedo|#a8794b|#f1e4c8|#1b1412
019|Beagle, tricolor|dog|short-canine|tricolor|#b8763a|#fbf6ea|#1a1311|#2d1f17
020|Basset hound, tan and white|dog|long-canine|tuxedo|#c58c4e|#f5eddc|#2a1b15
021|Bloodhound, russet|dog|broad-canine|solid|#a8582e|#c47a4a|#2a1812
022|Dachshund, black and tan|dog|long-canine|socks|#1b1512|#b0652e|#100b09
023|Doberman, black and rust|dog|short-canine|socks|#17130f|#a14b25|#0f0c0a
024|Rottweiler, black and tan|dog|broad-canine|socks|#1a1512|#b3722e|#0f0c0a
025|Boxer, fawn and white|dog|short-canine|tuxedo|#c08a4e|#f8f2e6|#2a1d18
026|Bulldog, fawn and white|dog|broad-canine|tuxedo|#d6a46a|#f9f3e6|#3b2a26
027|French bulldog, brindle|dog|short-canine|brindle|#4a3526|#1b130e|#1a1210
028|Boston terrier, tuxedo|dog|short-canine|tuxedo|#1d1a19|#f6f1e6|#141010
029|Pug, fawn with dark muzzle|dog|short-canine|mask|#d3a56b|#2a201a|#17110e
030|Great Dane, blue gray|dog|long-canine|solid|#7b8794|#9aa6b3|#2a2a2e
031|Mastiff, apricot with dark muzzle|dog|broad-canine|mask|#d9a572|#35261d|#17110e
032|Saint Bernard, red and white|dog|broad-canine|tuxedo|#a6482c|#f7efe2|#1d1411
033|Bernese mountain dog, tricolor|dog|shaggy-canine|tricolor|#1b1816|#f4efe4|#120f0e|#b4672b
034|Newfoundland, black|dog|shaggy-canine|solid|#1c1a1b|#2f2c2e|#101010
035|Dalmatian, black spots on white|dog|short-canine|spots|#f6f2e8|#1d1a18|#2a1f1c
036|Poodle, apricot curls|dog|small-canine|curls|#d99b64|#eab98a|#1f1511
037|Schnauzer, salt and pepper|dog|small-canine|merle|#8f9096|#3c3d42|#15110f
038|West Highland terrier|dog|small-canine|solid|#f8f5ee|#ffffff|#1b1514
039|Chihuahua, cream|dog|small-canine|solid|#ecd2a6|#f7e4c0|#3a2822
040|Greyhound, brindle|dog|long-canine|brindle|#9a7a58|#3a2b20|#1c1514
041|Gray wolf, silver and charcoal|wild canid|wolf|frosted|#5e6165|#c4c8cc|#161416
042|Arctic wolf, white|wild canid|wolf|solid|#f4f4f0|#ffffff|#1f1d1d
043|Black wolf, charcoal|wild canid|wolf|solid|#202022|#34343a|#0f0f10
044|Timber wolf, brown and gray|wild canid|wolf|frosted|#6b5646|#a9a49a|#1a1514
045|Red wolf, cinnamon|wild canid|wolf|dark-feet|#b4673a|#4a2c1c|#1f1411
046|Coyote, tan and gray|wild canid|wolf|frosted|#b49a76|#7d7f80|#1a1513
047|Red fox, orange with dark feet|wild canid|fox|dark-feet|#d2641f|#2a1a14|#130d0b
048|Arctic fox, white|wild canid|fox|solid|#f7f8f8|#ffffff|#232022
049|Fennec fox, pale sand|wild canid|fox|solid|#ebd2a2|#f6e4bf|#3a2722
050|African wild dog, patches|wild canid|short-canine|patches|#1f1b18|#d6a23a|#131010|#f4efe0
051|Black shorthair|cat|short-cat|solid|#1e1d22|#2f2e35|#17141a
052|White shorthair|cat|short-cat|solid|#f6f4f0|#ffffff|#e8a5a8
053|Orange tabby|cat|short-cat|tabby|#d9843a|#a8541c|#e59a90
054|Brown tabby|cat|short-cat|tabby|#8b6a47|#3b2a1c|#8a5648
055|Silver tabby|cat|short-cat|tabby|#b9bcc2|#52565e|#c78b88
056|Tuxedo cat|cat|short-cat|tuxedo|#1d1b1e|#f6f2ea|#d48f92
057|Calico|cat|short-cat|patches|#f4eee2|#d8802f|#e2a09c|#26211f
058|Tortoiseshell|cat|short-cat|patches|#2a2220|#c1682a|#8a5a52|#7a4b2a
059|Siamese, seal point|cat|short-cat|points|#e9dbbf|#4a3329|#5a3b36
060|Siamese, blue point|cat|short-cat|points|#eee8dc|#7f8a99|#8c8f98
061|Ragdoll, bicolor|cat|shaggy-cat|tuxedo|#cbbba7|#fbf8f1|#d9a39c
062|Maine coon, brown tabby|cat|shaggy-cat|tabby|#7f5e3e|#2f2218|#7c4a40
063|Norwegian forest cat, gray tabby|cat|shaggy-cat|tabby|#8d8f92|#3c3e43|#b98a86
064|Persian, cream|cat|broad-cat|solid|#f1dcb0|#faecc9|#d8938e
065|British shorthair, blue|cat|broad-cat|solid|#7e8794|#99a2af|#8c8590
066|Russian blue, silver blue|cat|short-cat|solid|#8f9bac|#aab5c4|#6f6f7d
067|Bengal, warm rosettes|cat|short-cat|rosettes|#d39a52|#6a3b1a|#8a4a40
068|Savannah, pale spotted|cat|short-cat|spots|#d5b37d|#3a291c|#5b3a32
069|Sphynx, pink skin|cat|hairless-cat|solid|#e8b4a6|#f3c8bb|#cf7a80
070|Scottish fold, silver and white|cat|short-cat|tuxedo|#aeb2b9|#f6f6f6|#d49a9c
071|Lion, tawny|wild cat|big-cat|mask|#c9964f|#5a3a1c|#3a2a26
072|Lioness, pale sand|wild cat|big-cat|solid|#e0c392|#efd9b0|#8a5a52
073|Tiger, orange stripes|wild cat|big-cat|stripes|#e08a2e|#1c130d|#c07872
074|White tiger, charcoal stripes|wild cat|big-cat|stripes|#f3efe6|#3b3d44|#d79a9a
075|Leopard, golden rosettes|wild cat|big-cat|rosettes|#d8a04a|#3b2615|#2c1f1c
076|Snow leopard, gray rosettes|wild cat|big-cat|rosettes|#cfd0cd|#4b4e54|#8d7a78
077|Jaguar, dense rosettes|wild cat|big-cat|rosettes|#c58c2f|#231710|#2b1d19
078|Black big cat, subtle pattern|wild cat|big-cat|rosettes|#18171a|#2c2b31|#0f0e10
079|Cougar, warm tan|wild cat|big-cat|solid|#c29a6c|#d8b88c|#7a4a42
080|Cheetah, gold spots|wild cat|big-cat|spots|#d9ae5f|#2a1d12|#1b1412
081|Lynx, tufted feet|wild cat|shaggy-cat|dark-feet|#9d9484|#2f2822|#9a6a62
082|Caracal, russet|wild cat|short-cat|mask|#b8693c|#1c1410|#2a1a16
083|White rabbit, pink|rabbit|rabbit|solid|#f7f3ee|#ffffff|#ee9ea8
084|Black rabbit, charcoal|rabbit|rabbit|solid|#1f1e22|#33323a|#3a3338
085|Gray rabbit, slate|rabbit|rabbit|solid|#8e939a|#a8adb4|#6f6e78
086|Brown rabbit, cocoa|rabbit|rabbit|solid|#7a5438|#93694a|#4b2f26
087|Agouti rabbit|rabbit|rabbit|brindle|#8a6a43|#3c2a1a|#5e4036
088|Dutch rabbit|rabbit|rabbit|tuxedo|#1f1d1f|#f7f4ee|#d79a9a
089|Cream lop rabbit|rabbit|rabbit|solid|#ecd5aa|#f8e6c3|#d79a8c
090|Spotted rabbit|rabbit|rabbit|spots|#f4efe6|#b88a58|#d09a90
091|Brown bear|bear|bear|solid|#7a4f2c|#946a43|#1c1411
092|Grizzly, frosted brown|bear|bear|frosted|#6e4a2c|#c9a876|#1b1311
093|Kodiak bear, dark brown|bear|bear|solid|#4a2f1d|#5f3f2a|#140e0c
094|American black bear|bear|bear|solid|#26252a|#3a393f|#0e0d0e
095|Cinnamon bear|bear|bear|solid|#a35a2e|#bd7545|#2a1710
096|Polar bear, ivory|bear|bear|solid|#f1ead8|#fbf6ea|#1d1b1c
097|Giant panda|bear|bear|mitts|#f6f3ec|#1b1a1c|#1a1819
098|Asian black bear, cream accents|bear|bear|tuxedo|#1e1d20|#efe3c4|#111010
099|Sun bear, gold accents|bear|bear|tuxedo|#1c1a1c|#d6a53f|#121010
100|Spectacled bear, tan accents|bear|bear|socks|#1b1a1c|#b99a6a|#141010`.trim().split('\n');

// ---- families. nose: cone proportions (tw tip, sh shoulder, bw base half-widths) + leather kind; paw: pad geometry.
const D3 = [[22, 18, 15, 19], [50, 10, 15, 19], [78, 18, 15, 19]];   // today's three toes (cx, cy, rx, ry)
const padOf = t => t.map(([x, y, rx, ry]) => [x, y + 2, rx * .47, ry * .47]);
const FAMILIES = {
  'corgi':         {scale: 1,    nose: {tw: 18, sh: 38, bw: 46, leather: 'heart', k: 1},   paw: {palm: [50, 55, 42, 32], toes: D3, main: [50, 58, 20, 15]}},
  'long-canine':   {scale: .96,  nose: {tw: 13, sh: 31, bw: 42, leather: 'heart', k: .9},  paw: {palm: [50, 55, 38, 32], toes: [[24, 18, 13, 19], [50, 10, 13, 19], [76, 18, 13, 19]], main: [50, 58, 18, 15]}},
  'short-canine':  {scale: 1,    nose: {tw: 17, sh: 36, bw: 46, leather: 'heart', k: 1},   paw: {palm: [50, 55, 40, 31], toes: [[22, 19, 14, 18], [50, 11, 14, 18], [78, 19, 14, 18]], main: [50, 58, 19, 14]}},
  'broad-canine':  {scale: 1.06, nose: {tw: 22, sh: 42, bw: 48, leather: 'heart', k: 1.15, jowl: 1}, paw: {palm: [50, 55, 45, 32], toes: [[20, 18, 16, 19], [50, 10, 16, 19], [80, 18, 16, 19]], main: [50, 58, 22, 15]}},
  'small-canine':  {scale: .92,  nose: {tw: 14, sh: 32, bw: 44, leather: 'heart', k: .8},  paw: {palm: [50, 58, 34, 28], toes: [[26, 22, 12, 16], [50, 15, 12, 16], [74, 22, 12, 16]], main: [50, 60, 16, 12]}},
  'shaggy-canine': {scale: 1.04, nose: {tw: 18, sh: 38, bw: 46, leather: 'heart', k: 1, fringe: 1}, paw: {palm: [50, 55, 42, 32], toes: D3, main: [50, 58, 20, 15], fringe: 1}},
  'wolf':          {scale: 1.06, nose: {tw: 15, sh: 34, bw: 45, leather: 'heart', k: 1.05}, paw: {palm: [50, 54, 40, 34], toes: [[22, 16, 13, 22], [50, 8, 13, 22], [78, 16, 13, 22]], main: [50, 58, 19, 16]}},
  'fox':           {scale: .94,  nose: {tw: 9, sh: 26, bw: 42, leather: 'heart', k: .6},  paw: {palm: [50, 56, 32, 32], toes: [[28, 18, 11, 20], [50, 10, 11, 20], [72, 18, 11, 20]], main: [50, 60, 14, 12]}},
  'short-cat':     {scale: .94,  nose: {tw: 16, sh: 35, bw: 45, leather: 'tri', k: 1},    paw: {palm: [50, 58, 36, 28], toes: [[18, 26, 11, 14], [40, 15, 11, 14], [60, 15, 11, 14], [82, 26, 11, 14]], main: [50, 62, 17, 12]}},
  'broad-cat':     {scale: 1,    nose: {tw: 20, sh: 40, bw: 47, leather: 'tri', k: 1.1},  paw: {palm: [50, 57, 40, 30], toes: [[16, 26, 12, 15], [39, 15, 12, 15], [61, 15, 12, 15], [84, 26, 12, 15]], main: [50, 61, 19, 13]}},
  'shaggy-cat':    {scale: 1.02, nose: {tw: 18, sh: 38, bw: 46, leather: 'tri', k: 1, fringe: 1}, paw: {palm: [50, 57, 38, 29], toes: [[17, 26, 12, 14], [39, 15, 12, 14], [61, 15, 12, 14], [83, 26, 12, 14]], main: [50, 61, 18, 12], fringe: 1}},
  'hairless-cat':  {scale: .92,  nose: {tw: 16, sh: 35, bw: 45, leather: 'tri', k: 1, wrinkle: 1}, paw: {palm: [50, 58, 36, 28], toes: [[18, 26, 11, 14], [40, 15, 11, 14], [60, 15, 11, 14], [82, 26, 11, 14]], main: [50, 62, 17, 12], wrinkle: 1}},
  'big-cat':       {scale: 1.08, nose: {tw: 20, sh: 41, bw: 48, leather: 'tri', k: 1.5},  paw: {palm: [50, 56, 44, 32], toes: [[15, 25, 13, 16], [38, 14, 13, 16], [62, 14, 13, 16], [85, 25, 13, 16]], main: [50, 60, 22, 15]}},
  'rabbit':        {scale: .98,  nose: {tw: 14, sh: 33, bw: 44, leather: 'bunny', k: 1}, paw: {palm: [50, 50, 31, 42], toes: [[27, 12, 9, 14], [42, 6, 9, 14], [58, 6, 9, 14], [73, 12, 9, 14]], main: [50, 58, 16, 24], fringe: 1, rabbit: 1}},
  'bear':          {scale: 1.1,  nose: {tw: 21, sh: 41, bw: 48, leather: 'round', k: 1},  paw: {palm: [50, 55, 45, 33], toes: [[11, 26, 9.5, 14], [31, 16, 9.5, 14], [50, 11, 9.5, 14], [69, 16, 9.5, 14], [89, 26, 9.5, 14]], main: [50, 60, 24, 15]}}
};
export const FAMILY_IDS = Object.keys(FAMILIES);

// ---- patterns: SVG snippets drawn inside the coat silhouette, in nose space (100x80) and paw space (100x90).
const M = 'style="fill:var(--fur-mark)"', M2 = 'style="fill:var(--fur-mark2,var(--fur-mark))"';
const ring = (x, y, r, w = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:none;stroke:var(--fur-mark);stroke-width:${w}"/><circle cx="${x}" cy="${y}" r="${r * .3}" ${M}/>`;
const dots = (list, r) => list.map(([x, y, s = 1]) => `<circle cx="${x}" cy="${y}" r="${r * s}" ${M}/>`).join('');
const PATTERNS = {
  'solid': {nose: () => '', paw: () => ''},
  'tuxedo': {nose: () => `<path d="M50 4C56 4 62 22 66 80H34C38 22 44 4 50 4Z" ${M}/><rect x="0" y="66" width="100" height="14" ${M}/>`, paw: () => `<rect x="-5" y="-12" width="110" height="74" ${M}/>`},
  'socks': {nose: () => `<rect x="0" y="66" width="100" height="14" ${M}/>`, paw: () => `<rect x="-5" y="-12" width="110" height="46" ${M}/>`},
  'points': {nose: () => `<path d="M0 22C30 10 70 10 100 22V80H0Z" ${M}/>`, paw: () => `<rect x="-5" y="-12" width="110" height="110" ${M}/>`},
  'mask': {nose: () => `<path d="M0 34C30 26 70 26 100 34V80H0Z" ${M}/>`, paw: () => ''},
  'dark-feet': {nose: () => `<rect x="0" y="72" width="100" height="8" ${M} opacity=".8"/>`, paw: () => `<rect x="-5" y="-12" width="110" height="110" ${M}/>`},
  'mitts': {nose: () => '', paw: () => `<rect x="-5" y="-12" width="110" height="110" ${M}/>`},
  'spots': {nose: () => dots([[28, 40, 1.1], [70, 30, 1.3], [60, 62], [22, 66, 1.1], [84, 56], [44, 18, .7]], 4.5), paw: () => dots([[24, 50, 1.2], [70, 40], [50, 78, 1.1], [82, 66], [30, 76, .8]], 5)},
  'patches': {nose: () => `<path d="M4 20C20 10 30 28 22 44C14 52 4 46 4 20Z" ${M}/><path d="M72 14C90 20 98 40 88 58C78 52 70 36 72 14Z" ${M}/><path d="M30 70C40 60 60 62 70 72V80H30Z" ${M2}/>`,
    paw: () => `<path d="M-4 30C20 22 34 40 26 62C12 70 -4 64 -4 30Z" ${M}/><path d="M70 40C96 36 106 60 92 84C78 80 66 62 70 40Z" ${M2}/>`},
  'brindle': {nose: () => `<path style="fill:none;stroke:var(--fur-mark);stroke-linecap:round;stroke-width:3;opacity:.6" d="M8 22L28 52M24 8L48 44M44 6L56 30M60 8L80 44M80 20L94 50M14 56L30 76M66 52L84 76"/>`,
    paw: () => `<path style="fill:none;stroke:var(--fur-mark);stroke-linecap:round;stroke-width:3.4;opacity:.6" d="M10 40L34 70M32 20L50 60M54 24L72 66M76 34L92 64M14 70L30 86"/>`},
  'tabby': {nose: () => `<path style="fill:none;stroke:var(--fur-mark);stroke-linecap:round;stroke-width:3.4;opacity:.85" d="M50 6V26M40 8L37 26M60 8L63 26M8 50H24M8 62H22M92 50H76M92 62H78"/>`,
    paw: () => `<path style="fill:none;stroke:var(--fur-mark);stroke-linecap:round;stroke-width:3.4;opacity:.85" d="M8 34H92M12 46H88M16 78H84"/>`},
  'stripes': {nose: () => `<path style="fill:none;stroke:var(--fur-mark);stroke-linecap:round;stroke-width:6" d="M6 30L32 40M4 52L28 58M94 30L68 40M96 52L72 58M44 6V24M56 6V24"/>`,
    paw: () => `<path style="fill:none;stroke:var(--fur-mark);stroke-linecap:round;stroke-width:6.5" d="M4 30L34 38M96 30L66 38M10 62L36 66M90 62L64 66"/>`},
  'rosettes': {nose: () => ring(26, 40, 6) + ring(72, 34, 6.5) + ring(60, 64, 5) + ring(20, 68, 5) + ring(84, 62, 5) + ring(48, 18, 4, 2),
    paw: () => ring(24, 46, 7) + ring(72, 42, 7) + ring(48, 76, 6) + ring(84, 70, 5)},
  'tricolor': {nose: () => `<path d="M50 4C56 4 62 22 66 80H34C38 22 44 4 50 4Z" ${M}/><path d="M4 40C14 36 24 44 24 60V80H4Z" ${M2}/><path d="M96 40C86 36 76 44 76 60V80H96Z" ${M2}/>`,
    paw: () => `<rect x="-5" y="-12" width="110" height="46" ${M}/><path d="M-4 40H30V70H-4Z" ${M2}/><path d="M104 40H70V70H104Z" ${M2}/>`},
  'merle': {nose: () => `<ellipse cx="24" cy="36" rx="14" ry="9" ${M} opacity=".85"/><ellipse cx="74" cy="28" rx="16" ry="10" ${M} opacity=".85"/><ellipse cx="62" cy="62" rx="12" ry="8" ${M} opacity=".85"/><ellipse cx="22" cy="66" rx="10" ry="7" ${M} opacity=".85"/><ellipse cx="50" cy="12" rx="8" ry="5" ${M} opacity=".85"/>`,
    paw: () => `<ellipse cx="26" cy="48" rx="16" ry="11" ${M} opacity=".85"/><ellipse cx="72" cy="40" rx="14" ry="10" ${M} opacity=".85"/><ellipse cx="52" cy="74" rx="16" ry="9" ${M} opacity=".85"/>`},
  'frosted': {nose: () => `<path d="M0 0H100V26C70 36 30 36 0 26Z" ${M} opacity=".75"/>`, paw: () => `<rect x="-5" y="-12" width="110" height="40" ${M} opacity=".75"/>`},
  'curls': {nose: () => dots([[14, 40], [86, 40], [26, 22], [74, 22], [10, 62], [90, 62], [50, 12, .8]], 9).replace(/>/g, ' opacity=".55">'),
    paw: () => dots([[16, 30], [84, 30], [14, 60], [86, 60], [50, 82, 1.2]], 10).replace(/>/g, ' opacity=".55">')}
};
export const PATTERN_IDS = Object.keys(PATTERNS);
export const LOOK_GROUPS = ['dog', 'wild canid', 'cat', 'wild cat', 'rabbit', 'bear'];

// ---- claw colour: the candidate that contrasts most with BOTH the coat and the skin (relative-luminance distance).
export const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const CLAWS = ['#f3ead2', '#fffaf0', '#2b2018', '#12100e', '#d9b44a', '#c8c1b4'];
const pickClaw = (fur, skin) => CLAWS.reduce((best, c) => { const s = Math.min(Math.abs(lum(c) - lum(fur)), Math.abs(lum(c) - lum(skin))); return s > best[0] ? [s, c] : best; }, [-1, CLAWS[0]])[1];

export const LOOKS = Object.freeze(ROWS.map(r => {
  const [n, name, group, family, pattern, base, mark, skin, mark2] = r.split('|');
  return Object.freeze({id: 'animal_' + n, name, group, family, base, mark, ...(mark2 ? {mark2} : {}), pattern, skin, claw: n === '001' ? '#e8dcc0' : pickClaw(base, skin), scale: FAMILIES[family].scale});
}));
const BY_ID = new Map(LOOKS.map(l => [l.id, l]));
export const lookById = id => BY_ID.get(id) || LOOKS[0];

// ---- drawing
let uid = 0;
const FUR = 'style="fill:var(--fur,#caa06a)"', SKIN = 'style="fill:var(--skin,#2a1a10)"', CLAW = 'style="fill:var(--claw,#e8dcc0)"';
const cone = ({tw, sh, bw}) => {
  const P = (dx, y) => `${50 + dx} ${y}`, N = (dx, y) => `${50 - dx} ${y}`;
  return `M50 3C${50 + tw} 3 ${50 + sh * .84} 13 ${P(sh, 32)}C${50 + sh + 5} 48 ${50 + bw + 1} 64 ${P(bw, 80)}L${N(bw, 80)}C${50 - bw - 1} 64 ${50 - sh - 5} 48 ${N(sh, 32)}C${50 - sh * .84} 13 ${50 - tw} 3 50 3Z`; };
const HEART = 'M50 33C47 25 37 23 31 29C24 36 25 50 32 59C38 67 46 68 50 63C54 68 62 67 68 59C75 50 76 36 69 29C63 23 53 25 50 33Z';
const LEATHER = {
  heart: HEART,
  tri: 'M31 33C31 27 69 27 69 33C69 43 56 56 50 60C44 56 31 43 31 33Z',
  round: 'M50 31C70 29 80 37 78 47C76 58 62 66 50 66C38 66 24 58 22 47C20 37 30 29 50 31Z',
  bunny: 'M50 42C44 31 32 33 34 41C36 49 46 53 50 51C54 53 64 49 66 41C68 33 56 31 50 42Z'
};
const NOSTRIL = {heart: [[38, 52, 25], [62, 52, -25]], tri: [[42, 41, 20], [58, 41, -20]], round: [[39, 50, 25], [61, 50, -25]], bunny: [[43, 43, 20], [57, 43, -20]]};

export function noseMarkup(look, id = 'n' + ++uid) {
  const f = FAMILIES[look.family] || FAMILIES.corgi, n = f.nose, pat = (PATTERNS[look.pattern] || PATTERNS.solid).nose();
  const k = n.k, ly = n.leather === 'heart' ? 47 : 46;
  const nos = NOSTRIL[n.leather].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${n.leather === 'heart' ? 5.5 : 3.6}" ry="${n.leather === 'heart' ? 7.5 : 5}" transform="rotate(${r} ${x} ${y})"/>`).join('');
  const jowl = n.jowl ? `<path d="M10 72C30 66 70 66 90 72M16 78C34 73 66 73 84 78" style="fill:none;stroke:#000;stroke-opacity:.22;stroke-width:1.6"/>` : '';
  const fringe = n.fringe ? [10, 22, 78, 90].map((x, i) => `<path d="M${x - 5} ${66 - i % 2 * 8}L${x} ${80}L${x + 5} ${66 - i % 2 * 8}Z" ${FUR}/>`).join('') : '';
  const wr = n.wrinkle ? `<path d="M26 30C38 24 62 24 74 30M22 42C36 36 64 36 78 42M30 20C42 15 58 15 70 20" style="fill:none;stroke:#000;stroke-opacity:.25;stroke-width:1.4"/>` : '';
  const bunny = n.leather === 'bunny' ? `<path d="M50 51V66M50 66C43 73 35 70 33 65M50 66C57 73 65 70 67 65" style="fill:none;stroke:var(--skin,#2a1a10);stroke-width:2;stroke-linecap:round"/>` : '';
  return `<svg viewBox="0 0 100 80" preserveAspectRatio="none"><defs><clipPath id="${id}"><path d="${cone(n)}"/></clipPath></defs>`
    + `<path d="${cone(n)}" ${FUR}/><g clip-path="url(#${id})">${pat}</g>${fringe}${jowl}${wr}`
    + `<g transform="translate(50 ${ly}) scale(${k}) translate(-50 -${ly})"><path d="${LEATHER[n.leather]}" ${SKIN}/>${bunny}<g fill="#0e0805">${n.leather === 'bunny' ? '' : nos}</g>`
    + `<path d="M33 30C38 24 46 25 49 32C45 29 39 29 35 34Z" fill="rgba(255,255,255,.22)"/><path d="M67 30C62 24 54 25 51 32C55 29 61 29 65 34Z" fill="rgba(255,255,255,.22)"/></g>`
    + `<path d="M24 30C30 14 40 8 50 7C42 11 33 18 28 34Z" fill="rgba(255,255,255,.18)"/></svg>`;
}

// One paw drawn in 100x90 space; `side` 'r' mirrors the coat pattern so a spotted paw is not a copy of its twin.
function pawBody(look, id, side) {
  const f = FAMILIES[look.family] || FAMILIES.corgi, p = f.paw, [cx, cy, rx, ry] = p.palm, pat = (PATTERNS[look.pattern] || PATTERNS.solid).paw();
  const shapes = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>` + p.toes.map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}"/>`).join('');
  const tufts = p.fringe ? p.toes.slice(0, -1).map(([x, y, a, b], i) => `<path d="M${x + a - 3} ${y + b - 2}L${(x + p.toes[i + 1][0]) / 2} ${y + b + 9}L${p.toes[i + 1][0] - a + 3} ${y + b - 2}Z" ${FUR}/>`).join('') : '';
  const wr = p.wrinkle ? `<path d="M26 60C40 56 60 56 74 60M30 68C42 64 58 64 70 68" style="fill:none;stroke:#000;stroke-opacity:.22;stroke-width:1.4"/>` : '';
  const claws = p.toes.map(([x, y, a, b]) => { const t = y - b, k = p.rabbit ? .45 : 1; return `<path d="M${x - 3.6 * k} ${t + 4}Q${x - k} ${t + 4 - 11 * k} ${x + k} ${t + 4 - 13 * k}Q${x + 3 * k} ${t + 4 - 9 * k} ${x + 3.6 * k} ${t + 4}Z" ${CLAW}/>`; }).join('');
  const toePads = padOf(p.toes).map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${p.rabbit ? 3.4 : a}" ry="${p.rabbit ? 4.4 : b}"/>`).join('');
  const [mx, my, mrx, mry] = p.main;
  return `<defs><clipPath id="${id}">${shapes}</clipPath></defs><g ${FUR}>${shapes}</g>${tufts}<g clip-path="url(#${id})"><g ${side === 'r' ? 'transform="translate(100 0) scale(-1 1)"' : ''}>${pat}</g></g>${wr}`
    + `<g ${SKIN}>${p.rabbit ? '' : toePads}<ellipse cx="${mx}" cy="${my}" rx="${mrx}" ry="${mry}"/></g>${claws}`;
}
export function pawMarkup(look, side = 'l', id = 'p' + ++uid) {
  return `<svg viewBox="0 0 100 90" style="overflow:visible">${pawBody(look, id, side)}</svg>`;
}
// The locker grip paw: the RIGHT paw, underside toward the viewer, on a forearm that rises from the bottom edge.
export function gripMarkup(look, id = 'g' + ++uid) {
  const arm = 'M30 88C24 120 22 150 20 190H92C92 150 86 118 74 88Z';
  return `<svg viewBox="0 -12 100 202" style="overflow:visible"><defs><clipPath id="${id}a"><path d="${arm}"/></clipPath></defs>`
    + `<path d="${arm}" ${FUR}/><g clip-path="url(#${id}a)"><g transform="translate(100 0) scale(-1 1)">${(PATTERNS[look.pattern] || PATTERNS.solid).paw()}</g></g>`
    + `<path d="M42 100C40 130 38 160 36 190" style="fill:none;stroke:#000;stroke-opacity:.14;stroke-width:3"/>${pawBody(look, id, 'r')}</svg>`;
}

export function applyLook(root, look) {
  if (!root) return look;
  look = typeof look === 'string' ? lookById(look) : look || LOOKS[0];
  if (root.dataset.lookId === look.id) return look;
  const st = root.style;
  st.setProperty('--fur', look.base); st.setProperty('--fur-mark', look.mark); st.setProperty('--fur-mark2', look.mark2 || look.mark);
  st.setProperty('--skin', look.skin); st.setProperty('--claw', look.claw); st.setProperty('--look-scale', String(Math.min(1.1, Math.max(.9, look.scale || 1))));
  root.dataset.lookId = look.id; root.dataset.lookFamily = look.family; root.dataset.lookPattern = look.pattern;
  const nose = root.querySelector('.cc-nose'); if (nose) nose.innerHTML = noseMarkup(look);
  for (const s of ['l', 'r']) { const el = root.querySelector('.cc-paw.' + s); if (el) el.innerHTML = pawMarkup(look, s); }
  const grip = root.querySelector('.cc-grip'); if (grip) grip.innerHTML = gripMarkup(look);
  return look;
}
