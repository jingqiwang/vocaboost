# Vocaboost

**Vocaboost** is a personal vocabulary learning assistant designed to help you track, review, and master new words efficiently. Built with SvelteKit, it offers a seamless, offline-first experience.

## ✨ Features

- **Offline-First Architecture**: Uses IndexedDB to store all data locally, ensuring fast access and privacy.
- **Smart Review System**: Track your learning progress with review logs and optimize your study sessions.
- **Data Synchronization**: Easily backup and sync your data (vocabularies, logs, settings) to a local file.
- **Visual Statistics**: Gain insights into your learning habits with interactive charts and dashboards.
- **PWA Support**: Install Vocaboost on your desktop or mobile device for a native app-like experience.
- **Audio Support**: Manage pronunciation audio blobs locally.

## 🚀 Deployment

The recommended way to deploy Vocaboost is using **Docker Compose**.

### Prerequisites
- Docker
- Docker Compose

### Quick Start

1.  **Clone or Copy** the project files to your server.
2.  **Run the application**:
    ```bash
    docker compose up -d --build
    ```
3.  **Access the app**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Commands

- **Start**: `docker compose up -d`
- **Stop**: `docker compose down`
- **View Logs**: `docker compose logs -f`
- **Rebuild**: `docker compose up -d --build`

---

### Manual Deployment (Node.js)

For instructions on manual deployment without Docker, please refer to [MANUAL_DEPLOY.md](./MANUAL_DEPLOY.md).
