# Modèle d'app pour organisation

Un calendrier partagé dont les données sont stockées dans un porte-données collectif (un groupe sur un Pod provider ActivityPods). Le backend ne stocke aucune donnée métier, seulement sa clé et l'URI du porte-données (dans `data/`).

L'application dépend de fonctionnalités qui ne sont pas encore publiées : pour l'instant, il faut la tester avec un Pod provider local.

## Prérequis

- Node 24 et Yarn 1
- Docker
- [Yalc](https://github.com/wclr/yalc) (`npm install -g yalc`)
- Des clones locaux d'[ActivityPods](https://github.com/activitypods/activitypods) (branche `next`) et de [SemApps](https://github.com/assemblee-virtuelle/semapps) (branche `next`)

## Lancer le Pod provider

### Paquets SemApps

```bash
cd /SEMAPPS_REPO
git checkout next
cd src/middleware
yarn install
yarn run link-all
cd ../frontend
yarn install
yarn run build # Publie aussi les paquets sur Yalc
```

### Backend

```bash
cd /ACTIVITYPODS_REPO
git checkout next
cd pod-provider
make start # Fuseki, Redis, Mailcatcher...
cd backend
yarn install
yarn run link-semapps-packages
```

Les groupes doivent être activés. Créer un fichier `.env.local` dans le répertoire `backend` :

```
SEMAPPS_ENABLE_GROUPS=true
```

Puis :

```bash
yarn run dev
```

Le backend est disponible sur http://localhost:3000.

### Frontend

```bash
cd /ACTIVITYPODS_REPO/pod-provider/frontend
yarn install
yarn run link-semapps-packages
yarn run dev
```

Le frontend est disponible sur http://localhost:5000.

### Paquets de l'app framework

Les paquets `refine-*` utilisés par l'application doivent aussi être construits depuis la branche `next` :

```bash
cd /ACTIVITYPODS_REPO/app-framework
yarn install
cd refine-providers && yarn run build && cd ..
cd refine-hooks && yarn run build && cd ..
cd refine-antd && yarn run build && cd ..
```

## Lancer l'application

```bash
cd /MODELE_APP_ORGANISATION_REPO
yarn install
cd frontend
yalc link @activitypods/refine-providers @activitypods/refine-hooks @activitypods/refine-antd
cd ..
yarn run dev
```

La configuration par défaut (voir `.env.example`) fonctionne avec le Pod provider local. Si besoin, la copier dans `.env`.

L'application est disponible sur http://localhost:4000. Toujours utiliser cette URL, et non le port de Vite : c'est le backend qui sert le client ID (`/app.json`) et l'API.

## Configurer l'application

Tant qu'elle n'est pas configurée, l'application affiche seulement un message « non configurée ». Aller sur http://localhost:4000/configure :

1. **Hébergeur** : garder `http://localhost:3000` et cliquer sur « Se connecter », ou sur « Créer un compte » si vous n'avez pas encore de compte. Les e-mails envoyés par le Pod provider sont lisibles sur http://localhost:1080.
2. **Porte-données** : cliquer sur « Créer le porte-données ». Vous êtes redirigé vers la page de création de groupe du Pod provider, avec l'identifiant et le nom déjà remplis. Créer le groupe : vous en serez le propriétaire.
3. **Autorisation** : de retour sur l'application, vous êtes redirigé vers l'écran d'autorisation du Pod provider, qui propose d'enregistrer l'application sur le groupe. Accepter.

Le backend vérifie alors que la WebID est bien un groupe et que l'application y est enregistrée, puis écrit `data/config.json`. Vous êtes redirigé vers l'accueil, où vous pouvez créer des événements dans le calendrier partagé.

Une fois l'application configurée, `/configure` redirige vers l'accueil. Pour recommencer, arrêter l'application et supprimer `data/config.json` (ainsi que `data/pending-storage.json` s'il existe).

### Membres

Les autres utilisateurs doivent d'abord être ajoutés au groupe sur le Pod provider. À leur connexion à l'application, ils sont redirigés vers l'écran d'autorisation pour l'enregistrer sur leur propre Pod.
