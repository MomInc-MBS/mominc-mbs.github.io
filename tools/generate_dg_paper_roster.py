"""Bake all local coach GLBs into small, flat SVG paper cutouts.

No network or model calls. Requires numpy, trimesh and opencv-python-headless.
Usage: python tools/generate_dg_paper_roster.py [--source D:/coach-merge/creature]
Geometry is orthographically projected from glTF +Z, with all scene transforms
applied. Triangle coverage masks are an intermediate only; shipped art is SVG.
Named eye descendants are excluded. Meaningful contour holes are preserved.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import cv2
import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
PIXEL_SCALE = 4
W, H = 200, 240
REGION_ORDER = ('silhouette', 'feet', 'arms', 'body', 'collar', 'head')


def ancestry(scene, node):
    result = []
    parents = scene.graph.transforms.parents
    while node and node not in result:
        result.append(node)
        node = parents.get(node)
    return result


def svg_path(mask):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        return ''
    commands = []
    for contour in contours:
        if abs(cv2.contourArea(contour)) < 5 * PIXEL_SCALE ** 2:
            continue
        points = cv2.approxPolyDP(contour, 0.62 * PIXEL_SCALE, True).reshape(-1, 2) / PIXEL_SCALE
        if len(points) < 3:
            continue
        commands.append('M' + 'L'.join(f'{x:g},{y:g}' for x, y in points) + 'Z')
    return ''.join(commands)


def shape_from_model(source, record):
    path = source / 'models' / (record['id'] + '.glb')
    scene = trimesh.load(path, force='scene', process=False)
    parts = []
    eye_world = None
    for node in scene.graph.nodes:
        transform, geometry = scene.graph[node]
        names = ancestry(scene, node)
        if node == 'eye_anchor':
            eye_world = transform[:3, 3]
        if 'eye' in names:
            if node.lower() == 'eyeball' and eye_world is None:
                eye_world = transform[:3, 3]
            continue
        if geometry is None:
            continue
        mesh = scene.geometry[geometry]
        vertices = trimesh.transform_points(mesh.vertices, transform)
        region = next((name for name in names if name in REGION_ORDER), 'body')
        parts.append((region, vertices, np.asarray(mesh.faces)))
    if not parts:
        raise ValueError(f'No non-eye geometry: {path}')
    all_vertices = np.vstack([vertices for _, vertices, _ in parts])
    minimum, maximum = all_vertices.min(axis=0), all_vertices.max(axis=0)
    scale = min(176 / (maximum[0] - minimum[0]), 220 / (maximum[1] - minimum[1]))
    center_x = (maximum[0] + minimum[0]) / 2

    def project(vertices):
        return np.column_stack((100 + (vertices[:, 0] - center_x) * scale,
                                236 - (vertices[:, 1] - minimum[1]) * scale))

    masks = {}
    for region, vertices, faces in parts:
        mask = masks.setdefault(region, np.zeros((H * PIXEL_SCALE, W * PIXEL_SCALE), dtype=np.uint8))
        projected = np.rint(project(vertices) * PIXEL_SCALE).astype(np.int32)
        # fillPoly on overlapping triangles can toggle their overlap. Painting
        # each convex triangle gives exact union coverage, including back faces.
        for triangle in projected[faces]:
            cv2.fillConvexPoly(mask, triangle, 255)
    silhouette = np.bitwise_or.reduce(list(masks.values()))
    masks['silhouette'] = silhouette
    face_mask = masks.get('head', silhouette)
    distances = cv2.distanceTransform(face_mask, cv2.DIST_L2, 5) / PIXEL_SCALE
    if eye_world is not None:
        eye_xy = project(np.asarray([eye_world]))[0]
    else:
        y, x = np.nonzero(face_mask)
        eye_xy = np.array([(x.min() + x.max()) / (2 * PIXEL_SCALE),
                           (y.min() + (y.max() - y.min()) * .48) / PIXEL_SCALE])
    ix, iy = np.rint(eye_xy * PIXEL_SCALE).astype(int)
    ix, iy = np.clip(ix, 0, W * PIXEL_SCALE - 1), np.clip(iy, 0, H * PIXEL_SCALE - 1)
    # Prefer the supplied face anchor. Narrow spikes and holes can require a
    # nearby interior point, found in the head's central area.
    if distances[iy, ix] < 12:
        ys, xs = np.nonzero(face_mask)
        cx = (xs.min() + xs.max()) / 2
        candidates = distances.copy()
        candidates[:, :int(cx - (xs.max() - xs.min()) * .25)] = 0
        candidates[:, int(cx + (xs.max() - xs.min()) * .25):] = 0
        iy, ix = np.unravel_index(np.argmax(candidates), candidates.shape)
        eye_xy = np.array([ix, iy]) / PIXEL_SCALE
    r = max(1.8, min(9, float(distances[iy, ix]) / 3.4))
    result = {key: record[key] for key in ('id', 'label', 'group')}
    result.update(paths=[{'region': region, 'd': svg_path(masks[region])}
                         for region in REGION_ORDER if region in masks],
                  eye={'x': round(float(eye_xy[0]), 2), 'y': round(float(eye_xy[1]), 2), 'r': round(r, 2)},
                  viewBox='0 0 200 240')
    if not result['paths'][0]['d']:
        raise ValueError(f'Empty silhouette: {path}')
    return result


def palettes(source):
    text = (source / 'source/creator/catalog.ts').read_text(encoding='utf-8')
    pattern = r"\{ id: (\d+), name: '([^']+)', realm: '[^']*', primary: '(#[0-9a-f]+)', secondary: '(#[0-9a-f]+)', accent: '(#[0-9a-f]+)'"
    result = [dict(id=int(i), name=name, primary=primary, secondary=secondary, accent=accent)
              for i, name, primary, secondary, accent in re.findall(pattern, text)]
    if len(result) != 23:
        raise ValueError(f'Expected 23 color families, got {len(result)}')
    # Preserve the catalog's Mortal skin as well as the design.ts id0 override.
    mortal = dict(result[0], id=23)
    result[0].update(name='Original MYR5', primary='#7946aa', secondary='#351344', accent='#b373d4')
    result.append(mortal)
    return result


RUNTIME = r'''
const SHAPES_BY_ID = new Map(PAPER_SHAPES.map(shape => [shape.id, shape]));
const PALETTES_BY_ID = new Map(PAPER_PALETTES.map(palette => [palette.id, palette]));
const EYE_POSITIONS = [[], [[0,0]], [[-1.12,0],[1.12,0]], [[0,-1.2],[-1.1,.72],[1.1,.72]], [[-1.1,-1.1],[1.1,-1.1],[-1.1,1.1],[1.1,1.1]], [[-1.45,-1.45],[1.45,-1.45],[0,0],[-1.45,1.45],[1.45,1.45]]];
const escapeText = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const number = value => Number(value.toFixed(2));

export function createPaperBatch(random = Math.random) {
  const pick = length => Math.min(length - 1, Math.max(0, Math.floor(Number(random()) * length) || 0));
  // Each choice consumes a separate draw: shape never determines its colors.
  const shape = PAPER_SHAPES[pick(PAPER_SHAPES.length)];
  const palette = PAPER_PALETTES[pick(PAPER_PALETTES.length)];
  const eyes = pick(5) + 1;
  const version = ((pick(499) + 1) / 100).toFixed(2);
  return {shapeId: shape.id, shapeName: shape.label, paletteId: palette.id, paletteName: palette.name, eyes, version};
}

export function renderPaperCoach(batch) {
  const shape = SHAPES_BY_ID.get(batch.shapeId) || PAPER_SHAPES[0];
  const palette = PALETTES_BY_ID.get(batch.paletteId) || PAPER_PALETTES[0];
  const count = Math.max(1, Math.min(5, Math.floor(Number(batch.eyes)) || 1));
  const outline = '#351344';
  const fills = {silhouette:palette.primary, head:palette.primary, body:palette.primary, arms:palette.secondary, feet:palette.secondary, collar:palette.accent};
  const paths = shape.paths.map(path => `<path class="paper-region paper-${path.region}" d="${path.d}" fill="${fills[path.region] || palette.primary}" fill-rule="evenodd" stroke="${outline}" stroke-width="${path.region === 'silhouette' ? 4 : 2.7}" stroke-linejoin="round"/>`).join('');
  const eye = shape.eye;
  const positions = EYE_POSITIONS[count];
  const eyes = positions.map(([dx,dy]) => {
    const x = number(eye.x + dx * eye.r), y = number(eye.y + dy * eye.r);
    const r = number(eye.r * (count === 1 ? 1.65 : 1));
    return `<g class="paper-eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff8eb" stroke="${outline}" stroke-width="${number(Math.max(.8, eye.r * .2))}"/><circle cx="${number(x+.12*r)}" cy="${number(y+.06*r)}" r="${number(r*.48)}" fill="${outline}"/><circle cx="${number(x+.26*r)}" cy="${number(y-.19*r)}" r="${number(r*.16)}" fill="#fff8eb"/></g>`;
  }).join('');
  // Two tiny flat cut-paper accents follow the face, keeping the art entirely
  // vector and avoiding added texture downloads or runtime model generation.
  const cuts = [[-1.6,1.95],[1.6,1.95]].map(([dx,dy]) => {
    const x = number(eye.x + dx*eye.r), y = number(eye.y + dy*eye.r), s = number(eye.r*.45);
    return `<path class="paper-cut" d="M${x-s},${y}l${s},${-s*.55}l${s},${s*.55}l${-s},${s*.55}Z" fill="${palette.accent}"/>`;
  }).join('');
  return `<title>${escapeText(shape.label)} · ${escapeText(palette.name)} · ${count} ${count === 1 ? 'eye' : 'eyes'}</title><g class="paper-coach" data-shape="${escapeText(shape.id)}" data-palette="${palette.id}">${paths}${cuts}${eyes}</g>`;
}
'''


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path('D:/coach-merge/creature'))
    args = parser.parse_args()
    manifest = json.loads((args.source / 'models/roster/manifest.json').read_text(encoding='utf-8'))
    records = [{'id': 'myr5', 'label': 'Original MYR5', 'group': 'Original'}] + manifest
    shapes = []
    for i, record in enumerate(records):
        shapes.append(shape_from_model(args.source, record))
        print(f'{i+1}/{len(records)} {record["label"]}', flush=True)
    families = palettes(args.source)
    header = '// Generated by tools/generate_dg_paper_roster.py from 71 local coach GLBs.\n// Front orthographic vector contours; original eye geometry excluded.\n'
    output = header + 'export const PAPER_SHAPES = ' + json.dumps(shapes, ensure_ascii=False, separators=(',', ':')) + ';\n'
    output += 'export const PAPER_PALETTES = ' + json.dumps(families, ensure_ascii=False, separators=(',', ':')) + ';\n' + RUNTIME
    target = ROOT / 'tv/channels/girlfriend-roster.js'
    target.write_text(output, encoding='utf-8')
    preview = ROOT / 'tools/dg-paper-roster-contact-sheet.html'
    preview.write_text('''<!doctype html><meta charset="utf-8"><title>MYR5 paper roster — 71 local model projections</title>
<style>body{background:#f4eee2;color:#351344;font:14px system-ui;margin:24px}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:16px}.coach{margin:0;padding:12px;background:#fffcf5;border:2px solid #351344;border-radius:12px}svg{width:100%;height:220px}figcaption{min-height:42px;font-size:12px}small{display:block;color:#736278}</style>
<h1>71 coach shapes · 24 independent paper palettes</h1><p>Every silhouette comes from its actual front-facing GLB geometry. Eyes and palettes vary independently.</p><div class="grid"></div>
<script type="module">import {PAPER_SHAPES,PAPER_PALETTES,renderPaperCoach} from '../tv/channels/girlfriend-roster.js';
document.querySelector('.grid').innerHTML=PAPER_SHAPES.map((shape,i)=>{const p=PAPER_PALETTES[i%PAPER_PALETTES.length];return `<figure class="coach"><svg viewBox="${shape.viewBox}" role="img">${renderPaperCoach({shapeId:shape.id,paletteId:p.id,eyes:i%5+1,version:'1.00'})}</svg><figcaption>${i+1}. ${shape.label}<small>${p.name} · ${i%5+1} eyes</small></figcaption></figure>`}).join('');</script>''', encoding='utf-8')
    print(json.dumps({'shapes': len(shapes), 'palettes': len(families), 'bytes': target.stat().st_size,
                      'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'module': str(target), 'preview': str(preview)}))


if __name__ == '__main__':
    main()
