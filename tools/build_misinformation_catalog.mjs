import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {topicQuestions, legacyScopes, legacyPrompts} from './misinformation_question_bank.mjs';
import * as bank from './misinformation_question_bank.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(root, 'docs/misinformation/research-data');
const read = async name => JSON.parse(await readFile(resolve(dataDir, name), 'utf8'));
const baseline = await read('catalog-v1.json');
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const baseTags = {
 chemtrails:'sky environment weather transport government-claims nature-claims science-claims',
 nibiru:'space astronomy sky doomsday space-claims hidden-worlds',
 apollo:'space astronomy moon technology missions spacecraft exploration instruments science',
 mkultra:'programs research experiments medicine government surveillance abuse military',
 cointelpro:'programs government surveillance abuse investigations',
 tuskegee:'research experiments medicine government abuse inquiries science',
 wtc:'events disasters transport transport-disasters explosions crime modern-history',
 hindenburg:'events disasters transport transport-disasters fires technology',
 bundy:'serial-killers criminal-cases criminal-people investigations forensics people',
 dahmer:'serial-killers criminal-cases criminal-people investigations people',
 hitler:'leaders political-people governments government abuse war atrocity-cases people',
 samphan:'leaders political-people governments government abuse atrocity-cases courts people',
 'face-mars':'space astronomy mars aliens natural-formations space-claims',
 'bermuda-triangle':'nature-claims environment transport unusual-history hidden-worlds',
 haarp:'sky weather nature-claims government-claims science-claims extraordinary-technology',
 'philadelphia-experiment':'transport military government-claims extraordinary-technology unusual-history',
 'lhc-doomsday':'science-claims extraordinary-technology doomsday technology',
 'flat-earth':'earth nature-claims hidden-worlds science-claims',
 'hollow-earth':'earth nature-claims hidden-worlds science-claims',
 'hollow-moon':'space astronomy moon space-claims hidden-worlds extraordinary-technology',
 'mars-doorway':'space astronomy mars aliens natural-formations space-claims',
 'roswell-alien-craft':'space sky aliens military government-claims space-claims unusual-history',
 acoustikitty:'programs research experiments surveillance unusual-history technology',
 stargate:'programs research experiments surveillance unusual-history military',
 azorian:'programs surveillance transport technology military unusual-history',
 stormfury:'programs research experiments weather weather-research science environment',
 'saturn-hexagon':'space astronomy nature natural-events natural-formations science weather',
 northwoods:'programs government military war documents unusual-history',
 'molasses-flood':'events disasters industrial-disasters unusual-history technology',
 'lake-nyos':'events disasters natural-disasters natural-events environment nature unusual-history',
 'project-xray':'programs research experiments military technology unusual-history',
 paperclip:'programs government research science military war',
 'project-blue-book':'programs government research space sky military investigations',
 zodiac:'serial-killers criminal-cases investigations forensics unusual-history',
 rader:'serial-killers criminal-cases criminal-people investigations forensics technology people',
 ridgway:'serial-killers criminal-cases criminal-people investigations forensics people',
 gacy:'serial-killers criminal-cases criminal-people investigations forensics people',
 'joseph-franklin':'serial-killers criminal-cases criminal-people investigations courts people',
 stalin:'leaders political-people governments government abuse war people',
 'pol-pot':'leaders political-people governments government abuse war people',
 'idi-amin':'leaders political-people governments government abuse international people',
 'charles-taylor':'leaders political-people governments government abuse atrocity-cases courts war people',
 kambanda:'leaders political-people governments government abuse atrocity-cases courts people',
 tunguska:'events natural-events nature space astronomy disasters explosions unusual-history',
 carrington:'events natural-events nature space astronomy weather communications unusual-history',
 halifax:'events disasters transport transport-disasters explosions war technology',
 'dancing-plague':'events unusual-history medicine inquiries'
};
const familiarity = {
 chemtrails:0,nibiru:2,apollo:0,mkultra:1,cointelpro:2,tuskegee:1,wtc:0,hindenburg:0,
 bundy:0,dahmer:0,hitler:0,samphan:4,'face-mars':2,'bermuda-triangle':0,haarp:1,
 'philadelphia-experiment':2,'lhc-doomsday':3,'flat-earth':0,'hollow-earth':2,'hollow-moon':3,
 'mars-doorway':4,'roswell-alien-craft':0,acoustikitty:4,stargate:3,azorian:4,stormfury:3,
 'saturn-hexagon':2,northwoods:3,'molasses-flood':1,'lake-nyos':3,'project-xray':5,paperclip:1,
 'project-blue-book':1,zodiac:0,rader:1,ridgway:1,gacy:0,'joseph-franklin':4,stalin:0,
 'pol-pot':0,'idi-amin':1,'charles-taylor':2,kambanda:5,tunguska:1,carrington:2,halifax:1,'dancing-plague':3
};
// Tags describe what the answer actually names, rather than every association in
// its source article. A constitution is not a leader; an assassination victim
// is not thereby a serial killer.
const typedTags = {};
function tag(ids, tags) {for(const id of ids.split(' ')) typedTags[id] = tags.split(' ');}
tag('declaration-independence us-constitution thirteenth-amendment nineteenth-amendment civil-rights-act-1964 voting-rights-act-1965 emancipation-proclamation magna-carta', 'history documents government social-change political-events');
tag('dday pearl-harbor wwi-armistice', 'history events war military international political-events');
tag('watergate iran-contra', 'history events political-events government scandals investigations');
tag('cuban-missile-crisis berlin-wall', 'history events political-events government international social-change');
tag('titanic lusitania', 'history events disasters transport transport-disasters technology');
tag('challenger columbia', 'history events disasters transport transport-disasters technology space spacecraft science');
tag('chernobyl fukushima bhopal deepwater-horizon aberfan', 'history events disasters industrial-disasters environment technology');
tag('pompeii krakatau san-francisco-1906 dust-bowl', 'history events disasters natural-disasters natural-events nature earth environment');
tag('triangle-shirtwaist great-fire-london great-chicago-fire', 'history events disasters fires');
tag('spanish-flu', 'history events disasters medicine science natural-events');
tag('great-smog-london', 'history events disasters environment science weather');
tag('napoleon george-washington abraham-lincoln nelson-mandela gandhi', 'history people leaders political-people government political-events social-change');
tag('mao mussolini pinochet', 'history people leaders political-people government abuse war');
tag('saddam-hussein karadzic mladic', 'history people leaders political-people government abuse war courts atrocity-cases criminal-cases');
tag('al-capone dillinger bonnie-clyde unabomber', 'history people criminal-people criminal-cases investigations crime');
tag('harold-shipman golden-state-killer', 'history people criminal-people serial-killers criminal-cases investigations crime forensics');
tag('lindbergh-kidnapping', 'history events criminal-cases investigations crime');
tag('salem-witch-trials', 'history events criminal-cases investigations courts unusual-history');
tag('mercury venus earth mars jupiter saturn uranus neptune pluto ceres asteroid-belt kuiper-belt sun moon milky-way sagittarius-a halleys-comet', 'space science nature astronomy sky');
tag('iss hubble james-webb voyager-1 voyager-2 curiosity perseverance ingenuity sputnik-1 viking-1 cassini new-horizons juno rosetta osiris-rex dart', 'space science technology government exploration spacecraft missions instruments research');
tag('solar-eclipse aurora', 'space science nature astronomy natural-events sky environment');
tag('ozone-layer', 'earth science nature sky environment');
tag('corona aquatone palladium operation-gold', 'programs covert research government military surveillance technology history unusual-history');
tag('moon-landing-hoax mars-hoax comet-elenin-doomsday 2012-calendar-apocalypse 2000-alignment-apocalypse', 'conspiracy science space sky astronomy space-claims');
tag('denver-airport-lizard-base', 'conspiracy government-claims unusual-history hidden-worlds transport extraordinary-technology');
tag('5g-covid vaccine-microchips magnetic-vaccines mrna-dna-rewrite', 'conspiracy science medicine science-claims technology');
tag('noaa-hurricane-steering', 'conspiracy science sky environment weather nature-claims government-claims science-claims extraordinary-technology');
tag('solar-warming-hoax magnetic-pole-flip-apocalypse', 'conspiracy science nature environment earth science-claims nature-claims');
tag('earthquake-weather earthquake-prediction-coverup', 'conspiracy science nature environment earth science-claims nature-claims');
tag('disney-cryonics', 'conspiracy science medicine unusual-history science-claims');
for(const id of 'mercury venus earth mars jupiter saturn uranus neptune pluto ceres asteroid-belt kuiper-belt sun moon milky-way sagittarius-a halleys-comet'.split(' '))typedTags[id].push('natural-objects');
for(const id of ['moon','moon-landing-hoax'])typedTags[id].push('moon');
for(const id of ['mars','mars-hoax','curiosity','perseverance','ingenuity','viking-1'])typedTags[id].push('mars');
for(const id of ['comet-elenin-doomsday','2012-calendar-apocalypse','2000-alignment-apocalypse','magnetic-pole-flip-apocalypse'])typedTags[id].push('doomsday');
const aliases = {
 'secret-programs':'programs','covert-programs':'programs','government-programs':'programs',
 'conspiracies':'conspiracy','claims':'conspiracy','claim':'conspiracy','conspiracy-theory':'conspiracy',
 'person':'people','leader':'leaders','world-leaders':'leaders','governments':'government',
 'natural-disaster':'natural-disasters','disaster':'disasters','mission':'missions',
 'criminal-case':'criminal-cases','serial-killer':'serial-killers','secret-program':'programs',
 'experiment':'experiments','odd-history':'unusual-history'
};
function tagsFor(subject) {
 const tags = new Set((typedTags[subject.id] || subject.topics || []).map(tag => aliases[tag] || tag));
 for(const tag of (baseTags[subject.id] || '').split(' ').filter(Boolean)) tags.add(tag);
 const category = subject.category.toLowerCase();
 if(subject.classification === 'claim') {tags.add('conspiracy');tags.add('unusual-history');}
 if(/program|operation|research/.test(category)) ['programs','research','government','history'].forEach(t=>tags.add(t));
 if(/criminal|serial|investigation/.test(category)) ['crime','criminal-cases','investigations','history'].forEach(t=>tags.add(t));
 if(/leader/.test(category)) ['leaders','government','history'].forEach(t=>tags.add(t));
 if(/repression|atrocity|state abuse/.test(category)) ['government','abuse','history'].forEach(t=>tags.add(t));
 if(/disaster|tragedy/.test(category)) ['disasters','events','history'].forEach(t=>tags.add(t));
 if(/natural|astronom|space|planet|moon/.test(category)) tags.add('science');
 if(tags.has('leaders')) ['people','government','history','political-people'].forEach(t=>tags.add(t));
 if(tags.has('serial-killers')) ['people','criminal-people','criminal-cases','crime','history','investigations'].forEach(t=>tags.add(t));
 if(tags.has('crime')) ['history','criminal-cases','investigations'].forEach(t=>tags.add(t));
 if(tags.has('disasters')) ['events','history'].forEach(t=>tags.add(t));
 if(tags.has('natural-disasters')) ['disasters','events','natural-events','nature','environment','history'].forEach(t=>tags.add(t));
 if(tags.has('space')) ['science','astronomy','sky'].forEach(t=>tags.add(t));
 if(tags.has('missions')) ['space','science','technology','exploration','spacecraft','history'].forEach(t=>tags.add(t));
 if(tags.has('programs')) ['government','history','research'].forEach(t=>tags.add(t));
 if(['mkultra','cointelpro','acoustikitty','stargate','azorian','northwoods','paperclip','project-xray'].includes(subject.id))tags.add('covert');
 if(tags.has('research')) tags.add('science');
 if(tags.has('government')) tags.add('history');
 if(tags.has('events')) tags.add('history');
 if(tags.has('conspiracy') && tags.has('space')) tags.add('space-claims');
 if(tags.has('conspiracy') && tags.has('nature')) tags.add('nature-claims');
 return [...tags].sort();
}
let candidates = baseline.subjects.map(s=>({...s, familiarity:familiarity[s.id]}));
for(const name of ['expansion-v2-science.json','expansion-v2-history.json','expansion-v3-world-events.json','expansion-v5-accessible.json']) {
 const input = await read(name);
 const entries = Array.isArray(input) ? input : input.subjects || input.entries || input.records;
 if(!Array.isArray(entries)) throw Error(`Missing subjects in ${name}`);
 candidates.push(...entries);
}
const ids = new Set(), names = new Set();
const subjects = candidates.map(subject => {
 if(ids.has(subject.id) || names.has(normalize(subject.name))) throw Error(`Duplicate subject: ${subject.id}`);
 ids.add(subject.id);names.add(normalize(subject.name));
 const seen = new Set([normalize(subject.name)]);
 const cleanAliases = (subject.aliases || []).filter(alias => {
  const value = normalize(alias);if(!value || seen.has(value))return false;seen.add(value);return true;
 });
 const output = {};
 for(const key of ['id','name','classification','statement','explanation','source','publisher','category']) {
  if(typeof subject[key]!=='string' || !subject[key].trim()) throw Error(`${subject.id}: missing ${key}`);
  output[key] = subject[key];
 }
 if(!['event','claim'].includes(output.classification))throw Error(`Invalid classification: ${subject.id}`);
 if(new URL(output.source).protocol !== 'https:') throw Error(`Non-HTTPS source: ${subject.id}`);
 output.aliases = cleanAliases;
 output.familiarity = subject.familiarity ?? 2;
 output.topics = tagsFor(subject);
 output.depth = subject.depth ?? Math.min(7,output.familiarity + (output.familiarity > 2 ? 1 : 0));
 return output;
});

