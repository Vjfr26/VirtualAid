const es = require('./public/locales/es/common.json');
const de = require('./public/locales/de/common.json');
const it = require('./public/locales/it/common.json');

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

console.log('=== GERMAN (DE) Sections Comparison ===\n');

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
  const deCount = countKeys(de.medico[section] || {});
  const match = esCount === deCount ? '✅' : '❌';
  const diff = deCount - esCount;
  console.log(`${match} ${section.padEnd(15)} ES=${esCount.toString().padStart(3)} DE=${deCount.toString().padStart(3)} ${diff !== 0 ? `(${diff > 0 ? '+' : ''}${diff})` : ''}`);
});

const totalEsDe = countKeys(es.medico);
const totalDe = countKeys(de.medico);
console.log(`\n${'='.repeat(50)}`);
console.log(`TOTAL (DE)${' '.repeat(6)} ES=${totalEsDe.toString().padStart(3)} DE=${totalDe.toString().padStart(3)} ${totalEsDe === totalDe ? '✅ PERFECT!' : `❌ (${totalDe > totalEsDe ? '+' : ''}${totalDe - totalEsDe})`}`);

console.log('\n\n=== ITALIAN (IT) Sections Comparison ===\n');

sections.forEach(section => {
  const esCount = countKeys(es.medico[section] || {});
  const itCount = countKeys(it.medico[section] || {});
  const match = esCount === itCount ? '✅' : '❌';
  const diff = itCount - esCount;
  console.log(`${match} ${section.padEnd(15)} ES=${esCount.toString().padStart(3)} IT=${itCount.toString().padStart(3)} ${diff !== 0 ? `(${diff > 0 ? '+' : ''}${diff})` : ''}`);
});

const totalIt = countKeys(it.medico);
console.log(`\n${'='.repeat(50)}`);
console.log(`TOTAL (IT)${' '.repeat(6)} ES=${totalEsDe.toString().padStart(3)} IT=${totalIt.toString().padStart(3)} ${totalEsDe === totalIt ? '✅ PERFECT!' : `❌ (${totalIt > totalEsDe ? '+' : ''}${totalIt - totalEsDe})`}`);
