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

console.log('=== Medico Sections Comparison ===\n');

const sections = [
  'appointments',
  'availability', 
  'billing',
  'dashboard',
  'errors',
  'header',
  'loading',
  'modals',
  'password',
  'patients',
  'profile',
  'sidebar'
];

sections.forEach(section => {
  const esCount = countKeys(es.medico[section] || {});
  const jaCount = countKeys(ja.medico[section] || {});
  const match = esCount === jaCount ? '✅' : '❌';
  const diff = jaCount - esCount;
  console.log(`${match} ${section.padEnd(15)} ES=${esCount.toString().padStart(3)} JA=${jaCount.toString().padStart(3)} ${diff !== 0 ? `(${diff > 0 ? '+' : ''}${diff})` : ''}`);
});

const totalEs = countKeys(es.medico);
const totalJa = countKeys(ja.medico);
console.log(`\n${'='.repeat(50)}`);
console.log(`TOTAL${' '.repeat(10)} ES=${totalEs.toString().padStart(3)} JA=${totalJa.toString().padStart(3)} ${totalEs === totalJa ? '✅ PERFECT!' : '❌'}`);
