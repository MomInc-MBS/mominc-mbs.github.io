"""Vendor Pyramid Jump from the Coach repo into arcade/pyramid-jump/ (copy + small, asserted patches).

Run: python tools/sync_pyramid_jump.py [--source D:/myr5-work/coach-run-hud-1029]
Reads files from the source repo's HEAD with `git show` (read-only, ignores dirty/CRLF working files),
applies the numbered patches below (each anchor must match exactly once), writes LF files and
arcade/pyramid-jump/SYNC.json (origin commit + blob ids). Second run = no diff.
Site-owned files (never overwritten): site-shims.mjs, paper.mjs, rounds.mjs.
"""
from pathlib import Path
import argparse
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'arcade/pyramid-jump'
DEFAULT_SOURCE = 'D:/myr5-work/coach-run-hud-1029'
# (source path in the Coach repo, file name here)
FILES = [('arcade/pyramid-jump/game.mjs', 'game.mjs'), ('arcade/pyramid-jump/logic.mjs', 'logic.mjs'),
         ('arcade/pyramid-jump/data.mjs', 'data.mjs'), ('arcade/shell-phase.mjs', 'shell-phase.mjs')]

ME_START = "ctx.shadowColor=flat?'transparent':'#49334b88';ctx.shadowOffsetX=3*scale;ctx.shadowOffsetY=3*scale;ctx.fillStyle=art.colour;"
ME_END = "ctx.fillStyle='#2a1838';ctx.beginPath();ctx.arc(ex+er*.5,ey,er*.8,0,7);ctx.fill();"
BEST = "const s=Math.floor(maxY/10);if(s>best){best=s;try{localStorage.setItem(BEST_KEY,String(best));}catch{/* ignore */}}"

P11_NOTE = 'P11 hold: option `hold` (Promise); until it settles the loop draws but never steps, keys and tilt are ignored, phase is paused'

# game.mjs patches: (id, anchor, replacement). Keep each one small; they are the whole local adapter diff.
PATCHES = [
    ('P1 shell-phase import', "'../shell-phase.mjs'", "'./shell-phase.mjs'"),
    ('P2 performance import', "'../../performance-progress.mjs'", "'./site-shims.mjs'"),
    ('P3 quest import', "'../quest-progress-reporter.mjs'", "'./site-shims.mjs'"),
    ('P4 options: paperImg (not `paper`: game.mjs already has a paper() function) + onEnd callback', "seed=Date.now(),startLevel=0,auto=false}={}",
     "seed=Date.now(),startLevel=0,auto=false,paperImg=null,onEnd=null}={}"),
    ('P5 death hands over to the host when onEnd is given', "showOver(`${why}",
     "if(onEnd){onEnd({won:false,why,score:s,level:cur+1,best});return;}showOver(`${why}"),
    ('P6 win hands over to the host when onEnd is given', "reportQuest?.record('pyramid-complete',1);showOver(",
     "reportQuest?.record('pyramid-complete',1);if(onEnd){" + BEST +
     "onEnd({won:true,why:'WON',score:s,level:LEVEL_COUNT,best});return;}showOver("),
    ('P7 draw the pre-rendered paper Coach (exact batch look) instead of the roster path', ME_START,
     "if(paperImg){ctx.shadowColor=flat?'transparent':'#49334b88';ctx.shadowOffsetX=3*scale;ctx.shadowOffsetY=3*scale;ctx.drawImage(paperImg,0,0,200,240);ctx.shadowColor='transparent';}else{" + ME_START),
    ('P8 close the paper branch', ME_END, ME_END + "}"),
    ('P9 MOM site: steer by arrow keys and leaning only (Ian 24 Nov), no touch/mouse halves',
     "canvas.addEventListener('pointerdown',pd);addEventListener('pointerup',pu);addEventListener('pointercancel',pu);", ""),
    ('P10 label matches the controls', "Tilt or touch the left and right sides to steer.", "Lean your phone or use the left and right arrow keys to steer."),
    # P11 hold (Coach Jump pyramid menu): option `hold` (a Promise). Until it settles the loop keeps drawing but never steps (no physics,
    # timer or score), keys and tilt are ignored and the shell phase reads 'paused'. Without `hold` every line behaves as before.
    ('P11 hold: option', "paperImg=null,onEnd=null}={}", "paperImg=null,onEnd=null,hold=null}={}"),
    ('P11 hold: gate tilt', " const unsub=subscribeMotion?.(sample=>{tilt=",
     " let holding=!!hold;hold?.then(()=>{holding=false},()=>{holding=false});\n const unsub=subscribeMotion?.(sample=>{if(holding)return;tilt="),
    ('P11 hold: gate keys', "const key=down=>e=>{const k=e.key;", "const key=down=>e=>{if(holding)return;const k=e.key;"),
    ('P11 hold: gate phase', "shell.phase(!dead&&!won&&!document.hidden?'active':'paused')", "shell.phase(!dead&&!won&&!holding&&!document.hidden?'active':'paused')"),
    ('P11 hold: gate step', "if(!document.hidden){step(dt);draw();}", "if(!document.hidden){if(!holding)step(dt);draw();}"),
]


def git(source, *args):
    return subprocess.check_output(['git', '-C', source, *args], text=True, encoding='utf-8').strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', default=DEFAULT_SOURCE)
    source = ap.parse_args().source
    commit = git(source, 'rev-parse', 'HEAD')
    OUT.mkdir(parents=True, exist_ok=True)
    record = {'origin': 'MYR5 Coach repo (local worktree ' + source + ')', 'commit': commit, 'files': {}, 'patches': list(dict.fromkeys(P11_NOTE if p[0].startswith('P11') else p[0] for p in PATCHES))}
    for src, name in FILES:
        text = subprocess.check_output(['git', '-C', source, 'show', f'{commit}:{src}']).decode('utf-8').replace('\r\n', '\n')
        record['files'][name] = {'from': src, 'blob': git(source, 'rev-parse', f'{commit}:{src}')}
        if name == 'game.mjs':
            for label, anchor, new in PATCHES:
                if text.count(anchor) != 1:
                    raise SystemExit(f'{label}: anchor found {text.count(anchor)} times in game.mjs (expected 1); source changed, update the patch')
                text = text.replace(anchor, new)
        (OUT / name).write_text(text, encoding='utf-8', newline='\n')
        print('wrote', name)
    (OUT / 'SYNC.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('pinned', commit)


if __name__ == '__main__':
    main()
