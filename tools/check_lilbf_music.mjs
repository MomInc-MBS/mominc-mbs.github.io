// Run: node tools/check_lilbf_music.mjs file:///<repo>/play/lilboyfriend/audio.js
// Mock Web Audio; verifies music gain per room and pause.
const log = [];
class P { constructor(){this.value=0} cancelScheduledValues(){} setValueAtTime(){} linearRampToValueAtTime(v){this.owner&&log.push([this.owner,+v.toFixed(4)])} exponentialRampToValueAtTime(){} }
class N { constructor(){this.gain=new P();this.frequency=new P();this.Q=new P()} connect(){} start(){} stop(){} }
let gains=0;
globalThis.AudioContext = class { constructor(){this.state='running';this.currentTime=0;this.sampleRate=44100;this.destination={}}
  createGain(){const n=new N();n.gain.owner='g'+(gains++);return n} createOscillator(){return new N()} createBiquadFilter(){return new N()} createBufferSource(){return new N()}
  createBuffer(c,l){return {getChannelData:()=>new Float32Array(l)}}
  async decodeAudioData(){const d=new Float32Array(44100*18);d.fill(.5,100);return {sampleRate:44100,duration:18,getChannelData:()=>d}} async resume(){} close(){} };
globalThis.fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(8) });
const { createSoundscape } = await import(process.argv[2]);
const s = createSoundscape();
s.setRoom('gallery'); await s.start(); await new Promise(r=>setTimeout(r,20));
const music = log.at(-1)[0];
const lvl = () => log.filter(([o])=>o===music).at(-1)[1];
const got = { gallery: lvl() };
for (const id of ['boxRoom','jarRoom','pencilRoom','matchRoom','spoolRoom','fiberRoom','atomicRoom']) { s.setRoom(id); got[id]=lvl(); }
s.setPaused(true); got.paused=lvl(); s.setPaused(false); s.setRoom('gallery'); got.back=lvl();
console.log(got);
const v = Object.values(got).slice(0,8);
if (!(v[0] < 0.05 && v.every((x,i)=>!i||x>v[i-1]) && got.paused===0 && got.back===v[0])) { console.error('FAIL'); process.exit(1); }
console.log('ok');
