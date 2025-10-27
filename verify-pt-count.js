const pt = require('./public/locales/pt/common.json');
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

const ptKeys = countKeys(pt.medico);
const esKeys = countKeys(es.medico);

console.log('PT keys:', ptKeys);
console.log('ES keys:', esKeys);
console.log('Match:', ptKeys === esKeys ? '✅' : '❌');
