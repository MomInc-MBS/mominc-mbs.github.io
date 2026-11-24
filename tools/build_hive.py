"""Build the HIVE web reference from an unmodified research-vault export.

Usage: python tools/build_hive.py /path/to/HIVE_Framework_Research_Vault --zip /path/to/original.zip
Requires markdown-it-py and PyYAML. Generated pages have stable, case-sensitive IDs.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import posixpath
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

import yaml
from markdown_it import MarkdownIt
from markdown_it.token import Token

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'hive'
BASE = '/hive/'
ORIGIN = 'https://mominc.online'
LABELS = {
    'index': 'Index', 'framework': 'Framework', 'topic': 'Topic',
    'research_path': 'Research path', 'frontier_path': 'Frontier path',
    'source': 'Primary source', 'historical_source': 'Source history',
    'prior_method': 'Prior method', 'legacy_catalog_entry': 'Legacy catalog',
    'experiment': 'Experiment', 'decision': 'Decision', 'metaphor': 'Metaphor',
    'claim': 'Claim', 'build': 'Local build', 'audit': 'Package audit',
    'template': 'Template', 'original': 'Archived original',
    'design_proposal': 'Design proposal',
    'primary_source_reviewed': 'Primary source reviewed',
    'prior_artifact_reviewed': 'Prior artifact reviewed',
    'historical_import_not_reverified': 'Historical import · not reverified',
    'preserved_original': 'Preserved original',
    'primary_observation_linked': 'Primary observation linked',
    'navigation': 'Navigation', 'hypothesis': 'Hypothesis',
    'scoped_claim_with_links': 'Scoped claim with links', 'artifact_checks': 'Artifact checks',
    'not_implemented': 'Not implemented', 'generated': 'Generated',
    'proposed_implementation': 'Proposed implementation',
    'external_research_synthesis_not_reproduced': 'External research synthesis · Not reproduced',
    'owner_decision_record': 'Owner decision record',
    'source_inspection_not_executed': 'Source inspection · Not executed',
    'research_synthesis_and_provisional_decision': 'Research synthesis · Provisional decision',
}
NAV = [('HOME', 'Start here'), ('STATUS', 'Implementation status'), ('READINESS', 'v0.3.0.dev4 readiness'), ('INTEGRATION', 'Historical dev3 integration'), ('WORKING', 'Video mission alpha'), ('V03', 'v0.3 foundation'), ('CONTROLLER', 'Adaptive controller - v0.2'), ('PROTOTYPE', 'Local prototype - v0.1'), ('ADAPTIVE', 'Latest research update'), ('LANDSCAPE', 'External landscape · 22 Nov'), ('WHOLE', 'Integrated design map'), ('DIRECTION', 'Owner decisions · 22 Nov'), ('KERNELS', 'Kernel comparison'), ('METABASE', 'Base for later self-improvement'), ('LIVEDEMO', 'Live local-model demo · 22 Nov'), ('UNIFIED', 'Unified integration · 22 Nov'), ('V04X', 'Autonomous experiment checkpoint · 23 Nov'), ('CODER', 'Coder directions · 0.4'), ('FRAMEWORK', 'The framework'), ('MAP', 'Research map'),
       ('DECISIONS', 'Open decisions'), ('EVIDENCE', 'Evidence & disagreement'),
       ('HISTORY', 'Previous work'), ('ROADMAP', 'Build roadmap'), ('ARCHIVE', 'Original documents')]


def esc(value):
    return html.escape(str(value), quote=True)


def label(value):
    return LABELS.get(value, value.replace('_', ' ').capitalize())


def url(node):
    return BASE + 'notes/' + quote(node['id'], safe='') + '/'


def source_url(node):
    return node.get('source_url', BASE + 'vault/' + quote(node['path'], safe='/'))


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8', newline='\n')


def frontmatter(text):
    match = re.match(r'^---\r?\n(.*?)\r?\n---\r?\n', text, re.S)
    return (yaml.safe_load(match[1]), text[match.end():]) if match else ({}, text)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('vault', type=Path)
    ap.add_argument('--zip', type=Path, required=True)
    args = ap.parse_args()
    vault = args.vault.resolve()
    graph = json.loads((vault / '99_Data/research_graph.json').read_text(encoding='utf-8'))
    nodes = {n['id']: dict(n) for n in graph['nodes']}
    by_path = {n['path']: n for n in nodes.values()}
    for node in nodes.values():
        meta, body = frontmatter((vault / node['path']).read_text(encoding='utf-8'))
        node.update(body=body, tags=meta.get('tags', []))
    updates = json.loads((OUT / 'updates/index.json').read_text(encoding='utf-8'))
    release = json.loads((OUT / 'CURRENT_RELEASE.json').read_text(encoding='utf-8'))
    for entry in updates['entries']:
        source = OUT / entry['path']
        if hashlib.sha256(source.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError('Update source digest mismatch: ' + entry['path'])
        if entry['id'] in nodes:
            raise ValueError('Update ID would overwrite original research: ' + entry['id'])
        _, body = frontmatter(source.read_text(encoding='utf-8'))
        node = dict(entry, body=body, source_url=BASE + entry['path'])
        nodes[node['id']] = node
        by_path[node['path']] = node
    for i, edge in enumerate(updates['edges']):
        if edge['source'] not in nodes or edge['target'] not in nodes:
            raise ValueError('Unknown update relationship endpoint')
        graph['edges'].append(dict(id=f'update_0_4_{i + 1:03}', **edge))
    current_coder = nodes[updates['current_coder_id']]
    latest_research = nodes[updates['latest_research_id']]
    latest_implementation = nodes[release['release_id']]
    release_zip = BASE + release['download']
    supplement_link = ''
    if supplement := release.get('engineering_supplement'):
        supplement_link = (f' · <a href="{url(nodes[supplement["note_id"]])}">Engineering supplement</a>'
                          f' · <a href="{BASE}{supplement["publication_manifest"]}">Supplement manifest</a>')
    release_block = (f'<section class="release-pointer"><h2>Frozen engineering baseline: {esc(release["version"])}</h2>'
                     f'<p><strong>{esc(release["status"])}</strong> · Level A {esc(release["level_a"])} '
                     f'({release["level_a_attempted"]} attempted, {release["level_a_accepted"]} accepted) · '
                     f'Level B {esc(release["level_b"])} · candidate promotion: no.</p>'
                     f'<p>Runtime source SHA-256: <code>{esc(release["runtime_source_sha256"])}</code><br>'
                     f'Download SHA-256: <code>{esc(release["download_sha256"])}</code></p>'
                     f'<p><a href="{release_zip}" download>Download HIVE {esc(release["version"])}</a> · '
                     f'<a href="{BASE}{release["publication_manifest"]}">Frozen publication manifest</a>{supplement_link} · '
                     f'<a href="{url(latest_implementation)}">Read readiness evidence</a></p></section>')
    if latest_pointer := release.get('latest_verified'):
        latest = json.loads((OUT / latest_pointer['publication_manifest']).read_text(encoding='utf-8'))
        release_block += (f'<section class="release-pointer"><h2>Latest verified engineering: {esc(latest["runtime_version"])}</h2>'
                          f'<p><strong>{esc(latest["status"])}</strong> · {esc(latest.get("evidence_scope", "Synthetic development evidence"))}. '
                          f'Level A remains not accepted; Level B untested; no policy promotion.</p>'
                          f'<p>Runtime SHA-256: <code>{esc(latest["runtime_source_sha256"])}</code><br>'
                          f'Download SHA-256: <code>{esc(latest["download_sha256"])}</code></p>'
                          f'<p><a href="{url(nodes[latest_pointer["note_id"]])}">Read the latest verified result</a> · '
                          f'<a href="{BASE}{latest["download"]}" download>Download {esc(latest["runtime_version"])}</a> · '
                          f'<a href="{BASE}{latest_pointer["publication_manifest"]}">Publication manifest</a></p></section>')
    navigation = list(NAV)
    if latest_pointer and latest_pointer['note_id'] not in {key for key, _ in navigation}:
        navigation.insert(2, (latest_pointer['note_id'], f'Latest engineering · {latest["runtime_version"]}'))
    # Originals receive a reading view as well as their byte-identical download.
    originals = []
    for p in sorted((vault / '90_Archive/Originals').glob('*')):
        if p.suffix == '.md':
            n = dict(id='original-' + p.stem, path=p.relative_to(vault).as_posix(),
                     title=p.stem.replace('_', ' '), type='original',
                     status='historical', evidence_status='preserved_original',
                     implementation_status='historical', body=p.read_text(encoding='utf-8'), tags=[])
            by_path[n['path']] = n
            originals.append(n)

    wiki_paths = defaultdict(list)
    for n in by_path.values():
        wiki_paths[Path(n['path']).stem.casefold()].append(n)

    def resolve(path, current):
        parsed = urlsplit(path)
        if parsed.scheme or parsed.netloc or path.startswith(('#', '/')):
            return path
        relative = posixpath.normpath(posixpath.join(posixpath.dirname(current), unquote(parsed.path)))
        dest = url(by_path[relative]) if relative in by_path else BASE + 'vault/' + quote(relative, safe='/')
        return dest + ('?' + parsed.query if parsed.query else '') + ('#' + parsed.fragment if parsed.fragment else '')

    # A small heading index gives every rendered section a stable anchor.
    def render(node):
        md = MarkdownIt('commonmark', {'html': False}).enable('table').enable('strikethrough')
        body = re.sub(r'^\\\[[ \t]*\n([\s\S]*?)\n\\\][ \t]*$',
                      lambda m: '```math\n' + m[1] + '\n```', node['body'], flags=re.M)
        # Table separators inside mathematical/code notation are content, not
        # additional columns. Fenced examples retain their exact visible text.
        lines, fence = [], None
        for line in body.splitlines():
            marker = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
            if marker:
                if fence is None:
                    fence = marker[1]
                elif marker[1][0] == fence[0] and len(marker[1]) >= len(fence):
                    fence = None
            elif fence is None and line.lstrip().startswith('|'):
                line = re.sub(r'`[^`]+`', lambda m: re.sub(r'(?<!\\)\|', r'\\|', m[0]), line)
            lines.append(line)
        body = '\n'.join(lines)
        tokens = md.parse(body)
        toc, seen = [], Counter()
        missing_sources = set()
        for i, t in enumerate(tokens):
            if t.type == 'heading_open':
                title = tokens[i + 1].content
                anchor = re.sub(r'[^\w\s-]', '', title.lower()).strip()
                anchor = re.sub(r'\s+', '-', anchor)
                seen[anchor] += 1
                if seen[anchor] > 1:
                    anchor += '-' + str(seen[anchor])
                t.attrSet('id', anchor)
                if t.tag in ('h2', 'h3'):
                    toc.append((t.tag, anchor, title))
            # Wiki references resolve only to actual supplied documents. A missing
            # source points to an explicit gap record rather than an invented page.
            if t.type == 'inline':
                expanded = []
                for child in t.children or []:
                    if child.type != 'text' or '[[' not in child.content:
                        expanded.append(child)
                        continue
                    start = 0
                    for match in re.finditer(r'\[\[([^\[\]\n]+)\]\]', child.content):
                        prefix = Token('text', '', 0)
                        prefix.content = child.content[start:match.start()]
                        expanded.append(prefix)
                        name = match[1]
                        candidates = wiki_paths.get(name.removesuffix('.md').casefold(), [])
                        link = Token('link_open', 'a', 1)
                        link.attrSet('href', url(candidates[0]) if len(candidates) == 1 else '#source-gaps')
                        if len(candidates) != 1:
                            missing_sources.add(name)
                            link.attrSet('class', 'source-gap-link')
                            link.attrSet('title', 'Source file not supplied; see source gaps below')
                        text = Token('text', '', 0)
                        text.content = name
                        expanded.extend([link, text, Token('link_close', 'a', -1)])
                        start = match.end()
                    suffix = Token('text', '', 0)
                    suffix.content = child.content[start:]
                    expanded.append(suffix)
                t.children = expanded
            for child in (t.children or []):
                if child.type == 'link_open':
                    href = child.attrGet('href')
                    child.attrSet('href', resolve(href, node['path']))
                    if href.startswith(('https://', 'http://')):
                        child.attrSet('rel', 'noreferrer')
                elif child.type == 'image':
                    child.attrSet('src', resolve(child.attrGet('src'), node['path']))
                    child.attrSet('loading', 'lazy')
        result = md.renderer.render(tokens, md.options, {})
        result = re.sub(r'<table>(.*?)</table>', r'<div class="table-wrap" tabindex="0">' + r'<table>\1</table></div>', result, flags=re.S)
        if missing_sources:
            names = ''.join(f'<li>{esc(name)}</li>' for name in sorted(missing_sources))
            result += f'<section class="source-gaps" id="source-gaps"><h2>Source files not supplied</h2><p>The update names these documents, but they are not included in the supplied reference materials. Their underlying claims and duplicate-file hashes have not been independently checked for this publication.</p><ul>{names}</ul></section>'
            toc.append(('h2', 'source-gaps', 'Source files not supplied'))
        node['unresolved_sources'] = sorted(missing_sources)
        return '\n'.join(line.rstrip() for line in result.split('\n')), toc

    def shell(title, content, path, active='', description='', extra='', body_class=''):
        navlinks = ''.join(f'<a href="{url(nodes[k])}" {"aria-current=page" if k == active else ""}>{esc(t)}</a>' for k, t in navigation if k in nodes)
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · HIVE</title><meta name="description" content="{esc(description or 'The HIVE framework research vault: topics, evidence, experiments, decisions, and preserved source history.')}">
<meta name="theme-color" content="#29143f"><link rel="canonical" href="{ORIGIN}{path}">
<meta property="og:title" content="{esc(title)} · HIVE"><meta property="og:description" content="A framework for specialists that learn. An inspectable record of the research behind it.">
<link rel="icon" href="{BASE}assets/hive.svg?v=2" type="image/svg+xml"><link rel="stylesheet" href="{BASE}assets/hive.css?v=3"><link rel="stylesheet" href="{BASE}assets/diagrams.css?v=3"><link rel="stylesheet" href="{BASE}assets/research.css?v=1">
<script defer src="{BASE}assets/hive.js?v=3"></script>{extra}</head>
<body class="{body_class}"><a class="skip" href="#main">Skip to content</a>
<header class="masthead"><a class="brand" href="{BASE}" aria-label="HIVE home"><img src="{BASE}assets/hive.svg?v=2" width="35" height="35" alt=""><span>HIVE<span class="brand-sub">RESEARCH VAULT</span></span></a>
<nav class="topnav" aria-label="Primary"><a href="{url(nodes['FRAMEWORK'])}">Framework</a><a href="{BASE}explore/">Explore</a><a href="{BASE}graph/">Graph</a><a href="{url(nodes[latest_pointer['note_id']]) if latest_pointer else url(latest_implementation)}">Implementation</a><a href="{url(current_coder)}">Coder directions</a></nav>
<a class="search-trigger" href="{BASE}search/"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><span>Search the vault</span><kbd>/</kbd></a>
<button class="menu-button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open navigation">Menu</button></header>
<nav id="mobile-nav" class="mobile-nav" aria-label="Mobile" hidden>{navlinks}<a href="{BASE}explore/">Browse all pages</a><a href="{BASE}graph/">Interactive graph</a></nav>
{content}
<footer class="footer"><a class="footer-brand" href="{BASE}">HIVE <span>/ Framework 0.2 · Coder directions 0.4</span></a><span>Prepared for Ian Myers · 20 Nov 2026</span><div><a href="{source_url(latest_research)}" download>Research update</a><a href="{source_url(current_coder)}" download>Coder packet · 0.4</a><a href="{BASE}downloads/HIVE_Framework_Research_Vault.zip" download>Original vault · 0.2</a><a href="{BASE}llms.txt">Agent reference</a><a href="https://mominc.online/tv/">MOM Inc.</a></div></footer>
<div id="toast" class="toast" role="status" aria-live="polite"></div></body></html>'''

    OUT.mkdir(exist_ok=True)
    # Copy without transforming any source bytes, including the 19 originals.
    if vault != (OUT / 'vault').resolve():
        shutil.copytree(vault, OUT / 'vault', dirs_exist_ok=True, ignore=shutil.ignore_patterns('.obsidian', '__pycache__'))
    (OUT / 'downloads').mkdir(exist_ok=True)
    if args.zip.resolve() != (OUT / 'downloads/HIVE_Framework_Research_Vault.zip').resolve():
        shutil.copyfile(args.zip, OUT / 'downloads/HIVE_Framework_Research_Vault.zip')
    inbound = defaultdict(list)
    for edge in graph['edges']:
        inbound[edge['target']].append(edge)

    for node in [*nodes.values(), *originals]:
        if node['id'] in ('STATUS', 'RELEASES'):
            node['body'] = re.sub(r'<!-- readiness-dev4:start -->.*?<!-- readiness-dev4:end -->', '', node['body'], flags=re.S)
        rendered, toc = render(node)
        if node['id'] in ('STATUS', 'RELEASES'):
            rendered = release_block + rendered
        related = [e for e in inbound[node['id']] if e['source'] != node['id']]
        # Show the stronger typed relationships before general related-to links.
        related.sort(key=lambda e: (e['relation'] == 'related_to', e['relation'], nodes[e['source']]['title']))
        seen_related, items = set(), []
        for e in related:
            if e['source'] in seen_related:
                continue
            seen_related.add(e['source'])
            items.append(f'<a href="{url(nodes[e["source"]])}"><span>{esc(e["source"])}</span>{esc(nodes[e["source"]]["title"])}<small>{esc(e["relation"].replace("_", " "))}</small></a>')
        backlinks = f'<section class="backlinks"><h2>Referenced by <span>{len(items)}</span></h2><div>{"".join(items)}</div></section>' if items else ''
        navlinks = ''.join(f'<a href="{url(nodes[k])}" {"aria-current=page" if k == node["id"] else ""}>{esc(t)}</a>' for k, t in navigation if k in nodes)
        toc_html = ''.join(f'<a class="toc-{level}" href="#{esc(anchor)}">{esc(title)}</a>' for level, anchor, title in toc)
        status = f'<span class="badge">{esc(label(node["evidence_status"]))}</span>'
        impl = node.get('implementation_status', '')
        status += f'<span class="badge neutral">{esc(label(impl))}</span>' if impl and impl != 'generated' else ''
        graph_link = f'<a href="{BASE}graph/?focus={quote(node["id"])}">View connections</a>' if node['id'] in nodes else ''
        notice = '<p class="archive-notice">Preserved historical original. Statements below reflect this source document; they are not a current implementation or a new measurement.</p>' if node['type'] == 'original' else ''
        if node['id'] in ('HANDOFF', 'ROADMAP', 'HOME'):
            notice += f'<p class="update-notice">Coder directions have been updated. <a href="{url(current_coder)}">Read the current revision 0.4 handoff</a>. This page preserves the earlier framework 0.2 material.</p>'
        if node['id'] == current_coder['id']:
            notice += '<p class="update-notice"><strong>Current coder directions · Revision 0.4.</strong> The full supplied packet follows, including its evidence labels, unresolved choices, and source-recovery limits.</p>'
        if node['id'] in ('CODER', 'FRAMEWORK', 'ROADMAP', 'HOME', 'D02', 'D05', 'D07', 'D09', 'B07'):
            notice += f'<p class="research-notice"><strong>Latest research addendum.</strong> <a href="{url(latest_research)}">Adaptive organization and self-learning</a> adds provisional organizational direction, learning priorities, formula candidates, and proposed tests. Read it alongside this earlier material.</p>'
        if node['id'] in ('CODER', 'FRAMEWORK', 'ROADMAP', 'HOME', 'ADAPTIVE', 'HISTORY', 'B04', 'B06'):
            notice += f'<p class="update-notice"><strong>Measured implementation status.</strong> <a href="{BASE}notes/STATUS/">Inspect the local prototypes, evidence and remaining gaps</a>. Earlier research below is preserved. The caption candidate was rejected; the new learned router remains quarantined.</p>'
        if node['id'] == latest_research['id']:
            notice += '<p class="research-notice"><strong>Latest research update · 20 November 2026.</strong> This is a research synthesis and provisional design handoff. Proposed mechanisms and experiments are not implementation or benchmark evidence.</p>'
        citation_version = node.get('citation_label') or (f'HIVE coder directions {node["revision"]}' if node.get('revision') else 'HIVE framework 0.2')
        content = f'''<div class="doc-layout"><aside class="sidebar"><p class="eyebrow">THE RESEARCH</p>{navlinks}<div class="sidebar-rule"></div><a href="{BASE}explore/">Browse all {len(nodes)} pages</a><a href="{BASE}explore/?type=experiment">Experiments</a><a href="{BASE}explore/?type=source">Primary sources</a><a href="{BASE}explore/?type=legacy_catalog_entry">100-project catalog</a><a href="{BASE}downloads/HIVE_Framework_Research_Vault.zip" download>Download original vault · 0.2</a><p class="sidebar-note">A proposal is a starting point.<br>Evidence decides what stays.</p></aside>
<main id="main" class="doc-main"><div class="breadcrumb"><a href="{BASE}">HIVE</a><span>/</span><a href="{BASE}explore/?type={node['type']}">{esc(label(node['type']))}</a><span>/</span><span>{esc(node['id'])}</span></div>
<div class="doc-meta">{status}</div><div class="doc-tools"><button class="copy-link" data-title="{esc(node['title'])}" data-id="{esc(node['id'])}" data-series="{esc(citation_version)}">Copy reference</button><a href="{source_url(node)}">Markdown source</a>{graph_link}<button class="print-page">Print</button></div>
{notice}<article class="prose">{rendered}</article>{backlinks}</main>
<aside class="toc"><p class="eyebrow">ON THIS PAGE</p>{toc_html}<a class="back-top" href="#main">Back to top</a></aside></div>'''
        write(OUT / 'notes' / node['id'] / 'index.html', shell(node['title'], content, url(node), node['id'],
              body_class='integration-page' if node['id'] in ('INTEGRATION', 'READINESS') else ''))

    count = Counter(n['type'] for n in nodes.values())
    def card(node_id, desc):
        n = nodes[node_id]
        return f'<a class="entry-card" href="{url(n)}"><span class="eyebrow">{esc(label(n["type"]))}</span><h3>{esc(n["title"])}</h3><p>{esc(desc)}</p><span class="card-link">Read {esc(node_id)}</span></a>'

    topics = [n for n in nodes.values() if n['type'] == 'topic']
    topic_list = ''.join(f'<a class="topic-row" href="{url(n)}"><span class="topic-id">{n["id"]}</span><span>{esc(n["title"])}</span><span class="topic-open">Explore</span></a>' for n in topics)
    home = f'''<main id="main"><section class="hero"><div class="hero-copy"><div class="eyebrow light">MOM INC. / RESEARCH & SYSTEMS</div><p class="revision">Coder directions 0.4 <span>Framework 0.2</span></p><h1>Many specialists.<br>One evolving <em>HIVE.</em></h1><p class="hero-deck">A framework for systems that assemble specialists, learn from verified experience, and improve how they work together.</p><p class="hero-sub">Follow the ideas. Inspect the evidence. Keep the alternatives open.</p><div class="hero-actions"><a class="button primary" href="{url(current_coder)}">Read coder directions</a><a class="button ghost" href="{BASE}explore/">Explore the vault</a></div></div>
<div class="hero-system" aria-label="Proposed HIVE learning loop"><div class="system-caption">THE PROPOSED LEARNING LOOP</div><div class="system-core"><img src="{BASE}assets/hive.svg?v=2" width="56" height="56" alt=""><strong>HIVE</strong><span>State · selection · resources</span></div><div class="system-stages"><span>Specialists & tools</span><b>+</b><span>Verification</span><b>+</b><span>Evidence & experience</span></div><div class="system-return"><span>Candidate learning</span><span>Retention tests</span><span>Version registry</span></div><div class="system-foot">A candidate is promoted only after its gates pass.</div></div></section>
<div class="stats-strip"><div><strong>{len(nodes)}</strong><span>linked research pages</span></div><div><strong>{count['topic']}</strong><span>research topics</span></div><div><strong>{count['experiment']}</strong><span>experiment designs</span></div><div><strong>19</strong><span>preserved originals</span></div><a href="{BASE}graph/">Explore {len(graph['edges']):,} connections</a></div>
<section class="home-section evidence-section implementation-update"><div><p class="eyebrow">IMPLEMENTATION / {esc(release['version'])} ENGINEERING</p><h2>Bounded missions.<br>Inspectable evidence.</h2><p>The shared controller runs video work and isolated Python code repairs. All eleven pressure scenarios have executable engineering fixtures, independent checks and replay. Inspect the exact readiness gates, failures and source identities before treating this as research readiness.</p><a class="button dark" href="{url(latest_implementation)}">Read the readiness report</a> <a class="text-link" href="{BASE}notes/STATUS/">Implementation status</a></div><div class="evidence-key"><div><span class="badge neutral">ENGINEERING EVIDENCE</span><p>Real Docker checks cover a pinned image, restricted mounts, STOP, timeout and host death. The operator CLI runs both task families and checks saved evidence on restart. This campaign used zero new model calls. The source ZIP includes commands, tests and measured receipts.</p><a href="{url(latest_implementation)}">Inspect gates and download source</a></div><div><span class="badge">RESEARCH UNTESTED</span><p>The fresh 12-task acceptance campaign still needs approved sources and independent decisions. Sealed beneficial-learning research needs its own resources and protocol. Fixture model/team arms are proxies. The historical inventory candidate failed and P0 was retained; no policy promotion or transferable gain is claimed.</p><a href="{BASE}notes/INTEGRATION/">Historical dev3 run</a> · <a href="{BASE}notes/WORKING/">Video alpha</a></div></div></section>
<section class="latest-update"><div><p class="eyebrow">LATEST RESEARCH / 20 NOV 2026</p><h2>Adaptive organization and self-learning.</h2><p>Organization as a learnable component. Separate learning loops, a formula registry, and tests that preserve competing approaches.</p></div><a class="button dark" href="{url(latest_research)}">Read research update</a></section><section class="home-section"><div class="section-heading"><div><p class="eyebrow">FIND YOUR STARTING POINT</p><h2>A working record,<br>with the reasoning attached.</h2></div><p>This is a research and implementation specification. The vault preserves proposals, disagreements, prior results, and the tests that could change a decision.</p></div><div class="entry-grid">{card('READINESS', 'The dev4 shared mission runtime, eleven pressure smoke paths, exact readiness gates and reproducible evidence.')}{card('ADAPTIVE', 'The latest research: adaptive organizational duality, self-learning priorities, formula candidates, and proposed experiments.')}{card('DECISIONS', 'Compare live alternatives, tradeoffs, and the evidence needed to choose.')}{card('ROADMAP', 'Work packages, dependency order, and acceptance gates for the local build.')}</div></section>
<section class="topic-section"><div><p class="eyebrow">TEN CONNECTED TOPICS</p><h2>Follow a question<br>through the research.</h2><p>Every path connects to decisions, experiments, earlier methods, and sources. A connection is context; it is not proof.</p><a class="text-link" href="{BASE}graph/">Open the research graph</a></div><div class="topic-list">{topic_list}</div></section>
<section class="home-section evidence-section"><div><p class="eyebrow">KEEP THE RECORD HONEST</p><h2>Evidence has a history.</h2><p>Primary-source findings belong to their authors. Historical imports retain their original scope. Proposed experiments have no implied result.</p><a class="text-link" href="{url(nodes['EVIDENCE'])}">Read the evidence conventions</a></div><div class="evidence-key"><div><span class="badge">Primary source reviewed</span><p>Inspected source, with its limits intact.</p></div><div><span class="badge neutral">Design proposal</span><p>An implementation path still to test.</p></div><div><span class="badge historical">Historical import</span><p>Preserved prior work, not a fresh measurement.</p></div></div></section>
<section class="download-band"><div><p class="eyebrow light">TAKE THE WHOLE RECORD</p><h2>Your vault. In your tools.</h2><p>All notes, schemas, the Canvas, graph exports, and original documents. The original Obsidian vault, coder directions, and research addendum, each preserved as supplied.</p></div><div class="download-actions"><a class="button primary" href="{source_url(latest_research)}" download>Download research update <small>Markdown · 20 November 2026</small></a><a class="button ghost" href="{source_url(current_coder)}" download>Download coder packet <small>Markdown · Revision 0.4</small></a><a class="button ghost" href="{BASE}downloads/HIVE_Framework_Research_Vault.zip" download>Download original vault <small>ZIP · Framework 0.2</small></a></div></section></main>'''
    home = home.replace('</div></div></section>\n<section class="latest-update">', '</div></div>' + release_block + '</section>\n<section class="latest-update">', 1)
    if supplement:
        objective_intro = (f'<section class="home-section evidence-section implementation-update">'
                           f'<div><p class="eyebrow">OBJECTIVE TESTING / ENGINEERING SUPPLEMENT</p>'
                           f'<h2>Exact answers.<br>Checked after restart.</h2>'
                           f'<p>Six Python function tasks and six data tasks passed exact checks and saved-result replay. '
                           f'The new campaign needs no visual judgment.</p>'
                           f'<a class="button dark" href="{url(nodes[supplement["note_id"]])}">Read objective test results</a></div>'
                           f'<div class="evidence-key"><div><span class="badge neutral">SYNTHETIC DEVELOPMENT</span>'
                           f'<p>The fixed examples verify the pipeline. Both attempts, including the first replay failure, '
                           f'remain in the record. P2 tied the strongest tool and stays quarantined. '
                           f'No useful-learning gain or genuine task acceptance is claimed.</p></div></div></section>')
        home = home.replace('<section class="home-section evidence-section implementation-update">',
                            objective_intro + '<section class="home-section evidence-section implementation-update">', 1)
    if latest_pointer:
        latest_intro = (f'<section class="home-section evidence-section implementation-update">'
                        f'<div><p class="eyebrow">LATEST VERIFIED ENGINEERING / {esc(latest["runtime_version"])}</p>'
                        f'<h2>{esc(latest.get("headline", "Exact tools. Bounded feedback."))}</h2>'
                        f'<p>{esc(latest.get("summary", "The opt-in P2 candidate abstains when its required exact tool cannot run. Its saved decisions and feedback are checked again on replay."))}</p>'
                        f'<a class="button dark" href="{url(nodes[latest_pointer["note_id"]])}">Read results and limits</a></div>'
                        f'<div class="evidence-key"><div><span class="badge neutral">QUARANTINED CANDIDATE</span>'
                        f'<p>{esc(latest.get("limitations", "The six-task output comparison tied the strongest tool. No learning gain, genuine acceptance or policy promotion is claimed. The next acceptance scope remains six structured-data tasks and six Python tasks."))}</p></div></div></section>')
        home = home.replace('<section class="home-section evidence-section implementation-update">',
                            latest_intro + '<section class="home-section evidence-section implementation-update">', 1)
    write(OUT / 'index.html', shell('Framework & research vault', home, BASE, body_class='home'))

    search_records = []
    for n in nodes.values():
        text = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', n['body'])
        if n['id'] in ('STATUS', 'RELEASES'):
            text += f' Frozen baseline {release["version"]}: {release["status"]}; Level A {release["level_a"]} ({release["level_a_attempted"]} attempted, {release["level_a_accepted"]} accepted); Level B {release["level_b"]}; candidate promotion false; runtime SHA-256 {release["runtime_source_sha256"]}; ZIP SHA-256 {release["download_sha256"]}.'
            if latest_pointer:
                text += f' Latest verified engineering {latest["runtime_version"]}: {latest["status"]}; {latest.get("evidence_scope", "synthetic development")}, P2 quarantined, no useful-learning gain. Runtime SHA-256 {latest["runtime_source_sha256"]}; ZIP SHA-256 {latest["download_sha256"]}.'
        text = re.sub(r'[`#*|>]', '', text)
        search_records.append({k: n[k] for k in ['id', 'title', 'type', 'evidence_status', 'implementation_status']} | dict(url=url(n), text=re.sub(r'\s+', ' ', text), tags=n['tags']))
    write(OUT / 'search-index.json', json.dumps(search_records, ensure_ascii=False, separators=(',', ':')))
    types = sorted(count, key=label)
    type_options = ''.join(f'<option value="{t}">{esc(label(t))} ({count[t]})</option>' for t in types)
    evs = sorted({n['evidence_status'] for n in nodes.values()}, key=label)
    ev_options = ''.join(f'<option value="{e}">{esc(label(e))}</option>' for e in evs)
    for kind in ['search', 'explore']:
        is_search = kind == 'search'
        heading = 'Search the vault.' if is_search else 'The whole research record.'
        intro = 'Find a phrase, source, decision, or stable page ID.' if is_search else f'Browse {len(nodes)} pages. Follow a topic, compare alternatives, or go straight to the source.'
        static_cards = ''.join(f'<a class="result" href="{url(n)}"><div class="result-meta"><span>{n["id"]}</span><span>{esc(label(n["type"]))}</span></div><h2>{esc(n["title"])}</h2><span class="badge">{esc(label(n["evidence_status"]))}</span></a>' for n in nodes.values())
        content = f'''<main id="main" class="browse-main"><p class="eyebrow">HIVE / {'SEARCH' if is_search else 'EXPLORE'}</p><h1>{heading}</h1><p class="page-intro">{intro}</p><form id="vault-search" role="search"><div class="search-field"><label for="query">Search all page content</label><div><input id="query" name="q" type="search" placeholder="Try sleep, evidence, routing, or P02" autocomplete="off"><button class="button dark" type="submit">Search</button></div></div><div class="filters"><label>Page type<select id="type-filter" name="type"><option value="">All page types</option>{type_options}</select></label><label>Evidence status<select id="evidence-filter" name="evidence"><option value="">All evidence statuses</option>{ev_options}</select></label><button class="reset-filter" type="reset">Clear filters</button></div></form><p id="result-count" class="result-count" aria-live="polite">{len(nodes)} pages in the vault</p><div id="results" class="results">{static_cards}</div><p id="search-error" role="alert" hidden></p><noscript><p>All pages are listed above. Enable JavaScript for full-text search and filters.</p></noscript></main>'''
        write(OUT / kind / 'index.html', shell('Search' if is_search else 'Explore', content, BASE + kind + '/', extra='<script defer src="/hive/assets/search.js?v=3"></script>'))

    graph_export = dict(schema_version=graph['schema_version'], generated_date=graph['generated_date'],
                        nodes=[{k: n[k] for k in ['id', 'title', 'type', 'evidence_status']} | dict(url=url(n), source_url=source_url(n), revision=n.get('revision'), source_id=n.get('source_id'), unresolved_sources=n.get('unresolved_sources', [])) for n in nodes.values()], edges=graph['edges'])
    write(OUT / 'graph.json', json.dumps(graph_export, ensure_ascii=False, separators=(',', ':')))
    graph_content = f'''<main id="main" class="graph-main"><div class="graph-heading"><div><p class="eyebrow">HIVE / CONNECTIONS</p><h1>The research graph.</h1><p>{len(nodes)} pages. {len(graph['edges']):,} typed connections. Select a page to inspect its neighborhood.</p></div><a class="text-link" href="{BASE}graph.json" download>Download graph JSON</a></div><div class="graph-controls"><label>Find a page<input id="graph-query" type="search" placeholder="Search by title or ID"></label><label>Relationship<select id="relation-filter"><option value="">All relationships</option>{''.join(f'<option value="{r}">{r.replace("_", " ")}</option>' for r in sorted({e['relation'] for e in graph['edges']}))}</select></label><button id="graph-reset">Show full graph</button></div><p class="graph-note">Connections describe research relationships, not validation or authority. On a selected page, inspect a typed link before drawing a conclusion.</p><div class="graph-workspace"><div class="graph-canvas"><svg id="research-graph" viewBox="0 0 1000 760" role="img" aria-label="Research graph; use the page list to select a node"></svg><div id="graph-legend"></div></div><aside class="graph-panel"><p id="graph-summary" role="status">Loading graph…</p><div id="graph-selection"></div><div id="graph-pages" class="graph-pages"></div></aside></div><noscript><p>The interactive graph needs JavaScript. <a href="{BASE}explore/">Browse all pages</a> or download the JSON above.</p></noscript></main>'''
    write(OUT / 'graph/index.html', shell('Research graph', graph_content, BASE + 'graph/', extra='<script defer src="/hive/assets/graph.js?v=2"></script>'))
    llms = f'''# HIVE framework & research vault

> Framework revision 0.2, coder directions revision 0.4, adaptive research, and a scoped local empirical pilot. The public site is a static evidence reference. No production HIVE model service or compounding-learning result is claimed.

Canonical home: {ORIGIN}/hive/
Search: {ORIGIN}/hive/search/?q=your-query
Browse: {ORIGIN}/hive/explore/
Graph: {ORIGIN}/hive/graph/
Full-text machine index ({len(nodes)} pages): {ORIGIN}/hive/search-index.json
Typed graph: {ORIGIN}/hive/graph.json
Original package: {ORIGIN}/hive/downloads/HIVE_Framework_Research_Vault.zip

## Reading rules

{('- Latest verified engineering: /hive/notes/' + latest_pointer['note_id'] + '/. ' + latest['runtime_version'] + ': ' + latest['status'] + '. ' + latest.get('evidence_scope', 'Synthetic development evidence') + '. P2 quarantined; no beneficial-learning gain or promotion. Read the current result and remaining gates.') if latest_pointer else ''}
- Current implementation evidence is at /hive/notes/STATUS/. It links experiments, capabilities, learning progress, gaps, decisions and release history.
- Objective testing supplement: /hive/notes/OBJECTIVE/. Six Python and six data tasks, exact references and restart replay; public synthetic development, zero new HIVE model calls, P2 quarantined with no quality gain.
- Frozen engineering baseline: /hive/notes/READINESS/. Shared video/isolated-code missions, H01–H11 synthetic smoke, independent validators and exact R1–R8 gate evidence. Zero new model calls. Read the gate verdict; fixture success is not fresh task acceptance or a sealed learning study. Genuine source inventories and new resource approvals remain required.
- Historical integration run: /hive/notes/INTEGRATION/. Eleven jobs ran; the deterministic inventory task and local directive-classification training task passed. The learned inventory candidate lost to fixed P0 on a critical task and was rejected; the later P0 task passed. All four comparative classification arms missed their labels. The run recorded six local calls, 147 generated tokens, and 768 reserved tokens. Independent Terra acceptance is recorded. No adaptive, Level A/Level B, or frontier-model gain is claimed.
- Preserved video engineering alpha: /hive/notes/WORKING/. The historical v0.3.0.dev2 report records its original tests, CLI journeys, one real model call/17 generated tokens, and zero-call restart/STOP-resume. Previously edited input is excluded from unused A2 totals. Editorial acceptance, full Level A and Level B remain open. No policy is promoted.
- Historical controller: /hive/notes/CONTROLLER/. Thirty real local-model calls: direct 3/6, learned router 5/6, rejected model-plus-tool regression 4/6, then tool-only 6/6. Persistent experimental decisions, rollback and continuation are verified. Reused selection validation is not an unused holdout. Source and public evidence are downloadable.
- Earlier prototype: /hive/notes/PROTOTYPE/. Its 108-call comparison and six fresh-inference checks retain their original scope; no weight training or general superiority.
- The exact architecture change plan is at /hive/notes/GAPPLAN/. Original research is preserved; scope and dates determine what is implemented.
- The caption pilot uses real CPU software tools on synthetic fixtures. The procedure candidate was rejected against the best simple control; model arms are excluded, not simulated.
- Public artifacts identify input provenance and exposure; private evaluator stores and sealed per-case holdout labels/results are excluded. The dev3 comparison labels are development data, not holdout evidence. Same-machine replay is not independent scientific replication. Source configuration includes loopback runtime examples.
- Page IDs are stable; cite /hive/notes/ID/ and heading anchors.
- Each HTML page includes full readable text without JavaScript.
- Original source Markdown is under /hive/vault/ with preserved relative paths.
- Current coder directions are at /hive/notes/CODER/ (revision 0.4); cite these for current implementation instructions.
- The supplied packet is at /hive/updates/HIVE_Coder_Information_Packet_2026-11-20.md.
- HANDOFF and ROADMAP preserve framework 0.2 context; the newer coder packet takes precedence for current directions.
- The latest research addendum is /hive/notes/ADAPTIVE/: adaptive organizational duality, six learning layers, formula registry, promotion governor, and eight proposed experiments. Read it alongside CODER.
- External landscape: /hive/notes/LANDSCAPE/ records similar external systems found on 22 November 2026. External results were read, not reproduced; vendor claims are marked.
- Integrated design map: /hive/notes/WHOLE/ places those external parts into the HIVE design with adopt/adapt/study/decline stances and a proposed build order. It is a proposal; it approves no policy, weights or inference spending.
- Owner decisions: /hive/notes/DIRECTION/ records Ian Myers' decisions of 22 November 2026. Where it differs from a proposal on WHOLE, it governs. It grants no runtime authority; live inference still needs the separate local operator approval.
- Kernel comparison: /hive/notes/KERNELS/ compares the HIVE kernel, Aden Hive and Ruflo by source inspection. Nothing was executed; it is not a measured comparison.
- Base for later self-improvement: /hive/notes/METABASE/ proposes groundwork only. It does not open D09 or permit self-editing of gates.
- Live local-model demo: /hive/notes/LIVEDEMO/ records the first real local inference run (5 of 24 requests, O5 PASS, candidate rejected, P0 unchanged, replay zero calls).
- Unified integration: /hive/notes/UNIFIED/ records the 689-test integration campaign with zero model calls; Level A not accepted, Level B untested, learning unproven, P2 quarantined.
- Autonomous experiment checkpoint: /hive/notes/V04X/ records label ENGINEERING_AUTONOMOUS_EXPERIMENT_DEMONSTRATED (code 89a1118, 821 passed/3 skipped/1 load-sensitive flake, zero model calls); the candidate result was REJECT_NO_GAIN and is kept as a negative result; Level A not run; learning not demonstrated; FR-2 evaluator isolation is the next task.
- The addendum is a synthesis with provisional decisions; do not report it as measured implementation evidence.
- Source documents named but not supplied are explicitly listed under the addendum source-gaps section.
- Current graph update links are editorial navigation and retain their relation types.
- The original ZIP remains framework 0.2; download the coder packet and research addendum separately for the current reference.
- Preserve evidence_status and implementation_status when citing.
- Historical imports, proposed experiments, simulations, and real measurements are distinct.
- A graph edge is a relation, not proof. Proposed experiments do not imply results.
- The archive preserves 19 originals byte for byte.

## Entry points

''' + '\n'.join(f'- [{nodes[k]["title"]}]({ORIGIN}{url(nodes[k])})' for k, _ in navigation if k in nodes) + '\n'
    write(OUT / 'llms.txt', llms)
    all_pages = [BASE, BASE + 'explore/', BASE + 'search/', BASE + 'graph/'] + [url(n) for n in [*nodes.values(), *originals]]
    write(OUT / 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(f'<url><loc>{ORIGIN}{p}</loc></url>' for p in all_pages) + '\n</urlset>\n')
    manifest = dict(framework_revision='0.2', coder_revision=current_coder['revision'], latest_research_id=latest_research['id'], latest_implementation_id=latest_implementation['id'], current_release=release, updates=[{k: n[k] for k in ['id', 'path', 'revision', 'date', 'sha256'] if k in n} for n in updates['entries']], source_zip_sha256=hashlib.sha256(args.zip.read_bytes()).hexdigest(),
                    counts=dict(research_pages=len(nodes), graph_edges=len(graph['edges']), originals=19),
                    scope='Static research reference plus executable local model/tool controller evidence. No production model runtime or compounding-learning claim.')
    write(OUT / 'build-manifest.json', json.dumps(manifest, indent=2) + '\n')
    print(f'Built {len(nodes)} research pages, {len(originals)} original reading views, search, graph, and downloads into {OUT}')


if __name__ == '__main__':
    main()
