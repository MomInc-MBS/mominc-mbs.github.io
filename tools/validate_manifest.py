# -*- coding: utf-8 -*-
"""Validates tv/channel-manifest.json against the D.1.1 schema (PLAN-r8.md lines 1029-1135, corrected
by Codex round 5: five top-level keys, a twenty-field registry passthrough, status on sag/armie/goon,
and the inRegistry flag). stdlib only.

Run:  python tools/validate_manifest.py
"""
import io, json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PATH = os.path.join(ROOT, "tv", "channel-manifest.json")

# The real channel set, frozen from tv.js's CHANNELS list at the time this manifest was written
# (2.3 deletes that literal list from tv.js, so it can no longer be re-derived by parsing the file;
# "allgames" is a nav link out to /games/, not a channel, and is deliberately excluded here).
EXPECTED_IDS = {"mominc", "fuel", "goon", "lilboyfriend", "djscratch", "corgi", "sag", "girlfriend", "armie"}

TOP_KEYS = {"note", "live", "identity_api", "api_base", "channels"}
STATUS_ENUM = {"live", "upcoming", "archive", "coming_soon", "suppressed"}
ANCHOR_ENUM = {"bottom-left", "bottom-right", None}
PASSTHROUGH_FIELDS = [
    "host", "eyebrow", "genre", "premise", "cta", "does", "duration", "input", "hero", "teaser",
    "roots", "hide", "palette", "finish", "cta2", "progress_key", "continue_cta", "profile_intro",
    "profile_questions", "share_image",
]
RECORD_FIELDS = {
    "id", "channel", "title", "lcdName", "status", "active", "airDate", "preview", "mission", "reward",
    "route", "gameRoute", "theme", "meter", "cursor", "effect", "coachAnchor", "department",
    "suppressed", "secretSequence", "controlDigits", "missionId", "apiBase", "redeemPath",
    "inRegistry", "registry",
}

errs = []


def err(msg):
    errs.append(msg)


def is_str(v):
    return isinstance(v, str)


def is_str_or_null(v):
    return v is None or isinstance(v, str)


