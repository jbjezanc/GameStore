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
- view price-change history for an existing game

The frontend uses a genre dropdown for create and edit.  
The backend exposes game and genre endpoints, and the frontend talks to the backend through the Vite development proxy.

## Tech Notes

- Backend target framework: `.NET 10`
- Frontend dev server: `Vite` on `http://localhost:5173`
- Backend dev URL: `http://localhost:5284`
- Frontend API proxy: `/api/* -> http://localhost:5284/*`
- Database: local SQLite file at `GameStore.Api/GameStore.db`
- RabbitMQ integration is available for asynchronous price-history recording

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

## Running RabbitMQ Locally (Optional)

RabbitMQ is only needed if you want to test asynchronous price-history recording.

The easiest local setup is with Docker:

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:management
```

RabbitMQ URLs:

- AMQP: `amqp://guest:guest@localhost:5672`
- Management UI: `http://localhost:15672`

Default login:

- username: `guest`
- password: `guest`

## Enabling RabbitMQ In The API

RabbitMQ is disabled by default so the app can run without a broker.

To enable it for local development, update [appsettings.Development.json](/Users/josip/Documents/General/DotNetTutorial/GameStore.Api/appsettings.Development.json:1):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "RabbitMq": {
    "Enabled": true
  }
}
```

Then restart the backend:

```bash
cd GameStore.Api
dotnet run
```

## API Overview

Main endpoints:

- `GET /games`
- `GET /games/{id}`
- `GET /games/{id}/price-history`
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

### `GET /games/{id}/price-history`

```json
[
  {
    "oldPrice": 59.99,
    "newPrice": 39.99,
    "changedAtUtc": "2026-04-22T08:30:00Z"
  }
]
```

## Optional RabbitMQ Flow

The project now includes a simple asynchronous price-history workflow:

1. update a game price through `PUT /games/{id}`
2. the API publishes a `game.price.changed` event
3. a background consumer reads that event from RabbitMQ
4. the consumer stores a `PriceHistory` record in SQLite

This keeps the user-facing update request simple while still demonstrating an event-driven side effect.

RabbitMQ is disabled by default so the app can still run without a broker.

To enable it, update the `RabbitMq` section in:

- `GameStore.Api/appsettings.json`
- or `GameStore.Api/appsettings.Development.json`

Default settings:

```json
{
  "RabbitMq": {
    "Enabled": false,
    "Uri": "amqp://guest:guest@localhost:5672",
    "Exchange": "gamestore.events",
    "Queue": "gamestore.price-history",
    "RoutingKey": "game.price.changed"
  }
}
```

To test the feature in the UI:

1. start RabbitMQ
2. enable RabbitMQ in `appsettings.Development.json`
3. restart the backend
4. edit a game and change its price
5. save the record
6. reopen the edit dialog and check the `Price History` section

Important:

- a history record is created only when the price actually changes
- create, delete, or update without a price change will not add a price-history entry

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
