const es = require('./public/locales/es/common.json');
const ja = require('./public/locales/ja/common.json');

function getKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getKeys(obj[key], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const esKeys = getKeys(es.medico.availability).sort();
const jaKeys = getKeys(ja.medico.availability).sort();

console.log('=== ES availability keys (total:', esKeys.length, ') ===');
esKeys.forEach(k => console.log(k));

console.log('\n=== JA availability keys (total:', jaKeys.length, ') ===');
jaKeys.forEach(k => console.log(k));

console.log('\n=== Keys in JA but not in ES ===');
const extraInJa = jaKeys.filter(k => !esKeys.includes(k));
extraInJa.forEach(k => console.log('EXTRA:', k));

console.log('\n=== Keys in ES but not in JA ===');
const missingInJa = esKeys.filter(k => !jaKeys.includes(k));
missingInJa.forEach(k => console.log('MISSING:', k));
