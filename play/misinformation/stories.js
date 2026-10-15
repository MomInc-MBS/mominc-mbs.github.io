// Original MOM Inc. office/space wordplay. Render fillStory() with textContent.
// These fictional reports never classify a whole person or subject as a claim.
export const STORY_LIMITS = Object.freeze({maxInputLength:80,maxHistory:100,maxSlots:8});

const labels=Object.freeze({
  subject:'Answer from your run',noun:'Noun or name of a thing',person:'Person',
  place:'Place',event:'Event',theory:'Unsupported theory or claim',
  verb:'Verb (base form)',adjective:'Adjective',adverb:'Adverb'
});
function template(id,title,text,types) {
  return Object.freeze({id,title,text,slots:Object.freeze(types.split(' ').map(type=>
    Object.freeze({id:type,type,label:labels[type]})))});
}

export const STORY_TEMPLATES=Object.freeze([
  template('escape-receipt','Your escape receipt',
    'MOM Inc. confirms receipt of one {adjective} escape attempt. Your cargo manifest listed {subject}; the accounting department renamed it {noun}. You were instructed to {verb} {adverb} until the navigation screen displayed "{place}". A printer has been promoted for your bravery.',
    'adjective subject noun verb adverb place'),
  template('hr-warning','Final warning from Human Resources',
    'A cardboard cutout of {person} has been appointed your {adjective} supervisor. Its mandatory training video is titled "{event}". You must {verb} {adverb}, return {noun} to the supply cupboard, and stop teaching the escape pod to unionize.',
    'person adjective event verb adverb noun'),
  template('station-cafeteria','The station lunch special',
    'Today at the MOM Inc. cafeteria: a {adjective} special named "{subject}". The menu cites a folder labeled "{theory}" as its recipe book. Please {verb} {adverb} when your order number is called. Your complimentary side dish is called {noun}. The chef is a fax machine.',
    'adjective subject theory verb adverb noun'),
  template('lost-luggage','Interplanetary lost luggage',
    'Your suitcase arrived at {place} wearing a {adjective} employee badge. Inside was a souvenir labeled "{subject}" and a ticket to a reenactment of {event}. MOM Inc. asks you to {verb} {adverb} while a conveyor belt considers your appeal.',
    'place adjective subject event verb adverb'),
  template('board-meeting','Emergency board meeting',
    'The board held an emergency meeting about {subject}. A cardboard cutout of {person} chaired proceedings; a {adjective} stapler recorded the minutes. The unanimous resolution: {verb} {adverb}. The minutes were immediately filed under "{theory}" and launched into the sun.',
    'subject person adjective verb adverb theory'),
  template('pod-inspection','Escape pod inspection',
    'An inspector found {noun} in the escape pod and declared the entire vessel {adjective}. The dashboard was playing a documentary titled "{event}". You were told to {verb} {adverb} at the next checkpoint, then set the destination label to "{place}". The inspector confiscated gravity.',
    'noun adjective event verb adverb place'),
  template('intern-handbook','The intern survival handbook',
    'Welcome to MOM Inc., intern. Your {adjective} desk is beside a display labeled "{subject}". If the alarm sounds, {verb} {adverb} and hand the cardboard cutout of {person} a note reading "{noun}". Do not make eye contact with the quarterly forecast.',
    'adjective subject verb adverb person noun'),
  template('museum-tour','Tour of the corporate museum',
    'On your left is a {adjective} exhibit titled "{event}". On your right is the folder labeled "{theory}" that the gift shop keeps misplacing. Please {verb} {adverb} toward the exit marked "{place}". The audio guide will now repeat the words "{subject}" until morale improves.',
    'adjective event theory verb adverb place subject'),
  template('performance-review','Your performance review',
    'Employee achievement unlocked: {subject}. MOM Inc. rated your paperwork {adjective} and assigned the motivational poster labeled "{person}" to your cubicle. Next quarter, please {verb} {adverb}. Your bonus is an empty box marked "{noun}"; the box has seniority.',
    'subject adjective person verb adverb noun'),
  template('radio-ad','A message from our sponsors',
    'This transmission is sponsored by {noun}, the {adjective} product nobody ordered. Our jingle is named after {subject}. For a free sample, {verb} {adverb} and mail the coupon to the destination marked "{place}". MOM Inc. accepts payment in unused escape plans.',
    'noun adjective subject verb adverb place'),
  template('classified-pigeon','The classified delivery',
    'A {adjective} mechanical pigeon delivered a folder labeled "{theory}". Its cover sheet mentioned {subject}, but the inside contained only a postcard titled "{event}". You decided to {verb} {adverb}. The pigeon invoiced MOM Inc. for {noun} and flew into a meeting.',
    'adjective theory subject event verb adverb noun'),
  template('arrival-party','The arrival party',
    'At the station gate, a banner announced: "Welcome, {subject}!" A cardboard cutout of {person} greeted your {adjective} escape pod. The party playlist was named "{event}". You chose to {verb} {adverb}, and MOM Inc. accidentally approved your vacation request.',
    'subject person adjective event verb adverb')
]);

