# CatalogueAtcIA

Application Vite + React (mobile-first) pour un catalogue joaillerie privé, intégrée avec un backend PHP (login, catalogue, miniatures) et BMad Method pour la gestion du flux projet via Claude Code.

## Démarrer

1) Prérequis: Node.js 18+

2) Variables d’environnement (déjà présentes dans `/.env.local`):

```
GEMINI_API_KEY=PLACEHOLDER_API_KEY
VITE_API_BASE=https://extensia-france.com/api
VITE_IMG_BASE=https://extensia-france.com/imgs
VITE_THUMB_URL=https://extensia-france.com/imgs/thumbs.php
```

3) Installer et lancer

```
npm install
npm run dev
```

## Intégration Backend (PHP)

- `login.php?action=login` (POST `{ user, password }`) → retourne l’utilisateur (ex: `{ id, Nom_agence, logo }`).
- `login.php?action=log` (POST `{ id_user }`) → enregistre un log; l’ID peut servir de token simple côté front.
- `imageCatalogue.php` (GET) → renvoie les déclinaisons des produits.
  - Champs utilisés: `ref`, `label`, `prix`, `description` (catégorie), `prenom_ligne`, `img`, `img_cv`, `formes` (CSV d’IDs), `id_typ_pier` ou `types` (CSV), `gallery`.
  - Le front regroupe par `ref`, calcule min/max prix, et dérive les filtres (formes/types/lignes) à partir des IDs réellement présents.
- Images: originaux depuis `VITE_IMG_BASE`; vignettes via `VITE_THUMB_URL?image=<file>&size=<n>`.

Le front gère automatiquement l’absence de `types` CSV (fallback sur `id_typ_pier`) et résout des libellés par table de correspondance minimale.

## Flux BMad (Claude Code)

- Statut: `_bmad-output/planning-artifacts/bmm-workflow-status.yaml` (piste "method-brownfield").
- Dans Claude Code, utiliser les commandes:
  - `/bmad:bmm:workflows:workflow-status`
  - `/bmad:bmm:workflows:create-prd`
  - `/bmad:bmm:workflows:create-architecture`
  - `/bmad:bmm:workflows:create-epics-and-stories`
  - `/bmad:bmm:workflows:implementation-readiness`
  - `/bmad:bmm:workflows:sprint-planning`

## Impression tarifs (frontend-only)

Depuis la fiche produit, bouton "Imprimer" → mise en page optimisée impression. Aucun PDF généré côté serveur requis.

## Structure principale

- `App.tsx` → Auth + catalogue + filtres + navigation.
- `services/dataService.ts` → Appels API, normalisation images (thumb), groupement par `ref`, token/localStorage.
- `components/` → `FilterBar`, `ProductModal`, `Button`.
- `_bmad/`, `_bmad-output/` → BMad Method, agents et artefacts.

## Nettoyage du dépôt

Les intégrations d’agents non indispensables à BMad ont été archivées dans `.project-archive/bmad-setup/` (ex: `.cursor`, `.qwen`, `.windsurf`, etc.). Conservés: `_bmad`, `_bmad-output`, `.claude`, `.agentvibes`, `.github`, `.vscode`.

## Build de prod

```
npm run build
```

Produit le bundle Vite dans `dist/`.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zTK5LpwqFPb5SZSc6C5MZX2_NVKavhE5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
