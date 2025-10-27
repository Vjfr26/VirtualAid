const ru = require('./public/locales/ru/common.json');
const es = require('./public/locales/es/common.json');

function countKeys(obj) {
  let count = 0;
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const ruKeys = countKeys(ru.medico);
const esKeys = countKeys(es.medico);

console.log('RU keys:', ruKeys);
console.log('ES keys:', esKeys);
console.log('Match:', ruKeys === esKeys ? '✅' : '❌');

if (ruKeys !== esKeys) {
  const ruKeyList = getAllKeys(ru.medico);
  const esKeyList = getAllKeys(es.medico);
  
  const extraKeys = ruKeyList.filter(k => !esKeyList.includes(k));
  const missingKeys = esKeyList.filter(k => !ruKeyList.includes(k));
  
  if (extraKeys.length > 0) {
    console.log(`\nClaves extra en RU (${extraKeys.length}):`);
    extraKeys.slice(0, 20).forEach(k => console.log(`  - ${k}`));
    if (extraKeys.length > 20) console.log(`  ... y ${extraKeys.length - 20} más`);
  }
  
  if (missingKeys.length > 0) {
    console.log(`\nClaves faltantes en RU (${missingKeys.length}):`);
    missingKeys.slice(0, 20).forEach(k => console.log(`  - ${k}`));
    if (missingKeys.length > 20) console.log(`  ... y ${missingKeys.length - 20} más`);
  }
}
