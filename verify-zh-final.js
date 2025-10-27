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

const zhKeys = countKeys(zh.medico);
const esKeys = countKeys(es.medico);

console.log('ZH keys:', zhKeys);
console.log('ES keys:', esKeys);
console.log('Match:', zhKeys === esKeys ? '✅' : '❌');
