# -*- coding: utf-8 -*-
"""Generates /games/<slug>/index.html (landing) and /play/<slug>/index.html (standalone play) from the registry.
Static output only: the deploy stays a plain folder of files on GitHub Pages, no build step at serve time.

The landing card is no longer only a launch button. It carries, in this order: the game's honest promise
and one CTA, what finishing looks like, the mission state (only when a real broadcast is configured),
this channel's slice of the Coach profile, and a way back. Every live-facing and identity-facing element
is rendered ONLY when the matching registry value is non-empty, so an unconfirmed broadcast cannot
produce an invented deadline and no form can ever collect an address there is nowhere to send.
"""
import json, os, html, io, shutil
from character_pages import information_markup, profile_title, brand_markup, page_title
from network_pages import launch_markup, write_network_routes

# Derived from this file's own location rather than hard-coded, so the generator travels with the repo
# and a clone anywhere still regenerates. (It lived outside the repo until 2026-09-06, in no commit,
# and had accumulated three undocumented edits by the time it was moved in.)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://mominc-mbs.github.io"
REG = json.load(io.open(os.path.join(ROOT, "tv", "registry.json"), encoding="utf-8"))

def esc(s): return html.escape(s or "", quote=True)

def title_vw(title):
    """Longest unbreakable word decides the type scale. 0.84em per character measured off the rendered
    display face; 88vw is the width left after the hero padding at the narrowest tested phone."""
    longest = max((len(w) for w in title.split()), default=1)
    return round(min(11.5, 83.0 / (longest * 0.84)), 2)

