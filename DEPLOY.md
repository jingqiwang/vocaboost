# Deployment Guide

This project is configured to run with Docker and Docker Compose.

## Prerequisites

- Docker
- Docker Compose

## Deploying

1.  **Clone the repository** (or copy the project files) to your server.
2.  **Navigate to the project directory**.
3.  **Data Persistence**:
    The application is configured to sync data to `~/vocaboost_sync` on the host machine. Ensure this directory exists or the application will create it.
4.  **Run with Docker Compose**:

    ```bash
    docker compose up -d --build
    ```

    This will build the Docker image and start the container in detached mode.

5.  **Access the application**:
    The application will be available at `http://localhost:3000` or `http://<your-server-ip>:3000`.

## Stopping the Application

To stop the containers:

```bash
docker compose down
```

## Logs

To view logs:

```bash
docker compose logs -f
```
