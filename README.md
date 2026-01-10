# psf-vue-app

Application frontend Vue.js 3 avec Vite.

## Prérequis

- Node.js `^20.19.0` ou `>=22.12.0`
- npm

## Installation

1. Cloner le repository :

```bash
git clone https://github.com/RobinChappalley/psf-vue-app
cd psf-vue-app
```

2. Installer les dépendances :

```bash
npm install
```

## Lancer le projet

### Mode développement

Lance un serveur de développement avec hot-reload :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173` (par défaut).

### Build de production

Compile et minifie les fichiers pour la production :

```bash
npm run build
```

### Prévisualiser le build

Permet de tester le build de production localement :

```bash
npm run preview
```

## Formatage du code

Le projet utilise Prettier pour le formatage :

```bash
npm run format
```

## Stack technique

- [Vue.js 3](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Vite](https://vitejs.dev/)