LANDING = u"""<!doctype html>
<html lang="en" data-game="{slug}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | MBS</title>
<meta name="description" content="{premise}">
<link rel="canonical" href="{site}/games/{slug}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MBS">
<meta property="og:title" content="{title} | MBS">
<meta property="og:description" content="{premise}">
<meta property="og:url" content="{site}/games/{slug}/">
<meta property="og:image" content="{site}/tv/{share_image}">
<meta property="og:image:alt" content="{share_alt}">
<meta property="og:image:width" content="{share_w}">
<meta property="og:image:height" content="{share_h}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} | MBS">
<meta name="twitter:description" content="{premise}">
<meta name="twitter:image" content="{site}/tv/{share_image}">
<meta name="twitter:image:alt" content="{share_alt}">
<link rel="stylesheet" href="../../tv/landing.css">
<link rel="stylesheet" href="../../tv/identity.css">
<link rel="stylesheet" href="../../tv/network-flow.css">
<link href="https://fonts.googleapis.com/css2?family=Bowlby+One+SC&amp;family=Pacifico&amp;family=Special+Elite&amp;display=swap" rel="stylesheet">
<style>
  :root{{--bg:{bg}; --ink:{ink}; --accent:{accent}; --title-vw:{titlevw}vw;}}
</style>
<script src="/tv/phone-layout.js" defer></script></head>
<body class="g-{slug}" data-slug="{slug}" data-ch="{ch}" data-progress-key="{progress_key}"
      data-continue-cta="{continue_cta}" data-next-slug="{next_slug}" data-next-ch="{next_ch}"
      data-next-title="{next_title}" data-next-premise="{next_premise}" data-share-url="{site}/games/{slug}/"
      data-live-at="{live_at}" data-live-url="{live_url}">
<a class="skip" href="#play">Skip to play</a>

<main>
  <nav class="landing-nav"><a href="../../tv/?ch=mominc">MOM INC</a><a href="#information">Information</a><a href="#questions">Questions</a></nav>
  {launch}
  <header class="hero">
    <div class="hero-art" aria-hidden="true">{heroart}</div>
    <div class="hero-copy">
      <p class="eyebrow">{eyebrow}</p>
      <div class="brand-heading">{brand}<h1 class="title">{page_title}</h1></div>
      <p class="premise">{premise}</p>
      <p class="resume" id="resume" hidden>Saved progress found on this device.</p>
      <a class="cta" id="play" href="../../play/{slug}/" data-play="../../play/{slug}/" target="_blank" rel="noopener">{cta}</a>
      <p class="cta-sub">{duration} &middot; {inp}</p>
      <p class="split">Public edition &middot; Free to play</p>
    </div>
  </header>
{mission}
{information}
  <div class="below-play">
    <details class="game-notes"><summary>How to play</summary>
      <dl class="facts"><div><dt>Do</dt><dd>{does}</dd></div><div><dt>Finish</dt><dd>{finish}</dd></div></dl>
    </details>
    <details class="locked-edition"><summary><span aria-hidden="true">&#128274;</span> Restricted programming <span class="lock-state">Locked</span></summary>
      <p>MOM is still reviewing this transmission. Horror editions unlock later.</p>
    </details>
  </div>

  <details class="profile" id="questions" open><summary id="profileHead">{profile_title}</summary>

    <p class="profile-voice">{profile_intro}</p>
    <p class="profile-store">Optional notes for a future Coach AI. Saved only in this browser; nothing is sent. No coach reads them yet. Delete them here or in Your Files.</p>

    <form class="profile-form" id="profileForm">
{questions}
      <div class="profile-actions">
        <button type="submit" class="mini">Save on this device</button>
        <button type="button" class="mini ghost" id="profileDelete">Delete my answers for this channel</button>
      </div>
      <p class="profile-saved" id="profileSaved" hidden role="status"></p>
    </form>

    <div class="profile-file" id="profileFile" hidden>
      <p class="profile-count" id="profileCount"></p>
      <ul class="profile-list" id="profileList"></ul>
      <p class="profile-partial">Partial is fine. Every question is optional, and no channel asks for
        the same thing twice.</p>
      <p class="profile-partial"><a href="../../files/">See everything this browser is keeping</a></p>
    </div>
{identity}
  </details>

  <footer class="foot">
    <a href="../../tv/?ch={slug}">Explore Ch {ch} &middot; {host}</a>{live_links}
    <button type="button" class="linkish" id="shareBtn">Share game</button>
    <a href="../../tv/?ch=mominc">MOM INC</a>
    <p class="share-said" id="shareSaid" hidden role="status">Channel link copied. MOM did not open your contacts.</p>
    <a href="../../files/">Your files</a>
    <p class="fine">MOM Inc is fiction. Public games are free{rules_line}.</p>
  </footer>
</main>

<script src="../../tv/mbs-channels.js"></script>
<script src="../../tv/state.js"></script>
<script src="../../tv/card.js"></script>
<script src="../../tv/network-flow.js"></script>
<script src="../../tv/atmosphere.js"></script>
</body>
</html>
"""

PLAY = u"""<!doctype html>
<html lang="en" data-game="{slug}" data-mode="public" data-api="{api}" data-mission-id="{mission_id}" data-station="{station}" data-roots="{roots}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<base href="../../tv/">
<title>{title}</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="play.css">
<link rel="stylesheet" href="atmosphere.css">
<link rel="stylesheet" href="network-flow.css">
<style>body{{background:{bg}}}</style>
<script src="/tv/phone-layout.js" defer></script></head>
<body>
{orientation}
<div class="stage"><div class="rail"><a class="exit" href="../games/{slug}/" aria-label="Back to {title}">&larr;<span>{title}</span></a></div><div class="glass"><div id="screen" class="screen"><div id="channel" class="channel"></div></div></div></div>
<div class="wave" id="mbsWave" aria-hidden="true"></div>
<div class="meter" id="mbsMeter" hidden aria-hidden="true"></div>
<div class="boot" id="boot"><p>Tuning {title}. <noscript>This one needs JavaScript. </noscript><a href="../games/{slug}/">Go back</a> if nothing arrives.</p></div>

<script src="mbs-channels.js"></script>
<script src="state.js"></script>
<script src="mbs-runtime.js"></script>
<script src="channel-runtime.js"></script>
<script src="mbs-shim.js"></script>
<script src="atmosphere.js"></script>
<script src="mount.js"></script>
<script src="network-flow.js"></script>
</body>
</html>
"""