const clean=value=>typeof value==='string'
  ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim().slice(0,STORY_LIMITS.maxInputLength)
  : '';
function randomIndex(length,random) {
  const value=random();
  const unit=typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(.999999999,value)):0;
  return Math.floor(unit*length);
}

// A proper name is grammatical in noun/subject slots. Narrower roles require
// affirmative metadata: a real event is not a person; a spacecraft is not a place.
function rolesFor(subject) {
  const topics=new Set(Array.isArray(subject.topics)?subject.topics:[]);
  const roles=new Set(['subject','noun']);
  const personName=!/\b(case|killings|murders|trial|assassination|government)\b/i.test(subject.name||'');
  if(personName&&['people','leaders','serial-killers','criminal-people','political-people'].some(t=>topics.has(t))) roles.add('person');
  if(subject.classification==='claim') roles.add('theory');
  if(subject.classification==='event'&&topics.has('events')) roles.add('event');
  // These are geographical destinations rather than all astronomical objects:
  // telescopes, asteroids belts, galaxies and unsupported hidden worlds stay out.
  if(subject.classification==='event'&&new Set([
    'mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto',
    'moon','ceres','area-51'
  ]).has(subject.id)) roles.add('place');
  if(subject.classification==='event'&&topics.has('places')) roles.add('place');
  return roles;
}

/**
 * history: engine entries {subject:id,...}, optionally typedAnswer/subjectName.
 * Result slots carry editable plain-text values. fromAnswer marks provenance;
 * missing semantic roles remain empty, as do verb/adjective/adverb slots.
 */
export function createStoryDraft(history,subjects,random=Math.random) {
  const chosen=STORY_TEMPLATES[randomIndex(STORY_TEMPLATES.length,random)];
  const byId=new Map((Array.isArray(subjects)?subjects:[]).filter(s=>s&&typeof s.id==='string').map(s=>[s.id,s]));
  const seen=new Set(),answers=[];
  for(const entry of (Array.isArray(history)?history:[]).slice(-STORY_LIMITS.maxHistory)) {
    if(!entry||entry.skipped||typeof entry.subject!=='string')continue;
    const subject=byId.get(entry.subject);
    const value=clean(entry.typedAnswer)||clean(entry.subjectName)||clean(subject?.name);
    if(!value||seen.has(entry.subject))continue;
    seen.add(entry.subject);
    answers.push({id:entry.subject,value,roles:subject?rolesFor(subject):new Set(['subject','noun'])});
  }
  const used=new Set();
  const slots=chosen.slots.map(slot=>{
    const pool=answers.filter(a=>a.roles.has(slot.type));
    const fresh=pool.filter(a=>!used.has(a.id));
    const eligible=fresh.length?fresh:pool;
    const answer=eligible.length?eligible[randomIndex(eligible.length,random)]:null;
    if(answer)used.add(answer.id);
    return {...slot,value:answer?.value||'',fromAnswer:!!answer,...(answer?{sourceSubject:answer.id}:{})};
  });
  return {version:1,templateId:chosen.id,title:chosen.title,template:chosen.text,slots};
}

/** Returns a bounded plain-text string; never insert the result as HTML. */
export function fillStory(draft,values={}) {
  const selected=STORY_TEMPLATES.find(t=>t.id===draft?.templateId);
  if(!selected)throw new TypeError('Unknown story template.');
  const saved=new Map((Array.isArray(draft.slots)?draft.slots:[]).slice(0,STORY_LIMITS.maxSlots).map(s=>[s?.id,s]));
  return selected.text.replace(/\{([a-z]+)\}/g,(_,id)=>{
    const supplied=values&&typeof values==='object'&&Object.hasOwn(values,id);
    return clean(supplied?values[id]:saved.get(id)?.value)||`[${id}]`;
  });
}
