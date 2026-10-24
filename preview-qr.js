#!/usr/bin/env node
// preview-qr : affiche un QR code pour ouvrir ton localhost sur ton téléphone (même Wi-Fi).
// Usage : node dev/preview-qr.js [port]   (défaut : 3000)
const os = require('os');
const qrcode = require('qrcode-terminal');

const port = process.argv[2] || '3000';
const ip = Object.values(os.networkInterfaces()).flat()
  .find(i => i && i.family === 'IPv4' && !i.internal)?.address;

if (!ip) {
  console.error('Aucune adresse réseau locale trouvée. Es-tu connecté au Wi-Fi ?');
  process.exit(1);
}
const url = `http://${ip}:${port}`;
console.log(`\nScanne avec ton téléphone (même réseau Wi-Fi) :\n  ${url}\n`);
qrcode.generate(url, { small: true });
console.log('\nSi la page ne s’ouvre pas, lance ton serveur avec --host 0.0.0.0 et autorise le port dans le pare-feu.');