# A `status: "coming_soon"` game (sag, armie) keeps its television slot and its own landing page, but has
# no play route: no card may promise a game that is not there to play. Shorter than LANDING on purpose -
# no facts/teaser/profile sections, since there is no finish state and no game-specific coach slice yet.
COMING_SOON = u"""<!doctype html>
<html lang="en" data-game="{slug}" data-status="coming-soon">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | MBS</title>
<meta name="description" content="{premise}">
<link rel="canonical" href="{site}/games/{slug}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MBS">
<meta property="og:title" content="{title} | MBS">
<meta property="og:description" content="{premise}">
<meta property="og:url" content="{site}/games/{slug}/">
<meta property="og:image" content="{site}/tv/{share_image}">
<meta property="og:image:alt" content="{share_alt}">
<meta property="og:image:width" content="{share_w}">
<meta property="og:image:height" content="{share_h}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} | MBS">
<meta name="twitter:description" content="{premise}">
<link rel="stylesheet" href="../../tv/landing.css">
<link rel="stylesheet" href="../../tv/identity.css">
<link href="https://fonts.googleapis.com/css2?family=Bowlby+One+SC&amp;family=Pacifico&amp;family=Special+Elite&amp;display=swap" rel="stylesheet">
<style>
  :root{{--bg:{bg}; --ink:{ink}; --accent:{accent}; --title-vw:{titlevw}vw;}}
</style>
<script src="/tv/phone-layout.js" defer></script></head>
<body class="g-{slug} is-coming-soon" data-slug="{slug}" data-ch="{ch}">
<a class="skip" href="#play">Skip to link</a>
<main>
  <nav class="landing-nav"><a href="../../tv/?ch=mominc">MOM INC</a><a href="../../tv/">Tune in</a></nav>
  <header class="hero">
    <div class="hero-art" aria-hidden="true">{heroart}</div>
    <div class="hero-copy">
      <p class="eyebrow">{eyebrow} &middot; Coming Soon</p>
      <div class="brand-heading">{brand}<h1 class="title">{page_title}</h1></div>
      <p class="premise">{premise}</p>
      <p class="premise">This channel is being rebuilt and is not playable yet.</p>
      <a class="cta" id="play" href="../../">Back To All Channels</a>
    </div>
  </header>
  <footer class="foot">
    <a href="../../tv/?ch={slug}">Explore Ch {ch} &middot; {host}</a>
    <a href="../../tv/?ch=mominc">MOM INC</a>
    <p class="fine">MOM Inc is fictional and MBS is a comedy programme. This channel is coming soon.</p>
  </footer>
</main>
</body>
</html>
"""


def png_size(rel):
    """Real pixel size, read off the PNG header. Publishing 512x512 for every card was wrong for all
    eight: the character marks are 360 square and the MOM mark is 480, and a share card that lies about
    its own dimensions is a preview a platform may lay out incorrectly."""
    p = os.path.join(ROOT, "tv", rel.replace("/", os.sep))
    with io.open(p, "rb") as fh:
        head = fh.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n" or head[12:16] != b"IHDR":
        raise SystemExit("share_image is not a PNG: %s" % rel)
    return int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")


def share_alt(g):
    """The alt text describes the image that is actually published, which for the two channels with no
    mark of their own is MOM Inc's, not theirs."""
    return ("The MOM Inc mark" if g["share_image"].endswith("mom-inc-mark.png")
            else "The %s mark" % g["host"])


def hero_markup(g):
    from scene_markup import scene_markup
    scene = scene_markup(g["slug"])
    if scene: return scene

    if g.get("hero"):
        return u'<img src="../../tv/%s" alt="" width="512" height="512" loading="eager" decoding="async">' % esc(g["hero"])
    return u'<div class="hero-mark"></div>'


