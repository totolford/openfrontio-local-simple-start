<p align="center">
  <img src="resources/images/OpenFrontLogo.svg" alt="OpenFrontIO Logo" width="320">
</p>

# OpenFront Local Edition

Version locale d'OpenFront orientee jeu prive: Solo, creation de groupe, et connexion par URL d'invitation.

## 1. Prerequis

- Node.js 22+ (npm inclus)
- Windows 10/11, macOS, ou Linux
- Un navigateur recent (Chrome, Edge, Firefox)

## 2. Installation

```bash
git clone https://github.com/openfrontio/OpenFrontIO.git
cd OpenFrontIO
npm run inst
```

## 3. Lancement simple (Windows recommande)

Lance directement le fichier:

```text
start-openfront.cmd
```

Tu peux le lancer en double-cliquant dessus.

Ce script:
- installe les dependances si besoin
- demarre le jeu en mode public
- affiche les URLs utiles (localhost, LAN, URL internet)

## 4. Lancement manuel (tous OS)

Mode local dev:

```bash
npm run dev
```

Mode LAN (meme reseau):

```bash
npm run dev:lan
```

Mode internet (reseaux differents):

```bash
npm run dev:public
```

## 5. Jouer avec un ami (reseaux differents)

1. Le host lance `start-openfront.cmd` (ou `npm run dev:public`).
2. Le host clique **Creer un groupe**.
3. Le host copie l'adresse affichee.
4. L'invite ouvre son jeu, clique **Rejoindre un groupe**, puis colle l'adresse.
5. Le host configure la partie et lance.

Important:
- N'ajoute pas `:9000` si l'adresse est `https://...trycloudflare.com` ou `https://...loca.lt`.
- `localhost` ne fonctionne que sur la machine locale.

## 6. Raccourci bureau (Windows)

Pour lancer en un clic:

1. Clic droit sur `start-openfront.cmd`
2. **Envoyer vers > Bureau (creer un raccourci)**
3. Lance le jeu depuis ce raccourci

## 7. Depannage rapide

### Erreur `EPERM unlink lightningcss...`
- Ferme les terminaux Node/Vite.
- Supprime `node_modules`.
- Relance `npm run inst`.
- Si besoin, desactive temporairement l'antivirus sur le dossier.

### Message `Blocked request. This host ... is not allowed`
- Demarre via les scripts fournis (`dev:public`, `start-openfront.cmd`).
- Verifie que l'URL ouverte est bien celle affichee par le tunnel.

### `ERR_CONNECTION_REFUSED`
- Verifie que le terminal host tourne encore.
- Verifie que l'URL copiee est complete.
- N'ajoute pas de port sur les URLs `https://...`.

## 8. Scripts utiles

- `npm run inst`: installation propre via lockfile
- `npm run dev`: client + serveur local
- `npm run dev:lan`: acces LAN
- `npm run dev:public`: acces internet via tunnel
- `npm run build-dev`: build de verification
- `npm test`: tests

## 9. Changelog in-game

Le panneau **News** charge le fichier:

```text
resources/changelog.md
```

Modifie ce fichier pour afficher tes notes de version directement dans le jeu.

## 10. Licence

- Code: GNU AGPL v3 (`LICENSE`)
- Assets: CC BY-SA 4.0 (`LICENSE-ASSETS`)

