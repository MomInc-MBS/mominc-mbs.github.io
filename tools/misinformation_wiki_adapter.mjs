// Source metadata supplies identity and readership, never an invented allegation.
const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function readershipTiers(records){
 const measured=records.filter(r=>Number.isFinite(r.views)&&r.views>=0).sort((a,b)=>b.views-a.views);
 const tiers=new Map();
 for(let i=0;i<measured.length;){
  let end=i+1;while(end<measured.length&&measured[end].views===measured[i].views)end++;
  // Equal readership gets an equal score. These are global archive ranks,
  // not a quota reapplied to each question or a claim about game players.
  const percentile=i/Math.max(1,measured.length);
  const tier=percentile<.30?0:percentile<.55?1:percentile<.75?2:percentile<.90?3:4;
  for(let j=i;j<end;j++)tiers.set(measured[j].id,tier);
  i=end;
 }
 return tiers;
}
export function addWikipediaSubjects(reviewed,index){
 const records=index.articles||[],tiers=readershipTiers(records);
 const owner=new Map();
 for(const s of reviewed)for(const name of [s.name,...s.aliases])if(!owner.has(normalize(name)))owner.set(normalize(name),s);
 const added=[];
 for(const r of records){
  if(!r.name||!r.description||!/^wiki-\d+$/.test(r.id)||r.name.length>160)continue;
  const existing=owner.get(normalize(r.name));
  if(existing){
   for(const alias of r.aliases||[]){const n=normalize(alias);if(n&&!owner.has(n)&&alias.length<=160){existing.aliases.push(alias);owner.set(n,existing);}}
   continue;
  }
  const categoryText=(r.categories||[]).join(' '),description=r.description.toLowerCase();
  const text=(r.name+' '+r.description+' '+categoryText).toLowerCase();
  const kind=(r.topics||[]).some(t=>['conspiracy theory','urban legend','hoax','pseudoscience'].includes(t));
  const topics=new Set(['wiki-reference']);
  if(kind){
   topics.add('conspiracy');topics.add('unusual-history');
   if(/space|moon|mars|ufo|alien|extraterrestrial|apollo|astronom/.test(text))topics.add('space-claims');
   if(/earth|weather|climate|nature|chemtrail|geograph|environment|animals?|birds?|wildlife/.test(text))topics.add('nature-claims');
   if(/govern|politic|assassin|president|cia\b|fbi\b|intelligence|state|military|false.flag/.test(text))topics.add('government-claims');
   if(/scien|medic|vacci|health|disease|virus|bio|psych|radiation|chemic/.test(text))topics.add('science-claims');
   if(/technolog|weapon|machine|5g|radiation|time.travel|haarp|internet|online|robot|computer|digital/.test(text))topics.add('extraordinary-technology');
   if(/hidden|hollow|secret.base|lost.civil|atlantis/.test(text))topics.add('hidden-worlds');
   if(/apocalyp|doomsday|end.of.the.world/.test(text))topics.add('doomsday');
   if((r.topics||[]).some(t=>['urban legend','hoax'].includes(t)))topics.add('wiki-stories');
   if((r.topics||[]).includes('pseudoscience'))topics.add('wiki-fringe');
  }else{
   if(/assassinat|scandal|political|historical|history|war|government/.test(text))topics.add('wiki-history');
   if(/\b(experiment|study|studies|research project)\b/.test(description))['research','experiments','science'].forEach(t=>topics.add(t));
   if(/psycholog/.test(description)&&topics.has('experiments'))topics.add('psychology');
   if(/\b(space mission|spaceflight|spacecraft|lunar mission|rocket mission)\b/.test(description))['missions','space','science','technology'].forEach(t=>topics.add(t));
   if(/\b(president|prime minister|monarch|political leader|head of state|dictator)\b/.test(description))['leaders','people','government','history'].forEach(t=>topics.add(t));
  }
  const measured=tiers.has(r.id),familiarity=tiers.get(r.id)??1;
  const metric=measured?`Familiarity uses ${r.views.toLocaleString('en-US')} Wikipedia pageviews (${r.viewsWindow||index.viewsWindow}). It is a public readership proxy, not player answer frequency.`:'No readership observation was available. This answer receives discovery credit, not an invented rarity estimate.';
  const subject={id:r.id,name:r.name,aliases:[],classification:kind?'claim':'event',classificationMode:kind?'topic':'statement',
   statement:kind?r.description:`Wikipedia describes ${r.name} as: ${r.description}`,
   explanation:`${kind?'The linked article describes this as a conspiracy belief, legend, hoax, or fringe belief. Identifying the topic does not endorse its claims.':'This card confirms a documented encyclopedia subject; it does not prove every allegation associated with it.'} ${metric}`,
   source:r.source,publisher:r.publisher||'Wikipedia contributors (CC BY-SA)',category:kind?'Conspiracy, legend or fringe belief':'Wikipedia reference subject',
   topics:[...topics],familiarity,depth:kind?Math.max(3,familiarity+2):familiarity,
   readership:{views:measured?r.views:null,window:r.viewsWindow||index.viewsWindow},...(measured?{}:{rewardKind:'discovery'})};
  owner.set(normalize(subject.name),subject);
  for(const alias of r.aliases||[]){const n=normalize(alias);if(n&&!owner.has(n)&&alias.length<=160){subject.aliases.push(alias);owner.set(n,subject);}}
  added.push(subject);
 }
 return [...reviewed,...added];
}

export const wikipediaQuestions=[
 ['wiki-01',3,'Name a documented topic connected to conspiracies or unusual history.','wiki-reference'],
 ['wiki-02',3,'Name a conspiracy theory, extraordinary belief, legend, or hoax.','conspiracy'],
 ['wiki-03',3,'Name an urban legend or a hoax.','wiki-stories'],
 ['wiki-04',4,'Name a fringe or pseudoscientific belief.','wiki-fringe'],
 ['wiki-05',4,'Name a historical event, case, person, or organization connected to political history.','wiki-history'],
 ['wiki-06',4,'Name a theory or legend involving space.','space-claims'],
 ['wiki-07',5,'Name a conspiracy belief involving government power.','government-claims'],
 ['wiki-08',5,'Name a conspiracy or fringe belief about Earth, weather, or the environment.','nature-claims'],
 ['wiki-09',6,'Name a conspiracy or fringe belief involving science.','science-claims'],
 ['wiki-10',7,'Name any topic from the conspiracy and unusual-history encyclopedia archive.','wiki-reference']
].map(([id,band,prompt,topic])=>({id,band,prompt,topics:[topic],family:'wiki-archive',topic:'Wikipedia transmission',hint:'Think of a specific named topic, person, event, theory, or project that fits this category.',onlyClaims:!['wiki-01','wiki-05','wiki-10'].includes(id)}));