def questions_markup(g):
    """Three optional free-text answers. Free text rather than fixed options because the reviewer's own
    wording offers examples inside the question, and a select would force a shape onto answers the coach
    is meant to read as written."""
    out = []
    for i, q in enumerate(g["profile_questions"]):
        qid = "q%d" % (i + 1)
        out.append(
            u'      <p class="q"><label for="%s-%s">%s</label>\n'
            u'        <textarea id="%s-%s" name="%s" rows="2" autocomplete="off"></textarea>\n'
            u'        <span class="opt">Optional</span></p>'
            % (g["slug"], qid, esc(q), g["slug"], qid, qid))
    return u"\n".join(out)


def mission_markup(live):
    """Rendered only when a broadcast is actually configured. No state, no block - never a countdown
    against a date nobody has confirmed, which is exactly the invented urgency this show is about."""
    state, label = live.get("state", "off"), esc(live.get("schedule_label"))
    if not live.get("broadcast_url") and not live.get("next_broadcast_at"):
        return u""
    rules = (u' <a href="%s">Official rules</a>.' % esc(live["rules_url"])) if live.get("rules_url") else u""
    when = (u" %s." % label) if label else u""
    if state == "live":
        body = (u'<p class="mission-head">Live now &middot; mission open</p>'
                u'<p>Watch the broadcast for the code, then enter it inside the game before the mission '
                u'closes.</p>')
    elif state == "closed":
        body = (u'<p class="mission-head">Mission closed</p>'
                u'<p>The public game is still free and unchanged.%s</p>' % when)
    else:
        body = (u'<p class="mission-head">Next live mission</p>'
                u'<p>Watch the broadcast for the code.%s Enter it in the game while the mission is open, '
                u'finish the unlocked section, then enter for a free personal Coach AI. 18+. No purchase.%s</p>'
                % (when, rules))
    return (u'\n  <section class="mission is-%s" aria-label="Mission state">\n    %s\n  </section>\n'
            % (esc(state), body))


def live_links_markup(live):
    out = u""
    if live.get("broadcast_url"):
        lbl = (u" &middot; %s" % esc(live["schedule_label"])) if live.get("schedule_label") else u""
        out += (u'\n    <a class="live-link" href="%s" rel="noopener">Watch MBS live%s</a>'
                % (esc(live["broadcast_url"]), lbl))
    if live.get("next_broadcast_at"):
        out += u'\n    <button type="button" class="linkish" id="remindBtn">Remind me for the next live mission</button>'
    return out


def identity_markup(identity_api):
    """The save-this-profile handoff. Deliberately absent until there is an endpoint: a SEND
    VERIFICATION CODE button that quietly discards the address is precisely the defect this review found
    in three existing channels, and adding a ninth would be worse than shipping without one."""
    if not identity_api:
        return ""
        return (u'\n    <p class="profile-later">There is nowhere to send this, so nothing here asks for '
                u'your email or number. If a live mission and a Coach AI are built, this is where the card '
                u'would say exactly what it keeps and for how long, and ask before anything is sent.</p>')
    return (u'\n    <form class="identity" id="identityForm" action="%s" method="post">\n'
            u'      <h3>Save this coach profile</h3>\n'
            u'      <p>Choose email or text. It is used only to save this profile, to enforce one prize '
            u'entry per person, and to deliver the Coach AI if you win. This does not enter you: entry '
            u'happens only after a live mission. No marketing, ever.</p>\n'
            u'      <p class="q"><label><input type="radio" name="channel" value="email" required> Email</label>\n'
            u'        <label><input type="radio" name="channel" value="sms" required> Text message</label></p>\n'
            u'      <p class="q"><label for="identityValue">Email address or mobile number</label>\n'
            u'        <input id="identityValue" name="address" type="text" required autocomplete="off"></p>\n'
            u'      <button type="submit" class="mini">Send verification code</button>\n'
            u'    </form>' % esc(identity_api))


