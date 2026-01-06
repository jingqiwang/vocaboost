# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

# Deployment Guide for Vocaboost

Since your application uses server-side features (API routes for sync and audio), it requires a Node.js environment to run.

## Prerequisites
- A server (VPS) running Linux (Ubuntu/Debian recommended).
- **Node.js**: v18 or higher installed on the server.
- **PM2**: For process management (`npm install -g pm2`).
- **Nginx**: For reverse proxy and SSL (optional but recommended).
- **Domain name**: (Optional) pointing to your server IP.

## 1. Prepare the Application
I have already switched the adapter to `@sveltejs/adapter-node`.
Run the build command locally to ensure everything works:
```bash
pnpm build
```

## 2. Transfer Files to Server
You need to copy the following files/folders to your server (e.g., `/var/www/vocaboost`):
- `build/` (The built application)
- `package.json` (For dependency versions)
- `pnpm-lock.yaml` (or `package-lock.json`)

Example using `scp`:
```bash
scp -r build package.json pnpm-lock.yaml user@your_server_ip:/var/www/vocaboost
```

## 3. Install Production Dependencies
On your server, navigate to the folder and install dependencies:
```bash
cd /var/www/vocaboost
pnpm install --prod
```

## 4. Start the Application
Use PM2 to start the app so it runs in the background and restarts on reboot:
```bash
pm2 start build/index.js --name vocaboost
```

By default, it runs on port `3000`. You can test it by `curl http://localhost:3000`.

## 5. (Optional) Configure Nginx
To access the app via a domain or port 80, configure Nginx as a reverse proxy.

Create a config file `/etc/nginx/sites-available/vocaboost`:
```nginx
server {
    listen 80;
    server_name your_domain.com; # Or your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
ln -s /etc/nginx/sites-available/vocaboost /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```
