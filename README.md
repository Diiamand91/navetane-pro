# NAVÉTANE PRO ⚽ — Le Football de Quartier

Jeu de football arcade **11 contre 11**, jouable directement dans le navigateur — et
**installable** comme une vraie application (icône sur l'écran d'accueil, plein écran,
hors ligne).

| Fichier | Rôle |
|---|---|
| `index.html` | le jeu complet (code, graphismes, sons — rien d'externe) |
| `manifest.webmanifest` | identité de l'app (nom, icônes, mode plein écran) |
| `server.js` | petit serveur (jeu + **salons WebSocket**) pour le **jeu en ligne** — zéro dépendance |
| `sw.js` | service worker : cache du jeu pour jouer **sans connexion** |
| `icons/` | icônes 192 / 384 / 512 / 180 px + version « maskable » |

---

## ▶️ Lancer le jeu

Ouvre `index.html` dans un navigateur (Chrome, Safari, Firefox…) — ou clique sur la
prévisualisation dans le chat. C'est tout.

Sur téléphone : passe en **mode paysage**.

Dans le menu : **① ton club · ② mode (Amical / Coupe / Championnat) · ③ 1 ou 2 joueurs**,
**④ l'adversaire · ⑤ le niveau**.

Le bouton **« En ligne »** du menu ouvre le jeu à deux **sur deux appareils différents** :
il faut alors lancer le petit serveur fourni (voir [Jouer en ligne](#-jouer-en-ligne-entre-amis)).

---

## 📲 Installer le jeu (PWA)

Le jeu doit être servi en `http://` ou `https://` (pas en `file://`) pour que l'installation
et le mode hors ligne fonctionnent :

```bash
cd navetane
node server.js          # jeu + salon en ligne (aucune dépendance à installer)
# puis ouvre http://localhost:3000
```

`python3 -m http.server 3000` marche aussi pour jouer **tout seul** (le mode en ligne a
besoin de `node server.js`, qui gère les WebSockets).

| Appareil | Comment installer |
|---|---|
| **Android / Chrome / Edge** | bouton **« Installer l'app »** dans le menu, ou ⋮ → *Installer l'application* |
| **iPhone / iPad (Safari)** | Partager → *Sur l'écran d'accueil* |
| **Ordinateur (Chrome/Edge)** | icône d'installation dans la barre d'adresse |

Une fois installé : lancement en **plein écran paysage**, sans barre d'adresse, et le jeu
démarre **même sans réseau** (le service worker garde tout en cache).

---

## 🏟️ Les clubs (46 ASC)

| Groupe | Clubs |
|---|---|
| **Zone 1 — Yeumbeul Sud** (9) | Jokko · Gestu · Farba · Natangue · Boune · Djiddah · Medinatoul · Afia · Ñoo Deggo |
| **Zone 4 — Malika** (10) | Malika sur Mer · Diockoo · Daara J · Disso · Diamono · Diamaguene · Diamalaye 2 · Espoirs · Santhiaba · Maag Daan |
| **Zone 5A — Keur Massar Nord** (11) | Entente 2345 · Jappo 1 · Deukeundo · Teranga · Deggo · Bokk Jeuf · Mboolo · Fass Darou · Boune · Arafat KM · Happo |
| **Zone 6 — Keur Massar Sud** (5) | Bokk Gox · Cité Aïnoumady · Disso Keur Massar · Juboo · Castors Sotrac |
| **Zone 7 · Jaxaay — Poule A** (4) | And Boolo · Espoir · Unité 18 · Unité 19 |
| **Zone 7 · Jaxaay — Poule B** (4) | Diamono 910 · Jaxaay City · Niary Gouye · P.A. FC |
| **Zone 7 · Jaxaay — Poule C** (3) | Disso 13-14 · Renaissance · Santhiaba |
| **Ligue Navétane** (8) | les clubs d'origine du jeu (Rufisque United, Dakar Titans…) |

Chaque club a son écusson et ses couleurs ; le championnat se joue dans le groupe du club
choisi, la coupe à 8 clubs est complétée avec des clubs des zones voisines si la zone compte
moins de 8 équipes.

---

## 🎮 Commandes

| Action | Clavier | Tactile |
|---|---|---|
| Courir | `ZQSD` / `WASD` / flèches¹ | joystick à gauche |
| Sprint | `Maj` (Shift) | — |
| Passe | `J` | bouton **PASSE** |
| **Feinte** (éliminer un défenseur) | `K` | bouton **FEINTE** |
| **Passe en profondeur / centre** | `L` | — |
| **Passement de jambe** | double-tap `ZQSD`/flèches | double-tap joystick |
| **Roulette** (double-tap en sprint) | double-tap + `Maj` | — |
| Tir (maintenir pour charger) | `Espace` | bouton **TIR** (maintenir) |
| Changer de joueur | `C` | automatique |
| Pause | `Échap` / `P`² | bouton ❚❚ |

¹ les flèches passent au joueur 2 en mode 2 joueurs · ² `P` devient le tir du joueur 2 dans ce mode

### Mode 2 joueurs (même clavier)

Choisis **④ Joueurs → 2 joueurs** dans le menu. Le joueur 2 prend l'équipe adverse :

| Action | Joueur 1 | Joueur 2 |
|---|---|---|
| Courir | `ZQSD` | `Flèches` |
| Sprint | `Maj` gauche | `Maj` droite |
| Passe | `J` | `O` |
| Feinte | `K` | `M` |
| Profondeur / centre | `L` | `I` |
| Tir chargé | `Espace` | `P` |
| Changer de joueur | `C` | automatique |

Le halo est **jaune** pour le joueur 1, **cyan** pour le joueur 2.

**Astuces :**
- En maintenant `↑` / `↓` pendant la charge, tu vises le coin haut ou bas du but (réticule affiché).
- `K` en pleine course = feinte : tu changes brusquement de direction et le défenseur est pris à contre-pied.
- `L` = ballon piqué par-dessus la défense ; dans le couloir (dernier tiers), c'est un **centre** vers la surface.
- **Double-tap** sur une direction = **passement de jambe** (le ballon part devant, le défenseur est pris).
  Double-tap **en sprintant** = **roulette** : le défenseur à moins de 35 px est éliminé.
- Devant le but, les **têtes sont automatiques** sur les centres : place-toi sous la trajectoire, le
  joueur saute et rabat le ballon (vers le but si tu es dans la surface, en dégagement sinon).

---

## 🌐 Jouer en ligne entre amis

Deux joueurs, **chacun sur son appareil** (PC, téléphone, tablette), un match complet
11 contre 11 en temps réel.

1. **Hôte** : menu → **En ligne** → choisis ton club → **Créer un salon**.
   Un **code à 4 caractères** s'affiche (ex. `DPV3`).
2. **Ami** : même adresse dans son navigateur → **En ligne** → choisis son club →
   tape le code → **Rejoindre**.
3. L'hôte voit l'ami arriver, puis clique **Lancer le match**. C'est parti.

L'hôte est le « maître du jeu » : la physique, l'arbitre et la mini-carte se calculent
chez lui, et l'invité reçoit le match ~10 fois par seconde avec interpolation fluide.
Chacun pilote son équipe (clavier, ou stick tactile sur mobile). Les deux voient le
**score, le chrono, les buts, les cartons et les stats de fin de match** en direct.
Si quelqu'un quitte, l'autre revient au salon / menu avec un message.

### 🌍 Mettre le jeu en ligne pour de bon (gratuit)

Le dossier est prêt à déployer : `package.json` + `render.yaml` sont fournis.

**Option A — Render (recommandé : le jeu *et* le mode en ligne, en HTTPS, gratuit)**
1. Crée un compte gratuit sur [render.com](https://render.com) (connexion GitHub).
2. **New → Web Service** → choisis le dépôt contenant ces fichiers (ou « Public Git repository »).
3. Réglages : *Build Command* = _(vide)*, *Start Command* = `node server.js`, *Instance* = **Free**.
4. **Create** → Render te donne une adresse `https://navetane-pro.onrender.com` : elle marche
   sur téléphone, s'installe en PWA, et le **salon en ligne fonctionne** (wss automatique).

**Option B — hébergement statique (Surge, Netlify, GitHub Pages…)** : envoie `index.html`,
`manifest.webmanifest`, `sw.js` et `icons/`. Le jeu et l'installation PWA marchent, mais
le **mode en ligne reste indisponible** (pas de WebSocket sur un hébergement statique) —
le jeu affiche alors un message clair.

**Option C — vite fait, depuis ce dossier** : `npx surge . navetane.surge.sh` (statique),
ou `npx cloudflared tunnel --url http://localhost:3000` (URL publique temporaire, en ligne
comprise, valable tant que la commande tourne).

### Héberger pour jouer à distance

Le serveur doit être joignable par les deux joueurs :

| Situation | Marche à suivre |
|---|---|
| **Même Wi-Fi** | l'hôte lance `node server.js`, l'ami ouvre `http://<IP-locale-de-l-hôte>:3000` |
| **À distance (le plus simple)** | déploie le dossier sur **Render / Railway / Fly.io** (commande de démarrage `node server.js`, port `PORT`) ; le `wss://` est géré automatiquement |
| **Tunnel rapide** | `npx cloudflared tunnel --url http://localhost:3000` puis partage l'URL `https://…` |

Le client se connecte tout seul en `ws://` ou `wss://` selon l'adresse de la page : rien
à configurer. Un salon = 2 joueurs, les codes expirent quand l'hôte quitte.

---

## 🪙 Mode PRO — jetons & marché de joueurs

Le bouton **« MARCHÉ PRO »** en haut à droite du menu ouvre l'économie du jeu.

| | |
|---|---|
| **Capital de départ** | 4 000 jetons |
| **Marché** | 12 joueurs à l'achat, renouvelés après chaque match (actualisation manuelle : 300 jetons) |
| **Catalogue** | **864 joueurs** (54 clubs × 16), noms sénégalais générés au hasard en attendant les vrais — structure 2 GB / 5 DEF / 5 MIL / 4 ATT, notes de **54 à 92**, **une star par club**, chacun avec une note de **vitesse** et de **technique** |
| **Prix** | de ~300 jetons (note 58) à ~27 000 (note 94) — la note fait le prix |
| **Revente** | 50 % du prix d'achat |
| **Composition** | 4-3-3 en 11 postes (1 GB · 4 DEF · 3 MIL · 3 ATT), placement automatique à l'achat, bouton **Composition automatique**, moyenne d'équipe affichée |

**Récompenses (créditées sur l'écran de fin de match)**
victoire **900** · nul **450** · défaite **150** · **+60 par but marqué** · **+200** si clean sheet ·
**+500** victoire en Coupe · **+300** victoire en Championnat.

**Sur le terrain** : dès que tes 11 postes sont pourvus, ton effectif PRO remplace les joueurs
de ton club — la technique et la pointe de vitesse de chaque titulaire viennent de sa note.
Un effectif incomplet = tu joues avec l'effectif par défaut du club.

**Base de joueurs réelle** : le bouton **« + Importer des joueurs »** accepte des effectifs
réels, une ligne par joueur (`Nom ; Poste ; Note ; Club`), avec l'origine **ASC / Ligue 1 /
Ligue 2**. Chaque joueur importé porte son club sur sa carte et entre dans le marché. La base
est sauvegardée à part (`navetane.players.v1`) et survit aux mises à jour.

**Boutique de jetons** : 3 packs (1 000 / 5 000 / 15 000) affichés en FCFA. Le paiement n'est
**pas branché** : rien n'est débité, aucun jeton n'est crédité sans une vraie transaction
(Wave / Orange Money / carte via un agrégateur). Voir `PROJET.md` pour la marche à suivre.

Tout est sauvegardé sur l'appareil (`navetane.pro.v1`) : **aucun argent réel** n'est encaissé
pour l'instant. Les jetons se gagnent en jouant.

## ✨ Ce qu'il y a dans le jeu

- **54 clubs** répartis en 8 groupes (voir la liste ci-dessous) : les **46 ASC** de
  Keur Massar / Yeumbeul / Malika, plus la ligue « Navétane » d'origine
- **Sélecteur de zone** dans le menu : choisis la zone (ou la poule) puis ton club et
  l'adversaire dans la liste (les listes défilent, tout tient sur mobile)
- **3 niveaux** : Débutant, Pro, Légende — match de **3 minutes**
- **Joueurs humains dessinés au canvas** : bonhommes animés (course, frappe, sprint),
  maillots numérotés, shorts, bas, crampons, gants du gardien, peaux et coiffures variées,
  **arbitre** qui suit l'action
- **Ballon en 3 dimensions** : hauteur réelle (z), centres et ballons piqués qui passent
  au-dessus des joueurs, rebonds, lobs, tirs au-dessus de la barre
- **Conduite de balle** : le ballon se détache du pied quand tu sprints, colle au pied en
  contrôle rapproché, avec un **premier contact** qui dépend de la vitesse du ballon
- **Gestes techniques** : feinte (élimination), passement de jambe et roulette au stick,
  passe en profondeur, **centres** depuis les couloirs, **jeu de tête** (dégagement ou tête
  décroisée), frappes enroulées (la technique du joueur influe sur la précision),
  protection de balle dos au défenseur
- **Réception du ballon** : un ballon trop rapide rebondit sur le corps, un ballon maîtrisable
  est amorti — le contrôle dépend de la technique du joueur
- **Gardiens crédibles** : ils sortent dans les pieds, lisent la trajectoire, plongent… et
  peuvent être battus d'une frappe croisée
- **Attributs par joueur** : technique et pointe de vitesse différents (un défenseur central
  contrôle moins bien qu'un meneur)
- **Règles réelles** : touche, corner, sortie de but (relance du gardien), but refusé si le
  ballon passe au-dessus de la barre, **fautes sifflées** → coup franc (les adversaires reculent
  à distance) ou **penalty** quand la faute a lieu dans la surface (tireur seul face au gardien,
  ~75 % de réussite)
- **Cartons** : les fautes les plus grosses valent un **jaune** (deux jaunes = rouge), les plus
  dangereuses un **rouge direct** — le joueur sort du terrain et l'équipe finit à 10
- **Mode Coupe** : un tournoi à 8 clubs en 3 tours (quart, demie, finale). Ton match se joue,
  les autres sont simulés, le tableau se met à jour à chaque tour — champion ou éliminé, avec
  tirs au but si le match est nul
- **Mode Championnat** : le championnat se joue **entre les clubs de ta zone / poule**
  (le nombre de journées s'adapte : 3 clubs → 3 journées, 11 clubs → 11 journées, et le
  club qui se repose est signalé « exempt »), au choix **aller simple (7 journées)** ou **aller-retour
  (14 journées)**. **3 pts** victoire, **1** nul, **0** défaite ; départage au **goal-average**
  puis aux buts marqués. Le classement se met à jour après chaque journée, les autres matchs
  sont simulés, et la **saison est sauvegardée dans le navigateur** : tu peux fermer l'onglet et
  reprendre au match suivant. Champion, place finale, ou « Nouvelle saison » pour repartir
- **Classement des buteurs** de la saison (numéro + club), mis à jour à chaque but — les tiens
  comme ceux des matchs simulés
- **Discipline** : un **carton rouge** prive le club d'un joueur pour son match suivant (il
  démarre **à 10**) et **3 cartons jaunes accumulés** valent aussi un match de suspension. Le
  compteur du club (`Avertissements 2/3`) et les sanctions en cours sont affichés sur l'écran
  de championnat ; les cartons rouges restent rares (≈ 1 pour 10 matchs simulés)
- **Palmarès** : chaque saison terminée est archivée (bouton **Palmarès** du menu) — place
  finale, points, nombre de journées, champion et meilleur buteur. Conservé même après avoir
  fermé le jeu (12 dernières saisons)
- **Installable & hors ligne** : PWA avec icône sur l'écran d'accueil, plein écran paysage
  et cache local (voir plus haut)
- **IA** : placement 4-3-3, pressing, appels, passes, centres, tirs, feintes, gardiens qui
  sortent, plongent et relancent, tacles (un tacle raté laisse le défenseur sur place)
- **Statistiques de fin de match** : possession, tirs, tirs cadrés, passes réussies,
  duels gagnés, dribbles réussis, têtes, arrêts, fautes, cartons
- **Rendu haute résolution** (2× sur ordinateur, 1,6× sur mobile), 60 FPS
- **Sons synthétisés** (WebAudio) : frappe, sifflet, arrêts, ambiance de tribune

---

## 🎨 À propos des graphismes

Les graphismes sont **100 % originaux**, dessinés au canvas (aucune image, aucun asset externe).
Les logos, maillots et éléments d'eFootball appartiennent à Konami : ils ne peuvent pas être
réutilisés dans un jeu. Ici, tout est créé pour NAVÉTANE PRO — l'esprit « broadcast » est reproduit,
pas les fichiers.

---

## 🛠️ Personnaliser

Tout est dans `index.html` :

- **Clubs / zones / couleurs** → constantes `ZONES` et `TEAMS` (les couleurs sont attribuées
  automatiquement depuis `PALETTE` si tu ne précises pas `c1`)
- **Difficulté** → constante `DIFFS` (vitesse IA, réactivité, tirs, gardien)
- **Formation** → constante `FORMATION` (positions normalisées 0 → 1)
- **Technique par poste** → constante `ROLE_TECH` (gk / def / mid / fwd)
- **Physique du ballon** → `stepBall()` (gravité, rebonds, friction, hauteur)
- **Durée du match** → `state.clock = 180` (en secondes)
- **Couleurs de l'interface** → variables CSS `:root` en haut du fichier
- **Championnat** → `lgSchedule()` (calendrier, `dbl` = aller-retour) et `lgTable()` (barème)
- **Discipline** → `lgAddCards()` (seuil de 3 jaunes) et le tirage de rouge dans `lgSimOne()`
- **Palmarès** → constante `PAL_KEY` (12 saisons conservées)
- **Cache hors ligne** → constante `CACHE` dans `sw.js` (change la version pour forcer la mise à jour)

> **Version 10** — **46 ASC de Keur Massar, Yeumbeul, Malika et Jaxaay** (zones et poules),
> sélecteur de zone dans le menu et championnats par zone/poule (3 à 11 clubs, journées exemptes).

> **Version 9** — **Palmarès** des saisons (place, points, champion, buteur), **3 jaunes = 1
> match** de suspension et cartons rouges plus rares.

> **Version 8** — championnat **aller-retour (14 journées)**, **classement des buteurs**,
> **suspensions** après un carton rouge.

> **Version 7** — **installable (PWA)** : icône, plein écran paysage, hors ligne + **mode
> Championnat** : saison de 7 journées, classement avec goal-average, sauvegarde automatique.

> **Version 6** — cartons jaunes et rouges (expulsions), **mode Coupe** à 8 clubs sur 3 tours,
> menu réorganisé.

> **Version 5** — fautes, coups francs et penaltys, **mode 2 joueurs** sur le même clavier,
> gardiens retravaillés (un seul duel par frappe), menu compact sur mobile.

> **Version 4** — jeu de tête sur les centres, passement de jambe / roulette au stick,
> réceptions retravaillées, gardiens qui ferment l'angle, statistiques détaillées.

Bonne navétane ! 🏆
