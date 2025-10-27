const zh = require('./public/locales/zh/common.json');
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

const zhKeys = countKeys(zh.medico);
const esKeys = countKeys(es.medico);

console.log('ZH keys:', zhKeys);
console.log('ES keys:', esKeys);
console.log('Match:', zhKeys === esKeys ? '✅' : '❌');

if (zhKeys !== esKeys) {
  const zhKeyList = getAllKeys(zh.medico);
  const esKeyList = getAllKeys(es.medico);
  
  const extraKeys = zhKeyList.filter(k => !esKeyList.includes(k));
  const missingKeys = esKeyList.filter(k => !zhKeyList.includes(k));
  
  if (extraKeys.length > 0) {
    console.log(`\nClaves extra en ZH (${extraKeys.length}):`);
    extraKeys.slice(0, 20).forEach(k => console.log(`  - ${k}`));
    if (extraKeys.length > 20) console.log(`  ... y ${extraKeys.length - 20} más`);
  }
  
  if (missingKeys.length > 0) {
    console.log(`\nClaves faltantes en ZH (${missingKeys.length}):`);
    missingKeys.slice(0, 20).forEach(k => console.log(`  - ${k}`));
    if (missingKeys.length > 20) console.log(`  ... y ${missingKeys.length - 20} más`);
  }
}
