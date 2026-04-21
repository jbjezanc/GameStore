# Game Store

Simple full-stack toy project built with:

- ASP.NET Core Minimal API
- Entity Framework Core
- SQLite
- React
- Vite

This project is intentionally small and simple. It is meant for learning, practice, and experimentation rather than production use.

## Project Structure

```text
DotNetTutorial/
├── GameStore.Api/         # ASP.NET backend
├── GameStoreFrontend/     # React + Vite frontend
├── GameStore.slnx
└── .gitignore
```

## What the App Does

The app is a small game store CRUD example.

You can:

- list games
- create a new game
- edit an existing game
- delete a game
- sort by name, genre, price, and release date

The frontend uses a genre dropdown for create and edit.  
The backend exposes game and genre endpoints, and the frontend talks to the backend through the Vite development proxy.

## Tech Notes

- Backend target framework: `.NET 10`
- Frontend dev server: `Vite` on `http://localhost:5173`
- Backend dev URL: `http://localhost:5284`
- Frontend API proxy: `/api/* -> http://localhost:5284/*`
- Database: local SQLite file at `GameStore.Api/GameStore.db`

## Prerequisites

Before running the project, make sure you have:

- `.NET 10 SDK`
- `Node.js`
- `npm`

## Running the App

Run the backend and frontend in two separate terminals.

### 1. Start the backend

```bash
cd GameStore.Api
dotnet run
```

The backend runs on:

```text
http://localhost:5284
```

### 2. Start the frontend

```bash
cd GameStoreFrontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the app in your browser:

```text
http://localhost:5173
```

## API Overview

Main endpoints:

- `GET /games`
- `GET /games/{id}`
- `POST /games`
- `PUT /games/{id}`
- `DELETE /games/{id}`
- `GET /genres`

Current response shapes used by the frontend:

### `GET /games`

```json
[
  {
    "id": 2,
    "name": "Street Fighter II Turbo Edition",
    "genre": "Fighting",
    "price": 18.99,
    "releaseDate": "1991-03-01"
  }
]
```

### `GET /games/{id}`

```json
{
  "id": 2,
  "name": "Street Fighter II Turbo Edition",
  "genreId": 1,
  "price": 18.99,
  "releaseDate": "1991-03-01"
}
```

### `GET /genres`

```json
[
  {
    "id": 1,
    "name": "Fighting"
  }
]
```

## Development Notes

- This project does not have a production setup yet.
- The frontend is intentionally simple and currently focused on basic CRUD behavior.
- The backend uses SQLite for now, which keeps the setup lightweight and easy to run locally.
- This is a good base for later experiments with PostgreSQL, RabbitMQ, or GraphQL.

## Useful Commands

### Backend

```bash
dotnet run
```

### Frontend

```bash
npm run dev
npm run build
```

## Status

This is still a toy example / learning project, not a production-ready application.
