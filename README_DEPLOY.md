# Sharadha Stores — Deployment Guide

This document describes how to deploy the React frontend, Flask backend, and MySQL database to production.

---

## Option 1: Docker Compose (Recommended for Virtual Private Servers - VPS)

You can build and deploy the entire stack (Database, Backend, and Frontend) to any server with Docker installed.

### Steps:
1. Make sure **Docker** and **Docker Compose** are installed on the target server.
2. Clone the repository onto the server.
3. Run the following command from the project root:
   ```bash
   docker compose up --build -d
   ```
4. This starts:
   * **MySQL Database** on port `3306` (with volume mapping for persistent data).
   * **Flask Backend** on `http://localhost:5000` (auto-connects to the MySQL container).
   * **React Frontend** on `http://localhost:80` (routes API requests to backend).

---

## Option 2: Cloud PaaS Deployment (Recommended for Free/Simple setup)

Deploying the components individually to managed platforms:

### 1. Database (MySQL)
Deploy a managed MySQL instance on **Aiven**, **PlanetScale**, or **TIDB Cloud**.
* Create a database named `sharadha_stores`.
* Note down the connection URI (e.g. `mysql+pymysql://user:password@host:port/sharadha_stores`).

### 2. Backend (Flask) to Render
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New + -> Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   * **Root Directory**: `flask-backend`
   * **Runtime**: `Python` (or select `Docker` to use the provided `Dockerfile`).
   * **Build Command**: `pip install -r requirements.txt` (if using Python runtime).
   * **Start Command**: `gunicorn app:app` (if using Python runtime).
5. In **Environment Variables**, add:
   * `DATABASE_URL`: Your MySQL connection URI.
   * `JWT_SECRET`: A long random secret key.
   * `NODE_ENV`: `production`
   * `SMTP_USER` and `SMTP_PASSWORD`: For email functionality.

### 3. Frontend (React) to Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Connect your GitHub repository.
3. Configure the project:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
4. Add the following **Environment Variable**:
   * `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://sharadha-backend.onrender.com`).
5. Click **Deploy**.

---

## Option 3: Unified Deployment using Render Blueprint (`render.yaml`)

We have configured a `render.yaml` blueprint in the root of the workspace. You can use it to deploy the entire stack directly on Render.

1. Push your repository to GitHub.
2. In the Render Dashboard, go to **Blueprints** and click **New Blueprint Instance**.
3. Select your repository.
4. Render will parse the `render.yaml` file, ask for the `DATABASE_URL` of your remote MySQL database, and automatically deploy the frontend and backend.
