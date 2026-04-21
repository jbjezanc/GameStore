const GAMES_BASE_URL = "/api/games";
const GENRES_BASE_URL = "/api/genres";

function normalizeGameSummary(game) {
  return {
    id: game.id,
    name: game.name,
    genre: game.genre,
    price: Number(game.price),
    releaseDate: game.releaseDate
  };
}

function normalizeGameDetail(game) {
  return {
    id: game.id,
    name: game.name,
    genreId: game.genreId,
    price: Number(game.price),
    releaseDate: game.releaseDate
  };
}

function normalizeGenre(genre) {
  return {
    id: genre.id,
    name: genre.name
  };
}

function toBackendGamePayload(game) {
  return {
    name: game.name,
    genreId: Number(game.genreId),
    price: Number(game.price),
    releaseDate: game.releaseDate
  };
}

async function parseResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildErrorMessage(payload, status) {
  if (payload && typeof payload === "object") {
    if (payload.errors && typeof payload.errors === "object") {
      const messages = Object.entries(payload.errors).flatMap(([field, fieldErrors]) => {
        const values = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
        return values.map((message) => `${field}: ${message}`);
      });

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (typeof payload.title === "string" && payload.title) {
      return payload.title;
    }

    if (typeof payload.detail === "string" && payload.detail) {
      return payload.detail;
    }

    if (typeof payload.message === "string" && payload.message) {
      return payload.message;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return `Request failed with status ${status}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    ...options
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(payload, response.status));
  }

  if (response.status === 204) {
    return null;
  }

  return payload;
}

export async function fetchGames() {
  const payload = await request(GAMES_BASE_URL);

  return {
    games: payload.map(normalizeGameSummary),
    isMock: false
  };
}

export async function fetchGame(id) {
  const payload = await request(`${GAMES_BASE_URL}/${id}`);
  return normalizeGameDetail(payload);
}

export async function fetchGenres() {
  const payload = await request(GENRES_BASE_URL);
  return payload.map(normalizeGenre);
}

export async function createGame(game) {
  const payload = await request(GAMES_BASE_URL, {
    method: "POST",
    body: JSON.stringify(toBackendGamePayload(game))
  });

  return payload ? normalizeGameDetail(payload) : null;
}

export async function updateGame(id, game) {
  const payload = await request(`${GAMES_BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(toBackendGamePayload(game))
  });

  return payload ? normalizeGameDetail(payload) : null;
}

export async function deleteGame(id) {
  await request(`${GAMES_BASE_URL}/${id}`, {
    method: "DELETE"
  });
}
