# Template organization

A shared calendar whose data is stored in a collective Pod (a group on an ActivityPods Pod provider). The backend stores no business data, only its key and the URI of the collective Pod (in `data/`).

It requires features that are not published yet, so for now it must be tested against a local Pod provider.

## Requirements

- Node 24 and Yarn 1
- Docker
- [Yalc](https://github.com/wclr/yalc) (`npm install -g yalc`)
- Local clones of [ActivityPods](https://github.com/activitypods/activitypods) (branch `role-sharing`) and [SemApps](https://github.com/assemblee-virtuelle/semapps) (branch `next`)

## Launch the Pod provider

### SemApps packages

```bash
cd /SEMAPPS_REPO
git checkout next
cd src/middleware
yarn install
yarn run link-all
cd ../frontend
yarn install
yarn run build # Also publish the packages to Yalc
```

### Backend

```bash
cd /ACTIVITYPODS_REPO
git checkout role-sharing
cd pod-provider
make start # Fuseki, Redis, Mailcatcher...
cd backend
yarn install
yarn run link-semapps-packages
```

Groups must be enabled. Create a `.env.local` file in the `backend` directory:

```
SEMAPPS_ENABLE_GROUPS=true
```

Then:

```bash
yarn run dev
```

The backend is available on http://localhost:3000.

### Frontend

```bash
cd /ACTIVITYPODS_REPO/pod-provider/frontend
yarn install
yarn run link-semapps-packages
yarn run dev
```

The frontend is available on http://localhost:5000.

### App framework packages

The `refine-*` packages used by this app must also be built from the `role-sharing` branch:

```bash
cd /ACTIVITYPODS_REPO/app-framework
yarn install
cd refine-providers && yarn run build && cd ..
cd refine-hooks && yarn run build && cd ..
cd refine-antd && yarn run build && cd ..
```

## Launch the application

```bash
cd /TEMPLATE_ORGANIZATION_REPO
yarn install
cd frontend
yalc link @activitypods/refine-providers @activitypods/refine-hooks @activitypods/refine-antd
cd ..
yarn run dev
```

The default configuration (see `.env.example`) works with the local Pod provider. If needed, copy it to `.env`.

The application is available on http://localhost:4000. Always use this URL, not the Vite port: the backend serves the client ID (`/app.json`) and the API.

## Configure the application

As long as it is not configured, the application only displays a "not configured" message. Go to http://localhost:4000/configure:

1. **Pod provider**: keep `http://localhost:3000` and click "Se connecter", or "Créer un compte" if you don't have an account yet. Emails sent by the Pod provider can be read on http://localhost:1080.
2. **Data space**: click "Créer le porte-données". You are redirected to the group creation page of the Pod provider, with the ID and name already filled. Create the group: you will be its owner.
3. **Authorization**: back on the application, you are redirected to the authorization screen of the Pod provider, which asks to register the application on the group. Accept.

The backend then checks that the WebID is a group and that the application is registered on it, and writes `data/config.json`. You are redirected to the home page, where you can create events in the shared calendar.

Once configured, `/configure` redirects to the home page. To start over, stop the application and delete `data/config.json` (and `data/pending-storage.json` if it exists).

### Members

Other users must first be added to the group on the Pod provider. When they log in to the application, they are redirected to the authorization screen to register it on their own Pod.
