// Authored category prompts. These scopes drive accepted answers; they are not
// cosmetic rewrites of one narrow three-answer question.
const rows = (family, title, entries) => entries.map(([id, band, prompt, topics, hint]) => ({
  id, band, family, topic: title, prompt, topics: topics.split('|'),
  hint: hint || ''
}));

export const topicQuestions = [
 ...rows('space', 'Space & sky', [
  ['space-01',0,'Name a planet, moon, star, or other natural object in space.','natural-objects'],
  ['space-02',0,'Name a mission sent into space.','missions'],
  ['space-03',1,'Name a natural object or event studied by astronomers.','natural-objects|natural-events'],
  ['space-04',1,'Name a space mission or project.','missions|research'],
  ['space-05',2,'Name a spacecraft or space mission.','missions'],
  ['space-06',2,'Name a spacecraft or instrument sent into space.','instruments'],
  ['space-07',3,'Name a theory about alien life or artifacts.','aliens'],
  ['space-08',4,'Name a natural object or phenomenon visible in the sky.','natural-objects|natural-events'],
  ['space-09',5,'Name a claim about a space object, mission, or discovery.','space-claims'],
  ['space-10',6,'Name a theory alleging something extraordinary in space.','space-claims'],
 ]),
 ...rows('nature', 'The natural world', [
  ['nature-01',0,'Name a natural disaster.','natural-disasters'],
  ['nature-02',0,'Name a weather event or a project that studied weather.','weather'],
  ['nature-03',1,'Name a natural event.','natural-events'],
  ['nature-04',1,'Name a natural event or environmental issue.','environment'],
  ['nature-05',2,'Name a well-known natural disaster.','natural-disasters'],
  ['nature-06',3,'Name a natural object, event, or claim about Earth.','earth'],
  ['nature-07',3,'Name a documented natural event that seems extraordinary.','natural-events'],
  ['nature-08',4,'Name a theory about a supposedly hidden place or world.','hidden-worlds'],
  ['nature-09',5,'Name a claim about nature.','nature-claims'],
  ['nature-10',6,'Name an unusual natural event or formation.','natural-events|natural-formations'],
 ]),
 ...rows('science', 'Science & discovery', [
  ['science-01',0,'Name a scientific discovery or milestone.','scientific-milestones'],
  ['science-02',0,'Name a medical event, study, or discovery.','medicine'],
  ['science-03',1,'Name an invention or engineering milestone.','communication|computers|electronics|electricity|exploration'],
  ['science-04',1,'Name a psychology study or experiment.','psychology'],
  ['science-05',2,'Name a space research instrument or spacecraft.','instruments'],
  ['science-06',3,'Name a government project or psychology study.','programs|psychology'],
  ['science-07',3,'Name a scientific experiment.','experiments'],
  ['science-08',4,'Name a medical event, study, or ethical controversy.','medicine'],
  ['science-09',5,'Name a forensic investigation.','forensics'],
  ['science-10',7,'Name a claim about science or technology.','science-claims'],
 ]),
 ...rows('technology', 'Machines & inventions', [
  ['technology-01',0,'Name an invention or exploration project.','communication|computers|electronics|electricity|exploration'],
  ['technology-02',1,'Name a transport event, project, or space mission.','transport|missions'],
  ['technology-03',1,'Name an engineering project or milestone.','exploration'],
  ['technology-04',2,'Name a communications invention or landmark event.','communication|communications'],
  ['technology-05',2,'Name a research project involving technology.','programs'],
  ['technology-06',3,'Name a scientific instrument or space probe.','instruments'],
  ['technology-07',4,'Name a research experiment involving people or technology.','experiments'],
  ['technology-08',4,'Name a transport or industrial disaster.','industrial-disasters|transport-disasters'],
  ['technology-09',5,'Name a government program from the historical record.','programs'],
  ['technology-10',7,'Name a claim about unusual technology.','extraordinary-technology'],
 ]),
 ...rows('conspiracies', 'Conspiracies & secret stories', [
  ['conspiracies-01',3,'Name a well-known conspiracy theory.','conspiracy'],
  ['conspiracies-02',3,'Name a claim about government secrecy.','government-claims'],
  ['conspiracies-03',3,'Name a conspiracy theory about space.','space-claims'],
  ['conspiracies-04',3,'Name a conspiracy claim involving unusual technology.','extraordinary-technology'],
  ['conspiracies-05',3,'Name a conspiracy theory about nature.','nature-claims'],
  ['conspiracies-06',3,'Name a claim about a government cover-up.','government-claims'],
  ['conspiracies-07',4,'Name a conspiracy theory involving history or science.','conspiracy'],
  ['conspiracies-08',5,'Name a theory alleging a scientific hoax or cover-up.','science-claims'],
  ['conspiracies-09',6,'Name a theory about space or hidden government activity.','space-claims|government-claims'],
  ['conspiracies-10',7,'Name a conspiracy theory involving a hidden world or place.','hidden-worlds'],
 ]),
 ...rows('programs', 'Projects & operations', [
  ['programs-01',0,'Name a historical government operation or research project.','programs'],
  ['programs-02',1,'Name a covert government project or operation.','covert'],
  ['programs-03',1,'Name a documented military project or intelligence operation.','programs|covert'],
  ['programs-04',2,'Name a government project or program.','programs'],
  ['programs-05',3,'Name a space mission or government program.','missions|programs'],
  ['programs-06',3,'Name a research experiment.','experiments'],
  ['programs-07',4,'Name a documented research program or psychology study.','programs|psychology'],
  ['programs-08',5,'Name a covert operation or project.','covert'],
  ['programs-09',6,'Name a government research program or secret project.','programs'],
  ['programs-10',7,'Name a government project recorded in historical sources.','programs'],
 ]),
 ...rows('history', 'World history', [
  ['history-01',0,'Name a major event in world history.','events'],
  ['history-02',0,'Name a famous historical leader.','leaders'],
  ['history-03',1,'Name a war, wartime figure, or wartime project.','war'],
  ['history-04',1,'Name a milestone in science or exploration.','exploration'],
  ['history-05',2,'Name a trial or defendant from history.','courts'],
  ['history-06',2,'Name a historic document or law.','documents'],
  ['history-07',3,'Name a historic case, person, or public investigation.','investigations'],
  ['history-08',4,'Name an exploration mission or transport milestone.','exploration'],
  ['history-09',5,'Name a historical figure, program, or event tied to state abuse.','abuse'],
  ['history-10',6,'Name a conspiracy theory involving a historical subject.','conspiracy'],
 ]),
 ...rows('disasters', 'Disasters & major events', [
  ['disasters-01',0,'Name a major natural disaster.','natural-disasters'],
  ['disasters-02',0,'Name a famous transport or industrial disaster.','transport-disasters|industrial-disasters'],
  ['disasters-03',1,'Name a disaster that changed public life.','disasters'],
  ['disasters-04',1,'Name a historic explosion or fire.','explosions|fires'],
  ['disasters-05',2,'Name a famous transport disaster.','transport-disasters'],
  ['disasters-06',3,'Name a doomsday prediction or claim.','doomsday'],
  ['disasters-07',3,'Name a major environmental or industrial disaster.','industrial-disasters'],
  ['disasters-08',4,'Name a major disaster in the historical record.','disasters'],
  ['disasters-09',5,'Name a storm, space-weather event, or weather research project.','weather'],
  ['disasters-10',6,'Name a claim about nature or an impending catastrophe.','nature-claims|doomsday'],
 ]),
 ...rows('crime', 'Cases & investigations', [
  ['crime-01',0,'Name a criminal case, person, or public investigation.','investigations'],
  ['crime-02',0,'Name a famous criminal case or person involved in one.','criminal-cases'],
  ['crime-03',1,'Name a criminal case, person, or public scandal.','scandals|criminal-cases'],
  ['crime-04',1,'Name a person at the center of a historic criminal case.','criminal-people'],
  ['crime-05',2,'Name a criminal investigation or suspect linked to forensic evidence.','forensics'],
  ['crime-06',3,'Name a notorious serial killer or serial-killer case.','serial-killers'],
  ['crime-07',4,'Name a historical criminal case.','criminal-cases'],
  ['crime-08',5,'Name a criminal case, person, investigation, or public inquiry.','investigations|inquiries'],
  ['crime-09',6,'Name a historical criminal or person tried for a crime.','criminal-people'],
  ['crime-10',7,'Name a secret project, intelligence site, or political scandal.','covert|scandals'],
 ]),
 ...rows('leaders', 'Leaders & power', [
  ['leaders-01',0,'Name a world leader.','leaders'],
  ['leaders-02',0,'Name a leader or historic government.','leaders|governments'],
  ['leaders-03',1,'Name a political leader who shaped history.','leaders'],
  ['leaders-04',1,'Name a historical leader.','leaders'],
  ['leaders-05',2,'Name a leader documented in history.','leaders'],
  ['leaders-06',3,'Name a leader connected to political change.','leaders'],
  ['leaders-07',4,'Name a leader or a historic government document.','leaders|documents'],
  ['leaders-08',5,'Name a political leader or government project.','leaders|programs'],
  ['leaders-09',6,'Name a leader or court case in political history.','leaders|courts'],
  ['leaders-10',7,'Name a leader or event associated with a historic atrocity.','atrocity-cases'],
 ]),
 ...rows('world-affairs', 'Government & world affairs', [
  ['world-affairs-01',0,'Name a major event in world affairs.','international'],
  ['world-affairs-02',0,'Name a political leader.','leaders'],
  ['world-affairs-03',1,'Name a war or a person, event, or project tied to one.','war'],
  ['world-affairs-04',2,'Name a space mission or exploration project.','missions'],
  ['world-affairs-05',2,'Name a government program.','programs'],
  ['world-affairs-06',3,'Name a person, case, or event involved in a public investigation.','investigations|scandals'],
  ['world-affairs-07',4,'Name a claim alleging a government cover-up.','government-claims'],
  ['world-affairs-08',4,'Name a leader, event, law, or case tied to social change.','social-change|courts'],
  ['world-affairs-09',5,'Name a major world event or government project.','programs|international'],
  ['world-affairs-10',6,'Name an unexpected historical event, case, organization, or project.','unusual-history'],
 ]),
 ...rows('oddities', 'Stranger history', [
  ['oddities-01',2,'Name an unusual event, case, organization, or project from history.','unusual-history'],
  ['oddities-02',2,'Name a documented research experiment.','experiments'],
  ['oddities-03',3,'Name an unusual natural event.','natural-events'],
  ['oddities-04',3,'Name an unusual claim about a space object or mission.','space-claims'],
  ['oddities-05',3,'Name a surprising psychology study.','psychology'],
  ['oddities-06',3,'Name an unusual government project.','programs'],
  ['oddities-07',4,'Name a theory about a hidden place.','hidden-worlds'],
  ['oddities-08',4,'Name an unusual claim about a natural event.','nature-claims'],
  ['oddities-09',6,'Name a conspiracy theory about science or research.','science-claims'],
  ['oddities-10',7,'Name an unusual historical conspiracy theory.','conspiracy'],
 ]),
 ...rows('surveillance', 'Secrets & surveillance', [
  ['surveillance-01',0,'Name a surveillance or intelligence project or facility.','surveillance'],
  ['surveillance-02',1,'Name a secret government project, proposal, or facility.','covert'],
  ['surveillance-03',2,'Name a covert or surveillance project.','covert|surveillance'],
  ['surveillance-04',2,'Name a documented covert program.','covert'],
  ['surveillance-05',3,'Name a government research project.','programs'],
  ['surveillance-06',4,'Name a military surveillance or intelligence project or site.','surveillance'],
  ['surveillance-07',4,'Name a person, case, or project in an investigation or covert operation.','investigations|covert'],
  ['surveillance-08',5,'Name a covert operation or person or event tied to state abuse.','covert|abuse'],
  ['surveillance-09',6,'Name a conspiracy claim about hidden technology.','extraordinary-technology'],
  ['surveillance-10',7,'Name a documented secret program or operation.','programs'],
 ]),
 ...rows('sky-stories', 'Signals from the sky', [
  ['sky-stories-01',0,'Name a planet, moon, star, or other natural space object.','natural-objects'],
  ['sky-stories-02',1,'Name a space mission.','missions'],
  ['sky-stories-03',2,'Name a space mission or a transport event or project.','missions|transport'],
  ['sky-stories-04',3,'Name a claim about a space mystery.','space-claims'],
  ['sky-stories-05',3,'Name a weather event or weather research project.','weather'],
  ['sky-stories-06',4,'Name a natural space object or sky event.','natural-objects|natural-events'],
  ['sky-stories-07',5,'Name a theory about a mysterious object in space.','space-claims'],
  ['sky-stories-08',5,'Name a conspiracy claim about space exploration.','space-claims'],
  ['sky-stories-09',6,'Name a theory about a space cover-up or hoax.','space-claims'],
  ['sky-stories-10',7,'Name an unusual claim about the sky or space.','space-claims'],
 ]),
 ...rows('evidence', 'The public record', [
  ['evidence-01',0,'Name a documented event from history.','events'],
  ['evidence-02',1,'Name a criminal case or public scandal.','criminal-cases|scandals'],
  ['evidence-03',2,'Name a case or suspect documented with forensic evidence.','forensics'],
  ['evidence-04',3,'Name a person, case, or public inquiry in historical records.','investigations|inquiries'],
  ['evidence-05',3,'Name a historical leader or government document.','leaders|documents'],
  ['evidence-06',4,'Name a documented government project.','programs'],
  ['evidence-07',5,'Name a historical court proceeding or its defendant.','courts'],
  ['evidence-08',5,'Name a disaster documented in historical records.','disasters'],
  ['evidence-09',6,'Name a documented person, program, or event involving state abuse.','abuse'],
  ['evidence-10',7,'Name a documented scientific experiment.','experiments'],
 ]),
 ...rows('deep-files', 'The deep files', [
  ['deep-files-01',4,'Name a surprising historical case, organization, event, or project.','unusual-history'],
  ['deep-files-02',4,'Name a government research project or covert operation.','programs'],
  ['deep-files-03',4,'Name an unusual scientific experiment.','experiments'],
  ['deep-files-04',4,'Name a conspiracy theory about government power.','government-claims'],
  ['deep-files-05',4,'Name a theory alleging extraordinary technology.','extraordinary-technology'],
  ['deep-files-06',4,'Name a conspiracy claim involving government secrecy.','government-claims'],
  ['deep-files-07',5,'Name a theory about a hidden world.','hidden-worlds'],
  ['deep-files-08',5,'Name a conspiracy claim about science.','science-claims'],
  ['deep-files-09',6,'Name a conspiracy theory about unusual technology.','extraordinary-technology'],
  ['deep-files-10',7,'Name a conspiracy theory about a hidden world or government power.','hidden-worlds|government-claims'],
 ])
];