def selectors(v):
    return isinstance(v, list) and all(isinstance(x, str) and x.strip() for x in v)


# Fail closed here too, not only in mount.js: a route written with no roots would serve the whole
# channel as if it were the game, the exact defect Part A exists to remove. Preflight the WHOLE
# registry before writing anything, so a bad entry cannot leave half the routes rewritten and half not,
# and require both keys explicitly rather than coercing a missing one to empty.
REQUIRED_TEXT = ("finish", "cta2", "profile_intro", "share_image")
bad = []
for g in REG["games"]:
    if not selectors(g.get("roots")) or not g.get("roots"):
        bad.append("%s: roots must be a non-empty list of selector strings" % g.get("slug", "?"))
    if not selectors(g.get("hide")):
        bad.append("%s: hide must be a list of selector strings, declared even when empty" % g.get("slug", "?"))
    for k in REQUIRED_TEXT:
        if not (isinstance(g.get(k), str) and g[k].strip()):
            bad.append("%s: %s must be a non-empty string" % (g.get("slug", "?"), k))
    if not selectors(g.get("profile_questions")) or not g.get("profile_questions"):
        bad.append("%s: profile_questions must be a non-empty list of strings" % g.get("slug", "?"))
    # a continue label without a key, or a key without a label, would claim a resume that cannot work
    if bool(g.get("progress_key")) != bool(g.get("continue_cta")):
        bad.append("%s: progress_key and continue_cta must be set together or not at all" % g.get("slug", "?"))
    # declared even when empty, same as hide above: redeem needs {mission_id, code} and an empty value is
    # the OFF switch, but an absent key is a typo waiting to render a mission that can never redeem
    if not isinstance(g.get("mission_id"), str):
        bad.append("%s: mission_id must be a string, declared even when empty" % g.get("slug", "?"))
    if g.get("status") not in (None, "coming_soon"):
        bad.append("%s: status must be omitted or \"coming_soon\"" % g.get("slug", "?"))
if not isinstance(REG.get("api_base"), str):
    bad.append("api_base must be a string, declared even when empty")
if not isinstance((REG.get("live") or {}).get("station"), str):
    bad.append("live.station must be a string, declared even when empty")
if bad:
    raise SystemExit("registry rejected, nothing written:\n  " + "\n  ".join(bad))

LIVE = REG.get("live") or {}
IDENTITY = REG.get("identity_api") or ""
API_BASE = REG.get("api_base") or ""
STATION = LIVE.get("station") or ""
MISSION = mission_markup(LIVE)
LIVE_LINKS = live_links_markup(LIVE)
IDENTITY_BLOCK = identity_markup(IDENTITY)
RULES_LINE = (u', and eligibility is governed by the <a href="%s">published rules</a>'
              % esc(LIVE["rules_url"])) if LIVE.get("rules_url") else u""
IDENTITY_NOTE = u"" if IDENTITY else u" yet"

# the onward route is the channel order itself, wrapping round, so no card is a dead end. A coming_soon
# game has no play route and no finish, so it is not a stop on this cycle at all - it keeps its television
# slot (G5) but the six playable channels are the whole loop.
ACTIVE = [g for g in REG["games"] if g.get("status") != "coming_soon"]
BY_CH = sorted(ACTIVE, key=lambda g: g["ch"])
NEXT = {g["slug"]: BY_CH[(i + 1) % len(BY_CH)] for i, g in enumerate(BY_CH)}

