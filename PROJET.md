# NAVÉTANE PRO — Le projet : un vrai football sénégalais

> Objectif : le jeu de foot de référence au Sénégal. Les vrais joueurs des Navétanes d'abord
> (ASC), puis la **Ligue 1** et la **Ligue 2** sénégalaises. Une économie réelle : des jetons
> achetés avec de l'argent pour recruter les stars.

---

## 1. Ce qui existe déjà (v14)

| Brique | État |
|---|---|
| Économie de jetons (gains, solde, sauvegarde) | ✅ |
| Marché de 12 joueurs renouvelé, prix indexé sur la note, revente 50 % | ✅ |
| Effectif 4-3-3 : tes 11 joueurs jouent vraiment (note → technique/vitesse sur le terrain) | ✅ |
| **Import d'effectifs réels** : coller `Nom ; Poste ; Note ; Club`, avec l'origine (ASC / Ligue 1 / Ligue 2) | ✅ |
| Boutique de jetons (3 packs, prix en FCFA) | 🟡 interface prête, **paiement non branché** |
| Comptes joueurs en ligne, base de données centrale | ⛔ à faire (nécessaire pour vendre) |

**Format d'import** (bouton « + Importer des joueurs » dans le Marché PRO) :

```
Cheikh Ndoye ; GB ; 78 ; ASC Bokk Gox
Modou Fall ; DEF ; 74 ; ASC Bokk Gox
Pape Sarr ; ATT ; 82 ; ASC Juboo
```

Postes acceptés : `GB` (gardien), `DEF`, `MIL`, `ATT`. La note va de 40 à 99.
Tu peux me donner les listes dans n'importe quel format (photo, Excel, texte) : je les convertis.

---

## 2. Les trois verrous à lever avant de vendre

### 🔒 A. Le droit sur les noms — le plus important

Utiliser le nom d'une personne réelle dans un jeu **commercial** demande son **accord écrit**
(droit à la personnalité / protection des données, loi sénégalaise n° 2008-12).
Concrètement :

1. **Joueurs amateurs des ASC** : une autorisation simple, signée (nom, club, saison,
   « j'autorise l'utilisation de mon nom et de mon image dans le jeu NAVÉTANE PRO »).
   Le plus efficace : passer par le **bureau de l'ASC**, qui fait signer tout l'effectif.
2. **Joueurs professionnels (Ligue 1 / Ligue 2)** : l'autorisation individuelle ne suffit pas,
   les droits passent par la **LSFP** (Ligue Sénégalaise de Football Professionnel) et la **FSF**,
   avec des règles CAF/FIFA sur les compétitions. C'est un **contrat de licence**, payant.
3. Les **noms des clubs** et les **logos** sont aussi protégés → même logique.

👉 Tant que ce n'est pas signé, on reste sur des noms inventés : c'est la version actuelle, et
elle est **parfaitement légale**.

### 🔒 B. L'argent réel

Pour encaisser, il faut :

- une **structure légale** (NINEA / registre de commerce, ou une association) et des
  conditions de vente ;
- un **agrégateur de paiement** qui accepte le Sénégal : **PayDunya**, **CinetPay**, **Paytech**,
  **Intouch** — ils donnent accès à **Wave**, **Orange Money**, Free Money et cartes ;
- un **serveur** qui vérifie chaque paiement avant de créditer les jetons (jamais côté navigateur) ;
- si tu publies sur **App Store / Play Store** : ils prennent **15 à 30 %** et imposent leur
  système d'achat. En **web (PWA)**, tu gardes 100 % et tu encaisses en mobile money.

### 🔒 C. Le format de vente

Vendre un joueur « au hasard » dans un pack = mécanique de **loot box** : réglementée, mal vue
si le public est jeune. Deux modèles sûrs :

- **Achat direct** (comme eFootball pour beaucoup de joueurs) : le prix est affiché, pas de hasard ;
- **Pack avec probabilités affichées** + limite d'âge + contrôle parental.

Recommandation : démarrer en **achat direct** + un « Pass Saison Navétane » (contenu garanti).

---

## 3. La feuille de route

**Étape 1 — maintenant (fait)**
Économie, marché, composition, import des vrais noms, boutique visible mais inactive.

**Étape 1 bis — les effectifs de départ (fait)**
En attendant les vrais noms, la base est **auto-générée** : **54 clubs × 16 joueurs = 864 joueurs**
(noms sénégalais plausibles), avec la structure réelle d'un effectif (2 gardiens, 5 défenseurs,
5 milieux, 4 attaquants), une note de 54 à 92 et **une star par club**. Le bouton
« Régénérer les effectifs au hasard » change tous les noms d'un coup.

**Étape 2 — les ASC réelles**
Tu me donnes les effectifs → je les intègre avec leur club et leur note. On lance avec 8 à 12 ASC
de Keur Massar / Yeumbeul / Malika. Objectif : « jouer avec les vrais joueurs de mon quartier ».

**Étape 3 — le serveur**
Comptes joueurs, base centrale (les notes et les cartes appartiennent au serveur, pas au
navigateur), anti-triche, classements en ligne, transferts entre joueurs.

**Étape 4 — l'argent**
Agrégateur mobile money, webhooks, factures, mentions légales. Les jetons achetés deviennent
réellement monnayables (dans le jeu, jamais remboursables en argent).

**Étape 5 — la Ligue**
Licence LSFP/FSF → Ligue 1 puis Ligue 2, calendrier réel, vraies compétitions, mode carrière
d'entraîneur.

---

## 4. Ce que je te demande pour avancer

1. **Un premier effectif réel** : un ASC, 11 à 18 joueurs, avec poste et note (ou juste les noms,
   je propose les notes, tu corriges).
2. **Ton opérateur de paiement** préféré (Wave ? Orange Money ?) et si tu as déjà une structure
   (NINEA) ou pas.
3. **Ton modèle** : achat direct, packs, ou les deux.

Avec ça, la prochaine version peut déjà s'appeler « Navétane PRO — Saison 2026 » avec de vrais
noms dans le marché.
