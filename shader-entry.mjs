import {startShaderEffects} from './shader-effects.mjs';
import {auroraTargets} from './shader-aurora.mjs';
import {hologramTargets} from './shader-hologram.mjs';
import {sparkleTargets} from './shader-sparkle.mjs';
startShaderEffects({targets:[...auroraTargets,...hologramTargets,...sparkleTargets]});
