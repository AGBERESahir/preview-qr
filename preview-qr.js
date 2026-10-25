#!/usr/bin/env node
// preview-qr : affiche un QR code pour ouvrir ton serveur local sur ton téléphone (même Wi-Fi).
// Voir README.md pour toutes les options.
const os = require('os');
const net = require('net');

const AIDE = `preview-qr : QR code pour ouvrir ton localhost sur ton téléphone (même Wi-Fi).

Usage :
  preview-qr [port] [options]        (port par défaut : 3000)

Options :
  --path=/chemin   Ajoute un chemin à l'adresse (ex. --path=/admin)
  --https          Utilise https:// au lieu de http://
  --ip=ADRESSE     Impose l'adresse IP au lieu de la détecter
  --all            Affiche un QR code pour chaque adresse trouvée
  --no-check       Ne teste pas si le serveur répond sur le port
  -h, --help       Affiche cette aide`;

const VIRTUELLE = /^(docker|br-|veth|vbox|virbr|vmnet|vethernet|utun|tun|tap|lo|zt|tailscale|wg)/i;

const estPrivee = ip => {
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
};

// Adresses IPv4 non locales, de la plus probable (Wi-Fi/Ethernet privé) à la moins probable.
function candidats(interfaces = os.networkInterfaces()) {
  const note = ({ nom, ip }) => (estPrivee(ip) ? 0 : 1) + (VIRTUELLE.test(nom) ? 2 : 0) + (ip.startsWith('169.254.') ? 4 : 0);
  return Object.entries(interfaces)
    .flatMap(([nom, adresses]) => (adresses || [])
      .filter(a => a.family === 'IPv4' && !a.internal)
      .map(a => ({ nom, ip: a.address, virtuelle: VIRTUELLE.test(nom) })))
    .sort((a, b) => note(a) - note(b));
}

function construireUrl({ ip, port, https = false, chemin = '' }) {
  const c = chemin ? (chemin.startsWith('/') ? chemin : '/' + chemin) : '';
  return `${https ? 'https' : 'http'}://${ip}:${port}${c}`;
}

function tester(hote, port, delai = 700) {
  return new Promise(resolve => {
    const s = net.connect({ host: hote, port: Number(port), timeout: delai });
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => resolve(false));
  });
}

// Compare ce que voit la machine en local et sur son adresse réseau.
async function diagnostiquer(ip, port) {
  const [v4, v6, lan] = await Promise.all([tester('127.0.0.1', port), tester('::1', port), tester(ip, port)]);
  if (lan) return { ok: true, message: `Le serveur répond sur le port ${port} depuis le réseau local.` };
  if (v4 || v6) return { ok: false, message: `Le serveur n'écoute que sur localhost. Relance-le avec --host 0.0.0.0 (Vite : \`vite --host\`, Next.js : \`next dev -H 0.0.0.0\`, Expo : \`--lan\`).` };
  return { ok: false, message: `Rien n'écoute sur le port ${port}. Lance d'abord ton serveur de développement, ou vérifie le numéro de port.` };
}

async function main(argv) {
  if (argv.includes('-h') || argv.includes('--help')) { console.log(AIDE); return 0; }
  const opt = n => (argv.find(a => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
  const port = argv.find(a => /^\d+$/.test(a)) || '3000';
  if (+port < 1 || +port > 65535) { console.error(`Port invalide : ${port}`); return 1; }

  let liste = opt('ip') ? [{ nom: 'manuel', ip: opt('ip') }] : candidats();
  if (!liste.length) {
    console.error('Aucune adresse réseau locale trouvée. Es-tu connecté au Wi-Fi ?');
    return 1;
  }
  if (!argv.includes('--all')) liste = liste.slice(0, 1);

  let qrcode;
  try { qrcode = require('qrcode-terminal'); } catch {
    console.error('Dépendance manquante : lance `npm install` dans le dossier de preview-qr.');
    return 1;
  }

  for (const { nom, ip, virtuelle } of liste) {
    const url = construireUrl({ ip, port, https: argv.includes('--https'), chemin: opt('path') });
    console.log(`\nScanne avec ton téléphone (même réseau Wi-Fi) :\n  ${url}   (${nom}${virtuelle ? ', interface virtuelle probable' : ''})\n`);
    qrcode.generate(url, { small: true });
    if (!argv.includes('--no-check')) {
      const d = await diagnostiquer(ip, port);
      console.log(`\n${d.ok ? '✓' : '!'} ${d.message}`);
    }
  }
  if (!argv.includes('--no-check')) console.log('\nSi la page ne s’ouvre toujours pas sur le téléphone, autorise le port dans le pare-feu de ton ordinateur.');
  return 0;
}

module.exports = { candidats, construireUrl, estPrivee, diagnostiquer };
if (require.main === module) main(process.argv.slice(2)).then(c => process.exit(c));
