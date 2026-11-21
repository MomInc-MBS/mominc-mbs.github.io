"""Validate additive HIVE docs/graph without rewriting the supplied vault export."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
VAULT = ROOT/'hive/vault'
DOCS = ROOT/'hive/implementation/runtime-v2'
spec = importlib.util.spec_from_file_location('hive_vault_validator', VAULT/'tools/validate_vault.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
overlay = json.loads((DOCS/'research_graph_overlay.json').read_text(encoding='utf-8'))
base = ROOT/overlay['base_graph']
if hashlib.sha256(base.read_bytes()).hexdigest() != overlay['base_sha256']:
    raise ValueError('supplied base graph changed')
merged = json.loads(base.read_text(encoding='utf-8'))
merged['nodes'] += overlay['nodes']
merged['edges'] += overlay['edges']


class AdditiveValidator(module.Validator):
    def read_json(self, relative):
        if relative == '99_Data/research_graph.json':
            return merged
        return super().read_json(relative)


report = AdditiveValidator(VAULT).run()
links = module.Validator(ROOT)
for path in DOCS.glob('*.md'):
    visible = links.visible_markdown(path.read_text(encoding='utf-8'))
    for target, line in links.inline_destinations(visible):
        links.check_link(target, path, line)
sys.path.insert(0, str(ROOT))
from tools.hive_engine.contracts import schemas
if json.loads((DOCS/'experiment-contracts.json').read_text()) != schemas():
    raise ValueError('exported contracts differ from executable schemas')
report['errors'] += links.errors
report['error_count'] = len(report['errors'])
report['ok'] = not report['errors']
report['implementation_links_checked'] = links.counts['markdown_links_checked']
target = ROOT/'.hive-local/runtime-doc-validation.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, indent=2))
raise SystemExit(0 if report['ok'] else 1)
