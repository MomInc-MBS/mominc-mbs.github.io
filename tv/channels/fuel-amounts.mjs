// Educational reference servings, not universal daily requirements.
// Blend mass is used for cost; electrolytes disclose the modeled sodium content.
export const AMOUNTS=Object.freeze({
  caffeine:{baseGrams:.1,unit:'mg',base:100,note:'100 / 200 mg per serving. Caffeine has no required daily intake. EFSA: up to 200 mg at once and 400 mg/day from all sources for healthy nonpregnant adults; even 100 mg can affect sleep.',source:'https://www.efsa.europa.eu/en/topics/topic/caffeine',sourceName:'EFSA · caffeine'},
  theanine:{baseGrams:.1,unit:'mg',base:100,note:'100 / 200 mg per serving. L-theanine has no established daily requirement. Small studies examine attention and stress; effects and optimal amounts remain uncertain.',source:'https://pubmed.ncbi.nlm.nih.gov/18681988/',sourceName:'L-theanine & attention · trial'},
  glutamine:{baseGrams:2.5,unit:'g',base:2.5,note:'2.5 / 5 g per serving are illustrative supplement amounts. The body makes glutamine; NIH finds little support for improving athletic performance with supplementation.',source:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/',sourceName:'NIH · sports supplements'},
  citrulline:{baseGrams:3,unit:'g',base:3,note:'3 / 6 g of L-citrulline per serving, not citrulline-malate weight. No established daily requirement; exercise results are mixed and stomach discomfort can occur.',source:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/',sourceName:'NIH · citrulline'},
  creatine:{baseGrams:3,unit:'g',base:3,note:'3 / 6 g of creatine monohydrate per serving. Common daily maintenance is 3–5 g; 6 g is above that usual range. Doubling does not mean twice the benefit.',source:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/',sourceName:'NIH · creatine'},
  electrolytes:{baseGrams:.5,unit:'mg sodium',base:200,note:'200 / 400 mg sodium per serving, modeled in a hypothetical 0.5 / 1 g blend at 40% sodium. Other minerals are unspecified. Replacement depends on sweat losses, activity and diet, rather than a fixed daily supplement dose.',source:'https://pubmed.ncbi.nlm.nih.gov/17277604/',sourceName:'ACSM · fluid replacement'}
});
const SHORT_NOTES={
  caffeine:'100 / 200 mg. Alertness stimulant; count all caffeine sources. Even 100 mg can affect sleep.',
  theanine:'100 / 200 mg. Studied for attention and relaxation; no established daily requirement.',
  glutamine:'2.5 / 5 g. Illustrative supplement amount; athletic benefits remain uncertain.',
  citrulline:'3 / 6 g of pure L-citrulline. Exercise evidence is mixed; not citrulline-malate weight.',
  creatine:'3 / 6 g monohydrate. Typical maintenance is 3-5 g/day; doubling does not mean twice the benefit.',
  electrolytes:'200 / 400 mg sodium. Hypothetical 40% sodium blend; replacement depends on sweat losses.'
};
for(const [key,note] of Object.entries(SHORT_NOTES))AMOUNTS[key].short=note;
export function servingAmount(key,count){const r=AMOUNTS[key];return r&&count?`${r.base*Math.min(2,Math.max(0,count))} ${r.unit}`:'NONE';}
export function servingGrams(key,count){return (AMOUNTS[key]?.baseGrams||0)*Math.min(2,Math.max(0,count));}
