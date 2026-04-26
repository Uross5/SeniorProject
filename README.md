# AGPPA (Basketball) – Fresh Download Guide

This repository is a **single ASP.NET Core Web API** that also serves a **static UI** (HTML/JS) from `Api/wwwroot/`.
The database is **MySQL 8** via Entity Framework Core migrations.

## Prerequisites

- **.NET SDK**: install .NET 9 (this project targets `net9.0`)
- **MySQL Server**: MySQL 8.x running locally (default port `3306`)
- Optional: **MySQL Workbench** (easier DB inspection)

## Step-by-step setup (first run)

### 1) Start MySQL and create credentials

You can use any MySQL user. The default config assumes:

- host: `localhost`
- port: `3306`
- user: `root`
- password: *(empty)*
- database: `basketball_agppa`

If your MySQL root **has a password** (common), update the connection string in `Api/appsettings.json`.

### 2) Configure the connection string

Edit:

- `Api/appsettings.json` → `ConnectionStrings:DefaultConnection`

Example:

```text
Server=localhost;Port=3306;Database=basketball_agppa;User=root;Password=YOUR_PASSWORD;
```

### 3) Build the API

From the `Api/` folder:

```bash
dotnet build
```

### 4) Run the API (also serves the UI)

From the `Api/` folder:

```bash
dotnet run
```

Default URLs (from `Api/Properties/launchSettings.json`):

- `http://localhost:5077`
- `https://localhost:7241`

On startup the app will:

- create the database if missing (`CREATE DATABASE IF NOT EXISTS ...`)
- apply EF Core migrations automatically
- seed a **Super Admin** user if none exists

### 5) Sign in (seeded super admin)

Credentials come from `Api/appsettings.json`:

- **username**: `admin`
- **password**: `Admin123!`

## Application actions (what to click / what should work)

Open the UI at `http://localhost:5077/` (or `https://localhost:7241/`).

### Public (no login required)

- **Home**: `/`
- **List teams**: `/teams.html` (GET `/api/teams`)
- **List athletes**: `/athletes.html` (GET `/api/athletes`)
- **List games + view game details**: `/games.html` (GET `/api/games`, GET `/api/games/{id}`)
- **Stats dashboard**: `/stats.html` (GET `/api/stats/summary`)

### Authentication

- **Sign in**: `/login.html` (POST `/api/auth/login`)
- **Register viewer** (read-only): `/login.html` (or `/register.html`) (POST `/api/auth/register`)
- **Get current user**: GET `/api/auth/me` (requires Bearer token)

### Super Admin actions (admin user)

After signing in as **SuperAdmin**:

- **Create/Edit/Delete teams**: `/teams.html`
- **Create/Edit/Delete athletes**: `/athletes.html`
- **Create/Edit/Delete games**: `/games.html`
- **Enter box score stats (PTS/REB/AST)**: `/games.html` → open a game → edit stats → Save
- **Manage users**: `/users.html`
  - create **TeamAdmin** (must select a team)
  - create **User** (viewer)
  - delete users (cannot delete yourself; cannot delete SuperAdmin from UI)

### Team Admin actions (scoped to one team)

Create a TeamAdmin in `/users.html`, then sign in as that TeamAdmin.

- **Teams**: can edit/delete **only their team**
- **Athletes**: can create/edit/delete **only athletes on their team**
- **Games**: can create/edit/delete games **only if their team is home or away**
- **Stats (box score)**: can edit stats **only for athletes on their team** (in games involving their team)

## API endpoints quick list

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/teams` / `GET /api/teams/{id}` / `POST /api/teams` / `PUT /api/teams/{id}` / `DELETE /api/teams/{id}`
- `GET /api/athletes` / `GET /api/athletes/{id}` / `POST /api/athletes` / `PUT /api/athletes/{id}` / `DELETE /api/athletes/{id}`
- `GET /api/games` / `GET /api/games/{id}` / `POST /api/games` / `PUT /api/games/{id}` / `DELETE /api/games/{id}`
- `PUT /api/games/{id}/stats` / `DELETE /api/games/{gameId}/stats/{athleteId}`
- `GET /api/stats/summary`
- `GET /api/users` / `POST /api/users` / `DELETE /api/users/{id}` (**SuperAdmin only**)

## Troubleshooting

- **App crashes on startup with “Unable to connect to any of the specified MySQL hosts.”**
  - MySQL isn’t running, or the host/port/user/password in `Api/appsettings.json` is wrong.
- **Login works but UI buttons don’t show**
  - The UI hides edit actions based on the role stored in browser localStorage. Sign out/sign in again.
- **HTTPS certificate prompt**
  - Use the HTTP URL (`http://localhost:5077`) if you don’t want to trust the dev cert.
