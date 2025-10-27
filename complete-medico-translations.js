const fs = require('fs');
const path = require('path');

// Idiomas a actualizar
const languages = ['ar', 'de', 'fr', 'it', 'pt', 'ja', 'pl', 'ru', 'tr', 'zh'];

// Cargar español (referencia completa)
const esPath = './public/locales/es/common.json';
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Secciones que faltan (todas excepto patients y profile)
const missingSections = ['appointments', 'sidebar', 'header', 'loading', 'errors', 'availability', 'password', 'modals', 'dashboard'];

console.log('🔍 Verificando secciones faltantes en medico...\n');

languages.forEach(lang => {
  const langPath = `./public/locales/${lang}/common.json`;
  const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  
  if (!langData.medico) {
    console.log(`❌ ${lang}: No tiene sección medico`);
    return;
  }
  
  const existingSections = Object.keys(langData.medico);
  const missing = missingSections.filter(s => !existingSections.includes(s));
  
  console.log(`📊 ${lang}:`);
  console.log(`   ✅ Tiene: ${existingSections.join(', ')}`);
  console.log(`   ❌ Faltan: ${missing.join(', ')}`);
  console.log('');
});

console.log('\n⚠️ NOTA: Todos los idiomas necesitan las secciones faltantes de medico.');
console.log('📝 Se requiere traducción manual o uso de servicio de traducción profesional.');