export const legacyScopes = {
 sky:['natural-objects','missions'], secrets:['programs'], 'power-and-records':['abuse'],
 'case-files':['criminal-cases'], 'sudden-disasters':['disasters'],
 'earth-claims':['nature-claims'], 'alien-appearances':['space-claims'],
 'classified-and-declassified':['programs'], 'signals-and-legends':['natural-objects','missions'],
 'space-and-natural-science':['natural-objects','natural-events'], 'forensic-trail':['forensics'],
 'impossible-machines':['extraordinary-technology'],
 'strange-research-records':['programs'], 'read-the-image':['space-claims'],
 'official-abuse-records':['abuse'], 'unlikely-intelligence':['covert'],
 'unlikely-disaster':['disasters'], 'hidden-geography':['hidden-worlds'],
 'stranger-than-fiction':['unusual-history'],
 'military-invention-files':['programs'],
 'responsibility-in-the-record':['abuse'], 'last-court-file':['courts'],
 'last-secret-project':['programs'], 'last-unreal-world':['space-claims']
};

export const legacyPrompts = {
 sky:'Name a natural space object or space mission.',
 secrets:'Name a documented government project or operation.',
 'power-and-records':'Name a person, event, or project tied to documented state abuse.',
 'case-files':'Name a criminal case or person at its center.',
 'sudden-disasters':'Name a documented disaster.',
 'earth-claims':'Name a claim about nature or Earth.',
 'alien-appearances':'Name a claim about outer space.',
 'classified-and-declassified':'Name a documented government program.',
 'signals-and-legends':'Name a natural space object or a space mission.',
 'space-and-natural-science':'Name a natural space object or natural event.',
 'forensic-trail':'Name a criminal case or person linked to forensic evidence.',
 'impossible-machines':'Name a claim about extraordinary technology.',
 'strange-research-records':'Name a documented government research program.',
 'read-the-image':'Name a claim about a mystery in space.',
 'official-abuse-records':'Name a person, program, or event tied to state abuse.',
 'unlikely-intelligence':'Name a documented secret government project or facility.',
 'unlikely-disaster':'Name a documented major disaster.',
 'hidden-geography':'Name a claim about a hidden world or place.',
 'stranger-than-fiction':'Name an unusual historical event, case, organization, or project.',
 'military-invention-files':'Name a government project or military experiment.',
 'responsibility-in-the-record':'Name a leader, event, or program tied to state abuse.',
 'last-court-file':'Name a historical trial or person tried in court.',
 'last-secret-project':'Name a documented government research project.',
 'last-unreal-world':'Name a theory about a mystery in space.'
};