made = []
for g in REG["games"]:
    slug = g["slug"]

    if g.get("status") == "coming_soon":
        ctx = dict(
            site=SITE, slug=slug, ch=g["ch"], title=esc(g["title"]), eyebrow=esc(g["eyebrow"]),
            brand=brand_markup(slug), page_title=esc(page_title(slug,g["title"])),
            host=esc(g["host"]), premise=esc(g["premise"]),
            share_image=esc(g["share_image"]), share_alt=esc(share_alt(g)),
            share_w=png_size(g["share_image"])[0], share_h=png_size(g["share_image"])[1],
            launch=launch_markup(g), heroart=hero_markup(g), bg=g["palette"]["bg"], ink=g["palette"]["ink"],
            accent=g["palette"]["accent"], titlevw=title_vw(g["title"]),
        )
        d = os.path.join(ROOT, "games", slug)
        if not os.path.isdir(d): os.makedirs(d)
        p = os.path.join(d, "index.html")
        io.open(p, "w", encoding="utf-8", newline="\n").write(COMING_SOON.format(**ctx))
        made.append(p.replace(ROOT + os.sep, ""))
        # no play route for a game that is not there to play - remove whatever playable output survives
        # from before this channel went coming_soon (gen.py only ever creates/overwrites, never deletes)
        play_dir = os.path.join(ROOT, "play", slug)
        if os.path.isdir(play_dir):
            shutil.rmtree(play_dir)
        continue

    nxt = NEXT[slug]
    ctx = dict(
        site=SITE, slug=slug, ch=g["ch"], title=esc(g["title"]), eyebrow=esc(g["eyebrow"]),
            brand=brand_markup(slug), page_title=esc(page_title(slug,g["title"])),
        host=esc(g["host"]), premise=esc(g["premise"]), cta=esc(g["cta"]), cta2=esc(g["cta2"]),
        does=esc(g["does"]), duration=esc(g.get("duration") or "a few minutes"),
        finish=esc(g["finish"]), inp=esc(g["input"]),
        teaser=esc(g.get("teaser") or ""), hero=esc(g.get("hero") or ""),
        share_image=esc(g["share_image"]), share_alt=esc(share_alt(g)),
        share_w=png_size(g["share_image"])[0], share_h=png_size(g["share_image"])[1],
        launch=launch_markup(g), heroart=hero_markup(g), bg=g["palette"]["bg"], ink=g["palette"]["ink"], accent=g["palette"]["accent"],
        titlevw=title_vw(g["title"]),
        roots=esc(json.dumps({"roots": g["roots"], "hide": g["hide"]}, ensure_ascii=False)),
        orientation=('<aside class="rotate-notice" aria-labelledby="rotate-title"><span aria-hidden="true">↻</span><h1 id="rotate-title">Turn your phone to landscape</h1><p>The production line needs a wider view.</p><a href="../games/girlfriend/#information">Read the research &amp; questions</a><button type="button" id="portraitContinue">Use portrait controls instead</button></aside>' if slug == 'girlfriend' else ''),
        api=esc(API_BASE), mission_id=esc(g.get("mission_id") or ""), station=esc(STATION),
        progress_key=esc(g.get("progress_key") or ""), continue_cta=esc(g.get("continue_cta") or ""),
        next_slug=nxt["slug"], next_ch=nxt["ch"], next_title=esc(nxt["title"]),
        next_premise=esc(nxt["premise"]),
        profile_intro=esc(g["profile_intro"]), questions=questions_markup(g),
        information=information_markup(slug), profile_title=profile_title(slug),
        mission=MISSION, live_links=LIVE_LINKS, identity=IDENTITY_BLOCK,
        rules_line=RULES_LINE, identity_note=IDENTITY_NOTE,
        live_at=esc(LIVE.get("next_broadcast_at") or ""), live_url=esc(LIVE.get("broadcast_url") or ""),
    )
    for sub, tpl in (("games", LANDING), ("play", PLAY)):
        d = os.path.join(ROOT, sub, slug)
        if not os.path.isdir(d): os.makedirs(d)
        p = os.path.join(d, "index.html")
        io.open(p, "w", encoding="utf-8", newline="\n").write(tpl.format(**ctx))
        made.append(p.replace(ROOT + os.sep, ""))

print("\n".join(made))
print("%d files" % len(made))

from scene_markup import write_catalog
write_network_routes(ROOT)