def main():
    try:
        m = json.load(io.open(PATH, encoding="utf-8"))
    except Exception as e:
        err("could not parse manifest: %s" % e)
        report()
        return

    extra_top = set(m.keys()) - TOP_KEYS
    missing_top = TOP_KEYS - set(m.keys())
    if extra_top:
        err("unexpected top-level key(s): %s" % sorted(extra_top))
    if missing_top:
        err("missing top-level key(s): %s" % sorted(missing_top))
    if not is_str(m.get("note", None)):
        err("top-level `note` must be a string")
    if not is_str(m.get("identity_api", "")) or not isinstance(m.get("identity_api"), str):
        err("top-level `identity_api` must be a string")
    if not isinstance(m.get("api_base"), str):
        err("top-level `api_base` must be a string")
    if not isinstance(m.get("live"), dict):
        err("top-level `live` must be an object")

    channels = m.get("channels")
    if not isinstance(channels, list):
        err("`channels` must be a list")
        report()
        return

    if len(channels) != len(EXPECTED_IDS):
        err("record count %d != expected channel count %d" % (len(channels), len(EXPECTED_IDS)))

    seen_ids = []
    for i, rec in enumerate(channels):
        where = "channels[%d]" % i
        if not isinstance(rec, dict):
            err("%s is not an object" % where)
            continue
        extra = set(rec.keys()) - RECORD_FIELDS
        missing = RECORD_FIELDS - set(rec.keys())
        if extra:
            err("%s: unexpected field(s) %s" % (where, sorted(extra)))
        if missing:
            err("%s: missing field(s) %s" % (where, sorted(missing)))

        cid = rec.get("id")
        where = "channel %r" % cid
        if not is_str(cid):
            err("%s: id must be a string" % where)
        else:
            seen_ids.append(cid)

        if not isinstance(rec.get("channel"), int) or isinstance(rec.get("channel"), bool):
            err("%s: channel must be an integer" % where)
        if not is_str(rec.get("title")):
            err("%s: title must be a string" % where)
        if not is_str(rec.get("lcdName")):
            err("%s: lcdName must be a string" % where)
        if rec.get("status") not in STATUS_ENUM:
            err("%s: status %r not in %s" % (where, rec.get("status"), sorted(STATUS_ENUM)))
        if not isinstance(rec.get("active"), bool):
            err("%s: active must be a boolean" % where)
        for f in ("airDate", "preview", "mission", "reward"):
            if not is_str_or_null(rec.get(f)):
                err("%s: %s must be a string or null" % (where, f))
        if not is_str(rec.get("route")):
            err("%s: route must be a string" % where)
        if rec.get("route") != "?ch=%s" % cid:
            err("%s: route must be ?ch=<id>" % where)
        if not is_str_or_null(rec.get("gameRoute")):
            err("%s: gameRoute must be a string or null" % where)
        for f in ("theme", "meter", "cursor", "effect"):
            if not is_str_or_null(rec.get(f)):
                err("%s: %s must be a string or null" % (where, f))
        if rec.get("coachAnchor") not in ANCHOR_ENUM:
            err("%s: coachAnchor must be bottom-left, bottom-right or null" % where)
        dept = rec.get("department")
        if dept is not None:
            if not isinstance(dept, dict) or set(dept.keys()) != {"label", "position", "requires"}:
                err("%s: department must be null or {label, position, requires}" % where)
            elif not is_str(dept.get("label")):
                err("%s: department.label must be a string" % where)
        supp = rec.get("suppressed")
        if supp is not None:
            if not isinstance(supp, dict) or set(supp.keys()) != {"reason", "blockedOn"}:
                err("%s: suppressed must be null or {reason, blockedOn}" % where)
            else:
                if not is_str(supp.get("reason")):
                    err("%s: suppressed.reason must be a string" % where)
                bo = supp.get("blockedOn")
                if not isinstance(bo, list) or not all(is_str(x) for x in bo):
                    err("%s: suppressed.blockedOn must be a list of strings" % where)
        if not is_str_or_null(rec.get("secretSequence")) and not isinstance(rec.get("secretSequence"), list):
            err("%s: secretSequence must be a list or null" % where)
        if rec.get("controlDigits") is not None and not isinstance(rec.get("controlDigits"), dict):
            err("%s: controlDigits must be an object or null" % where)
        if not is_str_or_null(rec.get("missionId")):
            err("%s: missionId must be a string or null" % where)
        if not is_str_or_null(rec.get("apiBase")):
            err("%s: apiBase must be a string or null" % where)
        if not is_str(rec.get("redeemPath")):
            err("%s: redeemPath must be a string" % where)
        if not isinstance(rec.get("inRegistry"), bool):
            err("%s: inRegistry must be a boolean" % where)
        reg = rec.get("registry")
        if rec.get("inRegistry"):
            if not isinstance(reg, dict):
                err("%s: registry must be an object when inRegistry is true" % where)
            else:
                extra_r = set(reg.keys()) - set(PASSTHROUGH_FIELDS)
                missing_r = set(PASSTHROUGH_FIELDS) - set(reg.keys())
                if extra_r:
                    err("%s: registry has unexpected field(s) %s" % (where, sorted(extra_r)))
                if missing_r:
                    err("%s: registry is missing field(s) %s" % (where, sorted(missing_r)))
        else:
            if reg is not None:
                err("%s: registry must be null when inRegistry is false" % where)

    if len(seen_ids) != len(set(seen_ids)):
        err("duplicate channel id(s) in manifest")
    if set(seen_ids) != EXPECTED_IDS:
        missing = EXPECTED_IDS - set(seen_ids)
        extra = set(seen_ids) - EXPECTED_IDS
        if missing:
            err("manifest is missing channel id(s): %s" % sorted(missing))
        if extra:
            err("manifest has unexpected channel id(s): %s" % sorted(extra))

    report()


def report():
    if errs:
        print("FAIL (%d issue%s)" % (len(errs), "" if len(errs) == 1 else "s"))
        for e in errs:
            print("  - " + e)
        sys.exit(1)
    print("PASS - manifest valid, %d channel records" % len(json.load(io.open(PATH, encoding="utf-8"))["channels"]))


if __name__ == "__main__":
    main()