// These are intersections and exclusions that the catalog builder applies after
// the OR topic match. They keep each accepted answer inside the written scope.
const claimIds = [
 'space-07','space-09','space-10','nature-08','nature-09',
 'science-10','technology-10',
 ...Array.from({length:10},(_,i)=>`conspiracies-${String(i+1).padStart(2,'0')}`),
 'history-10','disasters-06','disasters-10','world-affairs-07',
 'oddities-04','oddities-07','oddities-08','oddities-09','oddities-10',
 'surveillance-09',...Array.from({length:7},(_,i)=>`sky-stories-${String(i+4).padStart(2,'0')}`).filter(id=>!['sky-stories-05','sky-stories-06'].includes(id)),
 'deep-files-04','deep-files-05','deep-files-06','deep-files-07','deep-files-08','deep-files-09','deep-files-10',
 'earth-claims','alien-appearances','impossible-machines','read-the-image','hidden-geography','last-unreal-world'
];
export const questionFilters = Object.fromEntries(claimIds.map(id=>[id,{onlyClaims:true}]));
for(const id of ['space-03','space-08','sky-stories-06']) questionFilters[id]={allTopics:['sky']};
questionFilters['space-04']={allTopics:['space']};
for(const id of ['nature-08','conspiracies-10','oddities-07','deep-files-07','hidden-geography']) {
 questionFilters[id]={onlyClaims:true,excludeIds:['protocols-forgery-claim','flat-earth']};
}
for(const id of ['conspiracies-02','conspiracies-06','deep-files-04','deep-files-06','world-affairs-07']) {
 questionFilters[id]={onlyClaims:true,excludeIds:['protocols-forgery-claim']};
}
questionFilters['history-06']={excludeIds:['illuminati','freemasons']};
questionFilters['evidence-05']={excludeIds:['illuminati','freemasons']};

export const legacyBands = {
 'power-and-records':2, 'earth-claims':3, 'alien-appearances':3,
 'impossible-machines':4
};
