const pt = require('./public/locales/pt/common.json');
const es = require('./public/locales/es/common.json');

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

const ptKeys = getAllKeys(pt.medico);
const esKeys = getAllKeys(es.medico);

// Encontrar claves que están en PT pero no en ES
const extraKeys = ptKeys.filter(k => !esKeys.includes(k));

console.log(`\nClaves extra en PT (${extraKeys.length}):`);
extraKeys.forEach(k => console.log(`  - ${k}`));

// Encontrar claves que están en ES pero no en PT
const missingKeys = esKeys.filter(k => !ptKeys.includes(k));

console.log(`\nClaves faltantes en PT (${missingKeys.length}):`);
missingKeys.forEach(k => console.log(`  - ${k}`));
