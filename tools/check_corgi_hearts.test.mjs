import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolCortisol, heartbeatBpm, heartbeatPulse } from '../tv/channels/corgi-hearts.mjs';

test('every school picture increases resting cortisol and heartbeat', () => {
  const stress=[0,1,2,3].map(p=>schoolCortisol(p,0));
  assert.deepEqual(stress,[12,30,48,66]);
  for(let i=1;i<stress.length;i++)assert.ok(heartbeatBpm(stress[i])>heartbeatBpm(stress[i-1]));
});
test('monster proximity still increases cortisol and heartbeat with all papers collected', () => {
  for(const papers of [0,1,2,3]){
    const far=schoolCortisol(papers,0),near=schoolCortisol(papers,.5),closest=schoolCortisol(papers,1);
    assert.ok(far<near&&near<closest);
    assert.ok(heartbeatBpm(far)<heartbeatBpm(closest));
  }
  assert.equal(schoolCortisol(3,1),100);
  assert.equal(heartbeatBpm(100),180);
});
test('each heartbeat contains two distinct contractions and a resting interval', () => {
  assert.equal(heartbeatPulse(0),0);assert.ok(Math.abs(heartbeatPulse(.13)-1)<1e-10);
  assert.ok(heartbeatPulse(.37)>.5);assert.equal(heartbeatPulse(.8),0);
  assert.ok(Math.abs(heartbeatPulse(1.13)-heartbeatPulse(.13))<1e-10);
});
