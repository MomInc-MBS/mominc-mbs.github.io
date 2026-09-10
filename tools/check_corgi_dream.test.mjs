import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { restoreDream, losePaperHeart, restartDream, canOpenBackDoor, breakRoomPose } from '../tv/channels/corgi-dream.mjs';

const run = () => ({level:1,found:[[true,true,true],[true,false,true],[false,false,false]],...restoreDream()});

test('older saves gain three hearts; saved losses and ending progress survive reload', () => {
  assert.deepEqual(restoreDream(), {lives:3,dreamPhase:'hunt'});
  assert.deepEqual(restoreDream({lives:1,dreamPhase:'ending'}), {lives:1,dreamPhase:'ending'});
  assert.equal(restoreDream({lives:0}).lives, 0);
  assert.equal(restoreDream({lives:-2}).lives, 0);
  assert.equal(restoreDream({lives:999,dreamPhase:'broken'}).lives, 3);
});
test('each capture consumes one heart and returns to the office with all collected pages intact', () => {
  const state = run(), found = structuredClone(state.found);
  for (const remaining of [2,1,0]) {
    state.level = 1;
    assert.ok(losePaperHeart(state));
    assert.equal(state.lives, remaining); assert.equal(state.level, 0);
    assert.deepEqual(state.found, found);
    assert.equal(losePaperHeart(state), false, 'same capture cannot consume another heart');
  }
  state.level = 1; assert.equal(losePaperHeart(state), false);
});
test('a new dream restores hearts and school drawings while retaining the office checkpoint', () => {
  const state = run(); state.lives = 0;
  restartDream(state);
  assert.equal(state.lives, 3); assert.equal(state.level, 0);
  assert.deepEqual(state.found[0], [true,true,true]);
  assert.deepEqual(state.found[1], [false,false,false]);
});
test('all scary pictures are required, and exhausted or completed dreams cannot open the back door', () => {
  const state = run(); assert.equal(canOpenBackDoor(state), false);
  state.found[1][1] = true; assert.equal(canOpenBackDoor(state), true);
  state.lives = 0; assert.equal(canOpenBackDoor(state), false);
  state.lives = 1; state.dreamPhase = 'done'; assert.equal(canOpenBackDoor(state), false);
});
test('the reverse cinematic retraces the same entrance path, with no tilted camera for reduced motion', () => {
  const entrance = [0,1,2,2.6,3.5,4.1].map(t => breakRoomPose(t));
  const leaving = [4.1,3.5,2.6,2,1,0].map(t => breakRoomPose(t));
  assert.deepEqual(leaving.reverse(), entrance);
  assert.equal(breakRoomPose(0).z, 2); assert.ok(Math.abs(breakRoomPose(4.1).z + 2.1) < 1e-10);
  assert.equal(breakRoomPose(4.1,true).roll, 0); assert.equal(breakRoomPose(4.1,true).pitch, 0);
});

test('site progress recovery waits for the dream ending while honoring already completed older saves', () => {
  const source = readFileSync(new URL('../tv/network-flow.js', import.meta.url), 'utf8');
  function recovered(publicRun) {
    const complete = [], events = {};
    const context = {
      window: {MBS_STATE:{completedPages:()=>complete,completePage:id=>complete.push(id)},addEventListener(){},dispatchEvent(){}},
      document: {readyState:'loading',hidden:false,body:{dataset:{}},documentElement:{dataset:{}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>events[type]=fn},
      location: {pathname:'/play/corgi/'},
      localStorage: {getItem:key=>key==='mbs-corgi-school-v3'?JSON.stringify({public:publicRun}):null},
      MutationObserver: class {observe(){} disconnect(){}},
      setTimeout(){},clearTimeout(){}
    };
    vm.runInNewContext(source, context); events.DOMContentLoaded(); return complete;
  }
  const run = {found:[[true,true,true],[true,true,true],[false,false,false]]};
  assert.deepEqual(recovered({...run,dreamPhase:'hunt'}), []);
  assert.deepEqual(recovered({...run,dreamPhase:'ending'}), []);
  assert.deepEqual(recovered({...run,dreamPhase:'done'}), ['corgi']);
  assert.deepEqual(recovered(run), ['corgi']);
});
