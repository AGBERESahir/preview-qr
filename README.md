# preview-qr

Affiche dans le terminal un **QR code** pour ouvrir ton site en cours de développement sur ton téléphone, en une seconde, sans taper d'adresse IP.

Tu lances ton serveur (`npm run dev`), tu lances `preview-qr`, tu scannes avec l'appareil photo : la page s'ouvre. Il vérifie aussi que ton serveur est **vraiment joignable depuis le réseau** et te dit quoi corriger sinon.

- Une seule dépendance : [`qrcode-terminal`](https://www.npmjs.com/package/qrcode-terminal).
- Node 18 ou plus.
- Fonctionne avec n'importe quel serveur : Vite, Next.js, Expo, PHP (`php -S`), Python (`http.server`), etc.

## Prérequis

- L'ordinateur et le téléphone sont sur **le même réseau Wi-Fi**.
- Ton serveur de développement tourne déjà.

## Installation

```bash
git clone https://github.com/AGBERESahir/preview-qr.git
cd preview-qr
npm install
node preview-qr.js 3000
```

Pour l'utiliser depuis n'importe quel projet : `npm install -g .` dans ce dossier, puis `preview-qr 3000`.

## Utilisation

```text
preview-qr [port] [options]
```

Le port par défaut est `3000`.

| Option | Effet |
|---|---|
| `--path=/chemin` | Ajoute un chemin à l'adresse, par exemple `--path=/admin`. |
| `--https` | Utilise `https://` au lieu de `http://`. |
| `--ip=ADRESSE` | Impose l'adresse IP au lieu de la détecter. |
| `--all` | Affiche un QR code pour **chaque** adresse trouvée. |
| `--no-check` | Ne teste pas si le serveur répond. |
| `-h`, `--help` | Affiche l'aide. |

### Exemples

```bash
preview-qr                       # port 3000
preview-qr 5173                  # Vite
preview-qr 8000 --path=/login    # ouvre directement la page /login
preview-qr 3000 --all            # plusieurs cartes réseau : un QR code par adresse
```

## Comment l'adresse est choisie

Une machine a souvent plusieurs adresses : Wi-Fi, Ethernet, Docker, VirtualBox, VPN… Seule celle du réseau local est utile à ton téléphone. `preview-qr` classe les adresses ainsi :

1. adresses de réseau privé (`192.168.x.x`, `10.x.x.x`, `172.16.x.x` à `172.31.x.x`) sur une interface « normale » ;
2. adresses privées sur une interface **virtuelle** (Docker, VirtualBox, VMware, VPN) : signalées `interface virtuelle probable` ;
3. adresses « lien local » `169.254.x.x` (réseau non configuré) en dernier.

Si le mauvais réseau est choisi, relance avec `--all` ou impose l'adresse avec `--ip=`.

## Diagnostic automatique

Après le QR code, l'outil compare ce que ton ordinateur voit sur `localhost` et sur son adresse réseau :

| Message | Signification | Correction |
|---|---|---|
| `✓ Le serveur répond…` | Tout est bon. | Scanne le QR code. |
| `! Le serveur n'écoute que sur localhost` | Il accepte les connexions de ton ordinateur seulement. | Relance-le avec `--host 0.0.0.0` : `vite --host`, `next dev -H 0.0.0.0`, `expo start --lan`, `php -S 0.0.0.0:8000`. |
| `! Rien n'écoute sur le port X` | Le serveur n'est pas lancé, ou le port est faux. | Démarre-le ou corrige le numéro de port. |

Si tout est vert mais que la page ne s'ouvre pas sur le téléphone, c'est presque toujours le **pare-feu** de l'ordinateur : autorise le port (ou le réseau privé) et réessaie. L'outil ne peut pas détecter cela.

## Limites

- Ne fonctionne pas si le Wi-Fi isole les appareils entre eux (réseaux d'invités, certains Wi-Fi publics ou d'écoles).
- Détecte les adresses IPv4 uniquement.
- Le QR code est affiché en caractères : utilise un terminal avec une police monospace et assez grand.

## Développement

```bash
npm test     # tests node:test (classement des adresses, construction d'URL, diagnostic)
```

## Licence

MIT, voir [LICENSE](LICENSE).
