const { execSync } = require('child_process');
const os = require('os');

// Obtener la IP real de la red local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar IPs internas y virtuales
      if (iface.family === 'IPv4' && !iface.internal) {
        const ip = iface.address;
        // Filtrar interfaces virtuales (10.x, 172.16-31.x, 169.254.x)
        if (!ip.startsWith('10.') && 
            !ip.startsWith('169.254.') && 
            !ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          return ip;
        }
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log('\n🌐 Servidor Next.js iniciando...\n');
console.log('📍 Accede desde:');
console.log(`   - Local:   http://localhost:3000`);
console.log(`   - Red LAN: http://${localIP}:3000`);
console.log('\n💡 Tip: Usa la dirección LAN para acceder desde otros dispositivos\n');
