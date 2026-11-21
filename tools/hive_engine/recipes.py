"""Versioned declarative recipes, runnable with every optimizer disabled."""
from .adapters import CaptionAdapter
from .core import digest

SPECIALISTS = ('rules', 'probe', 'combined')
THRESHOLDS = (0, 64, 128, 65536)


def recipe(specialist='rules', threshold=65536):
    value = dict(version='caption-recipe-1', specialist=specialist,
                 escalate_above_bytes=threshold, retry_cap=0,
                 parallelism=1, verification='mandatory')
    return validate(value)


def validate(value):
    if set(value) != {'version', 'specialist', 'escalate_above_bytes', 'retry_cap', 'parallelism', 'verification'}:
        raise ValueError('recipe fields outside allowlist')
    if (value['version'] != 'caption-recipe-1' or value['specialist'] not in (*SPECIALISTS, 'probe-guard') or
            type(value['escalate_above_bytes']) is not int or value['escalate_above_bytes'] not in THRESHOLDS or
            type(value['retry_cap']) is not int or value['retry_cap'] != 0 or
            type(value['parallelism']) is not int or value['parallelism'] != 1 or
            value['verification'] != 'mandatory'):
        raise ValueError('recipe values outside allowlist')
    return dict(value)


class RecipeAdapter:
    def __init__(self, value):
        self.recipe = validate(value)
        self.id = 'recipe-'+digest(self.recipe)[:16]
        self.primary = CaptionAdapter(self.recipe['specialist'])
        self.escalation = CaptionAdapter('combined')

    def uses_escalation(self):
        return self.recipe['escalate_above_bytes'] < 65536

    def manifest(self):
        result = self.primary.manifest()
        result.update(capability_id=self.id, kind='caption-recipe', adapter='caption-recipe')
        result['provenance'] = {'recipe': self.recipe, 'primary': self.primary.manifest()['provenance'],
                                'escalation': self.escalation.manifest()['provenance'] if self.uses_escalation() else None}
        if self.uses_escalation():
            result['permissions'] = ['read-fixture', 'run-ffprobe']
        return result

    def health(self):
        return 'ready' if self.primary.health() == 'ready' and (not self.uses_escalation() or self.escalation.health() == 'ready') else 'unavailable'

    def execute(self, data, timeout):
        chosen = self.escalation if len(data) > self.recipe['escalate_above_bytes'] else self.primary
        result = chosen.execute(data, timeout)
        result['recipe_route'] = chosen.config
        return result