// The discovery prize is a stable editorial pick for that prompt. Curating it
// within the less-familiar answers avoids making one bat-bomb keyword the
// winning answer to half the game merely because its name sorts last.
const discoveries = {
 space:'rosetta osiris-rex ceres kuiper-belt viking-1 ingenuity sagittarius-a mars-doorway face-mars hollow-moon',
 nature:'lake-nyos carrington earthquake-weather magnetic-pole-flip-apocalypse saturn-hexagon stormfury kuiper-belt ceres aberfan krakatau',
 science:'palladium stargate stormfury osiris-rex rosetta saturn-hexagon acoustikitty sagittarius-a azorian project-xray',
 technology:'palladium azorian operation-gold aquatone corona ingenuity osiris-rex lhc-doomsday philadelphia-experiment project-xray',
 conspiracies:'nibiru hollow-earth hollow-moon philadelphia-experiment lhc-doomsday comet-elenin-doomsday denver-airport-lizard-base mars-doorway 2000-alignment-apocalypse earthquake-prediction-coverup',
 programs:'northwoods acoustikitty stargate azorian corona aquatone operation-gold palladium stormfury project-xray',
 history:'samphan kambanda aberfan joseph-franklin dancing-plague triangle-shirtwaist lindbergh-kidnapping great-smog-london karadzic mladic',
 disasters:'aberfan lake-nyos triangle-shirtwaist great-smog-london bhopal krakatau columbia carrington lusitania aberfan',
 crime:'joseph-franklin harold-shipman lindbergh-kidnapping dillinger golden-state-killer karadzic mladic samphan kambanda charles-taylor',
 leaders:'samphan kambanda charles-taylor karadzic mladic pinochet samphan operation-gold kambanda charles-taylor',
 'world-affairs':'samphan kambanda charles-taylor iran-contra voting-rights-act-1965 northwoods palladium operation-gold cointelpro azorian',
 oddities:'dancing-plague acoustikitty lake-nyos project-xray stargate palladium denver-airport-lizard-base mars-doorway comet-elenin-doomsday saturn-hexagon',
 surveillance:'palladium operation-gold acoustikitty cointelpro stargate aquatone corona azorian northwoods joseph-franklin',
 'sky-stories':'ceres kuiper-belt sagittarius-a saturn-hexagon rosetta osiris-rex mars-doorway face-mars nibiru carrington',
 evidence:'harold-shipman joseph-franklin samphan project-xray palladium stormfury aberfan dancing-plague kambanda karadzic',
 'deep-files':'comet-elenin-doomsday mars-doorway project-xray northwoods denver-airport-lizard-base samphan joseph-franklin stargate palladium kambanda'
};
const legacyDiscoveries = {
 sky:'nibiru',secrets:'northwoods','power-and-records':'samphan','case-files':'harold-shipman',
 'sudden-disasters':'aberfan','earth-claims':'hollow-earth','alien-appearances':'mars-doorway',
 'classified-and-declassified':'cointelpro','signals-and-legends':'philadelphia-experiment',
 'space-and-natural-science':'sagittarius-a','forensic-trail':'golden-state-killer',
 'impossible-machines':'lhc-doomsday','strange-research-records':'stormfury','read-the-image':'face-mars',
 'official-abuse-records':'northwoods','unlikely-intelligence':'acoustikitty','unlikely-disaster':'lake-nyos',
 'hidden-geography':'hollow-moon','stranger-than-fiction':'dancing-plague','military-invention-files':'project-xray',
 'responsibility-in-the-record':'charles-taylor','last-court-file':'kambanda',
 'last-secret-project':'palladium','last-unreal-world':'philadelphia-experiment'
};
// Familiarity is an authored 0..4 rubric, independent of pool size or spelling.
// A missing answer is not evidence of commonness. Only the curated gem earns 100.
function scoreAnswers(pool, def) {
 let sorted = [...pool].sort((a,b)=>a.familiarity-b.familiarity || a.name.localeCompare(b.name,'en'));
 if(sorted.length < 4)throw Error(`Prompt ${def.id} too narrow: ${sorted.map(s=>s.id)}`);
 const choices=(discoveries[def.family] || '').split(' ').filter(Boolean);
 const start=(Number(def.id.match(/-(\d+)$/)?.[1] || 1)-1)%Math.max(1,choices.length);
 const preferences=legacyDiscoveries[def.id]?[legacyDiscoveries[def.id]]:[...choices.slice(start),...choices.slice(0,start)];
 const gem=preferences.map(id=>sorted.find(s=>s.id===id&&s.familiarity>=2)).find(Boolean) || sorted.at(-1);
 return sorted.map(s=>({id:s.id,tier:s.id===gem.id?5:Math.max(0,Math.min(4,s.familiarity))}));
}
const legacy = baseline.questions.map(q => ({
 id:q.id,band:bank.legacyBands?.[q.id]??q.band,family:`legacy-${q.id}`,topic:'Archive transmission',
 prompt:legacyPrompts[q.id],topics:legacyScopes[q.id],
 hint:''
}));
const questions = [...legacy,...topicQuestions].map(def => {
 const theories=/\b(?:theor(?:y|ies)|claims?|conspir(?:acy|acies)|hoax(?:es)?|hidden worlds?|legends?|alleged|predictions?|stor(?:y|ies))\b/i.test(def.prompt);
 const filters=bank.questionFilters?.[def.id] || {};
 // Ordinary categories mean ordinary documented subjects. A theory about a
 // planet does not qualify as a planet merely because both have a space tag.
 const pool = subjects.filter(s=>(s.classification!=='claim'||theories||filters.onlyClaims)
  && (!filters.onlyClaims||s.classification==='claim')
  && def.topics.some(tag=>s.topics.includes(tag))
  && (filters.allTopics||[]).every(tag=>s.topics.includes(tag))
  && !(filters.excludeTopics||[]).some(tag=>s.topics.includes(tag))
  && !(filters.excludeIds||[]).includes(s.id));
 const poolId=createHash('sha1').update(pool.map(s=>s.id).sort().join('|')).digest('hex').slice(0,16);
 const examples=[...pool].sort((a,b)=>a.familiarity-b.familiarity||a.name.localeCompare(b.name,'en')).slice(0,2).map(s=>s.name);
 const hint=def.hint || `Try ${examples.join(' or ')}. These are valid examples, not the complete answer list. Other names in the category count too.`;
 return {id:def.id,band:def.band,family:def.family,topic:def.topic,poolId,prompt:def.prompt,hint,examples,answers:scoreAnswers(pool,def)};
});
const byId = new Map(subjects.map(s=>[s.id,s]));
for(const question of questions) {
 const seen = new Map();
 for(const answer of question.answers) {
  const subject = byId.get(answer.id);
  for(const alias of [subject.name,...subject.aliases]) {
   const key = normalize(alias);
   if(seen.has(key) && seen.get(key) !== subject.id)throw Error(`${question.id}: ambiguous alias ${alias} for ${seen.get(key)} and ${subject.id}`);
   seen.set(key,subject.id);
  }
 }
}
if(subjects.length < 141)throw Error(`Need at least 141 distinct subjects; got ${subjects.length}`);
const memberships = subjects.map(s=>({id:s.id,count:questions.filter(q=>q.answers.some(a=>a.id===s.id)).length}));
if(memberships.some(s=>s.count<1))throw Error(`Subjects need at least one accurate prompt: ${JSON.stringify(memberships.filter(s=>s.count<1))}`);
const source = '// Generated by tools/build_misinformation_catalog.mjs from reviewed source records and authored broad prompts.\n'
 + '// Familiarity and score tiers are editorial; they never rank harm or measure player frequencies.\n'
 + `export const subjects = ${JSON.stringify(subjects,null,2)};\n`
 + `export const questions = ${JSON.stringify(questions,null,2)};\n`;
await writeFile(resolve(root,'play/misinformation/catalog.js'),source,'utf8');
console.log(JSON.stringify({subjects:subjects.length,questions:questions.length,
 topicFamilies:new Set(topicQuestions.map(q=>q.family)).size,
 acceptedAnswers:questions.reduce((sum,q)=>sum+q.answers.length,0),
 minimumPromptsPerSubject:Math.min(...memberships.map(s=>s.count)),
 perBand:Array.from({length:8},(_,band)=>questions.filter(q=>q.band===band).length)},null,2));
