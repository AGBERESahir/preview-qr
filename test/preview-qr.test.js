const test = require('node:test');
const assert = require('node:assert');
const net = require('node:net');
const { candidats, construireUrl, estPrivee } = require('../preview-qr.js');

const v4 = (address, internal = false) => ({ family: 'IPv4', address, internal });

test('met le Wi-Fi privé avant Docker, les adresses publiques et 169.254', () => {
  const liste = candidats({
    docker0: [v4('172.17.0.1')],
    lo: [v4('127.0.0.1', true)],
    'Wi-Fi': [v4('192.168.1.42')],
    eth9: [v4('169.254.10.2')],
  });
  assert.deepStrictEqual(liste.map(c => c.ip), ['192.168.1.42', '172.17.0.1', '169.254.10.2']);
  assert.strictEqual(liste[1].virtuelle, true);
});

test('estPrivee reconnaît les plages RFC 1918', () => {
  assert.ok(estPrivee('10.0.0.5') && estPrivee('192.168.0.9') && estPrivee('172.20.1.1'));
  assert.ok(!estPrivee('172.32.0.1') && !estPrivee('8.8.8.8'));
});

test('construireUrl gère protocole et chemin', () => {
  assert.strictEqual(construireUrl({ ip: '192.168.1.5', port: 3000 }), 'http://192.168.1.5:3000');
  assert.strictEqual(construireUrl({ ip: '192.168.1.5', port: 5173, https: true, chemin: 'admin' }), 'https://192.168.1.5:5173/admin');
});

test('diagnostic : serveur limité à localhost', async () => {
  const { diagnostiquer } = require('../preview-qr.js');
  const serveur = net.createServer().listen(0, '127.0.0.1');
  await new Promise(r => serveur.once('listening', r));
  const d = await diagnostiquer('192.0.2.1', serveur.address().port);
  serveur.close();
  assert.strictEqual(d.ok, false);
  assert.match(d.message, /localhost/);
});
