const es = require('./public/locales/es/common.json');
const ja = require('./public/locales/ja/common.json');

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

const esKeys = countKeys(es);
const jaKeys = countKeys(ja);

console.log('ES total keys:', esKeys);
console.log('JA total keys:', jaKeys);
console.log('Difference:', jaKeys - esKeys, jaKeys > esKeys ? '(JA has more)' : jaKeys < esKeys ? '(JA has less)' : '(PERFECT MATCH! ✅)');

// Count medico section specifically
const esMedicoKeys = countKeys(es.medico || {});
const jaMedicoKeys = countKeys(ja.medico || {});
console.log('\n=== medico section ===');
console.log('ES medico keys:', esMedicoKeys);
console.log('JA medico keys:', jaMedicoKeys);
console.log('Medico difference:', jaMedicoKeys - esMedicoKeys);
